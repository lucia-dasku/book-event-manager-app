const express = require("express");
const router = express.Router();

/**
 * @desc Organiser home page that displays site information and lists draft and published events
 * @input None
 * @output Queries site_settings, events, and tickets,
 *         then renders organiser-home.ejs with site, event, and ticket data
 */
router.get("/home", (req, res, next) => {
    const siteQuery = `
        SELECT * 
        FROM site_settings LIMIT 1;
    `;

    const draftQuery = `
        SELECT 
            events.*, 
            venues.name AS venue_name,
            venues.city AS venue_city
        FROM events
        LEFT JOIN venues ON events.venue_id = venues.venue_id
        WHERE status = 'draft';
    `;

    const publishedQuery = `
        SELECT 
            events.*, 
            venues.name AS venue_name,
            venues.city AS venue_city
        FROM events
        LEFT JOIN venues ON events.venue_id = venues.venue_id
        WHERE status = 'published';
    `;

    const ticketsSummaryQuery = `
        SELECT 
            event_id, 
            type, price, 
            quantity 
        FROM tickets
    `;

    // Retrieve site title and description
    global.db.get(siteQuery, [], (err, site) => {
        if (err) return next(err);

        // Retrieve draft events
        global.db.all(draftQuery, [], (err, drafts) => {
            if (err) return next(err);

            // Retrieve published events
            global.db.all(publishedQuery, [], (err, published) => {
                if (err) return next(err);

                // Retrieve ticket data for all events
                global.db.all(ticketsSummaryQuery, [], (err, tickets) => {
                    if (err) return next(err);

                    // Group tickets by event_id
                    const ticketMap = {};
                    tickets.forEach(ticket => {
                        if (!ticketMap[ticket.event_id]) {
                            ticketMap[ticket.event_id] = [];
                        }
                        ticketMap[ticket.event_id].push(ticket);
                    });

                    // Render the organiser dashboard
                    res.render("organiser-home", {
                        site,
                        drafts,
                        published,
                        ticketMap
                    });
                });
            });
        });
    });
});

/**
 * @desc Creates a new draft event and redirects to its edit page
 * @input None
 * @output Inserts a new row into the events table
 *         and redirects to /organiser/edit/:id for the new event
 */
router.post("/create", (req, res, next) => {
    const query = `
        INSERT INTO events (title, description, event_date, status, venue_id)
        VALUES ('Untitled Event', '', '2025-12-31', 'draft', NULL)
    `;

    // Run the insert query
    global.db.run(query, function (err) {
        if (err) return next(err);

        // Redirect to the edit page for the newly created event
        res.redirect(`/organiser/edit/${this.lastID}`);
    });
});

/**
 * @desc Displays the edit page for a selected event
 * @input The ID of the event to edit
 * @output Retrieves the selected event, its tickets, and all venues,
 *         then renders organiser-edit.ejs with the event data
 */
router.get("/edit/:id", (req, res, next) => {
    const eventId = req.params.id;
    const saved = req.query.saved === 'true';

    // Retrieve the selected event by ID
    global.db.get("SELECT * FROM events WHERE event_id = ?", [eventId], (err, event) => {
        if (err) return next(err);
        if (!event) return res.status(404).send("Event not found");

        // Retrieve all tickets for that event
        global.db.all("SELECT * FROM tickets WHERE event_id = ?", [eventId], (err, tickets) => {
            if (err) return next(err);

            // Retrieve all venues for the dropdown list
            global.db.all("SELECT * FROM venues", [], (err, venues) => {
                if (err) return next(err);

                res.render("organiser-edit", {
                    event,
                    tickets,
                    venues,
                    confirmation: saved ? "Saved!" : null
                });
            });
        });
    });
});

/**
 * @desc Saves updates made to an event
 * @input The ID of the event being edited
 * @output Updates the corresponding row in the events table
 *         and redirects back to the edit page with a saved message
 */
router.post("/edit/:id", (req, res, next) => {
    const { title, description, event_date, venue_id } = req.body;
    const eventId = req.params.id;

    if (!title || !event_date || !venue_id) {
        return res.status(400).send("Title, date, and venue are required.");
    }

    const updateQuery = `
        UPDATE events
        SET title = ?, description = ?, event_date = ?, venue_id = ?
        WHERE event_id = ?
    `;

    global.db.run(updateQuery, [title, description, event_date, venue_id, eventId], function (err) {
        if (err) return next(err);

        res.redirect(`/organiser/edit/${eventId}?saved=true`);
    });
});

/**
 * @desc Publishes a draft event by setting its status to published
 * @input The ID of the event to publish
 * @output Checks that the event exists, has a venue, and has at least one ticket type,
 *         then updates the event status and published_at timestamp,
 *         and redirects to organiser-home
 */
router.post("/publish/:id", (req, res, next) => {
    const eventId = req.params.id;

    const eventQuery = `
        SELECT * 
        FROM events
        WHERE event_id = ?
    `;

    const ticketQuery = `
        SELECT COUNT(*) AS ticketCount
        FROM tickets
        WHERE event_id = ?
    `;

    global.db.get(eventQuery, [eventId], (err, event) => {
        if (err) return next(err);
        if (!event) return res.status(404).send("Event not found");

        if (!event.venue_id) {
            return res.status(400).send("Cannot publish event without a venue.");
        }

        global.db.get(ticketQuery, [eventId], (err, result) => {
            if (err) return next(err);

            if (!result || result.ticketCount < 1) {
                return res.status(400).send("Cannot publish event without at least one ticket type.");
            }

            const publishQuery = `
                UPDATE events
                SET status = 'published', published_at = datetime('now')
                WHERE event_id = ?
            `;

            global.db.run(publishQuery, [eventId], function (err) {
                if (err) return next(err);

                res.redirect("/organiser/home");
            });
        });
    });
});

/**
 * @desc Adds a ticket type to an event
 * @input The ID of the event and the submitted ticket type, price, and quantity
 * @output If the ticket type already exists for the event, updates its price and quantity.
 *         Otherwise, inserts a new ticket row into the tickets table.
 *         Then redirects back to the organiser edit page.
 */
router.post("/add-ticket/:id", (req, res, next) => {
    const eventId = req.params.id;
    const { type, price, quantity } = req.body;

    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseInt(quantity, 10);

    if (!type || isNaN(parsedPrice) || parsedPrice < 0 || isNaN(parsedQuantity) || parsedQuantity < 1) {
        return res.status(400).send("Invalid ticket details.");
    }

    const checkQuery = `
        SELECT * 
        FROM tickets
        WHERE event_id = ? AND type = ?
    `;

    global.db.get(checkQuery, [eventId, type], (err, existingTicket) => {
        if (err) return next(err);

        if (existingTicket) {
            const updateQuery = `
                UPDATE tickets
                SET price = ?, quantity = quantity + ?
                WHERE event_id = ? AND type = ?
            `;

            global.db.run(updateQuery, [parsedPrice, parsedQuantity, eventId, type], function (err) {
                if (err) return next(err);
                res.redirect(`/organiser/edit/${eventId}`);
            });
        } else {
            const insertQuery = `
                INSERT INTO tickets (event_id, type, price, quantity)
                VALUES (?, ?, ?, ?)
            `;

            global.db.run(insertQuery, [eventId, type, parsedPrice, parsedQuantity], function (err) {
                if (err) return next(err);
                res.redirect(`/organiser/edit/${eventId}`);
            });
        }
    });
});

/**
 * @desc Deletes an event and its related bookings and tickets
 * @input The ID of the event to delete
 * @output Checks that the event exists,
 *         deletes related bookings and tickets first,
 *         then deletes the event itself,
 *         and redirects to organiser-home
 */
router.post("/delete/:id", (req, res, next) => {
    const eventId = req.params.id;

    const checkEventQuery = `
        SELECT * 
        FROM events
        WHERE event_id = ?
    `;

    const deleteBookingsQuery = `
        DELETE FROM bookings
        WHERE event_id = ?
    `;

    const deleteTicketsQuery = `
        DELETE FROM tickets
        WHERE event_id = ?
    `;

    const deleteEventQuery = `
        DELETE FROM events
        WHERE event_id = ?
    `;

    global.db.get(checkEventQuery, [eventId], (err, event) => {
        if (err) return next(err);
        if (!event) return res.status(404).send("Event not found");

        global.db.run(deleteBookingsQuery, [eventId], function (err) {
            if (err) return next(err);

            global.db.run(deleteTicketsQuery, [eventId], function (err) {
                if (err) return next(err);

                global.db.run(deleteEventQuery, [eventId], function (err) {
                    if (err) return next(err);

                    res.redirect("/organiser/home");
                });
            });
        });
    });
});

module.exports = router;