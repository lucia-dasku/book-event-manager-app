const express = require("express");
const router = express.Router();

/**
 * @desc Attendee home page that lists all published events
 * @input None
 * @output Queries site_settings for the site title and description,
 *         queries the events table for published events,
 *         and renders attendee-home.ejs with site information and event data
 */
router.get("/home", (req, res, next) => {
    const siteQuery = `
        SELECT * 
        FROM site_settings LIMIT 1;
    `;

    const eventsQuery = `
        SELECT 
            events.*, 
            venues.name AS venue_name, 
            venues.address, 
            venues.city, 
            venues.country
        FROM events
        LEFT JOIN venues ON events.venue_id = venues.venue_id
        WHERE status = 'published'
        ORDER BY event_date ASC
    `;

    const ticketsQuery = `
        SELECT 
            event_id, 
            type, price, 
            quantity FROM tickets
    `;

    // Retrieve site settings first
    global.db.get(siteQuery, [], (err, site) => {
        if (err) return next(err);

        // Retrieve all published events
        global.db.all(eventsQuery, [], (err, events) => {
            if (err) return next(err);

            // Retrieve all tickets
            global.db.all(ticketsQuery, [], (err, tickets) => {
                if (err) return next(err);

                // Group tickets by event_id
                const ticketMap = {};
                tickets.forEach(ticket => {
                    if (!ticketMap[ticket.event_id]) {
                        ticketMap[ticket.event_id] = [];
                    }
                    ticketMap[ticket.event_id].push(ticket);
                });

                // Render the attendee home page with grouped ticket data
                res.render("attendee-home", {
                    site,
                    events,
                    ticketMap
                });
            });
        });
    });
});

/**
 * @desc Displays event details and the booking form
 * @input The ID of the event to view
 * @output Queries the events and tickets tables,
 *         then renders attendee-event.ejs with event details and ticket options
 */
router.get("/event/:id", (req, res, next) => {
    const eventId = req.params.id;

    const eventQuery = `
        SELECT 
            events.*, 
            venues.name AS venue_name, 
            venues.address, 
            venues.city, 
            venues.country
        FROM events
        LEFT JOIN venues ON events.venue_id = venues.venue_id
        WHERE event_id = ? AND status = 'published'
    `;

    const ticketQuery = `
        SELECT * 
        FROM tickets 
        WHERE event_id = ?
    `;

    global.db.get(eventQuery, [eventId], (err, event) => {
        if (err) return next(err);
        if (!event) return res.status(404).send("Published event not found");

        global.db.all(ticketQuery, [eventId], (err, tickets) => {
            if (err) return next(err);

            res.render("attendee-event", {
                event,
                tickets,
                successMessage: null,
                errorMessage: null
            });
        });
    });
});

/**
 * @desc Processes a ticket booking
 * @input The ID of the event to book
 * @output Checks ticket availability.
 *         If tickets are available, inserts a booking into the bookings table,
 *         updates the ticket quantity in the tickets table,
 *         and renders attendee-event.ejs with a confirmation message.
 *         If tickets are not available, renders the page with an error message.
 */
router.post("/event/:id", (req, res, next) => {
    const eventId = req.params.id;
    const { attendee_name, attendee_email, ticket_type, quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (!attendee_name || !attendee_email || !ticket_type || !qty || qty < 1) {
        return res.status(400).send("Invalid booking details.");
    }

    const eventQuery = `
        SELECT 
            events.*, 
            venues.name AS venue_name, 
            venues.address, 
            venues.city, 
            venues.country
        FROM events
        LEFT JOIN venues ON events.venue_id = venues.venue_id
        WHERE event_id = ? AND status = 'published'
    `;

    const ticketQuery = `
        SELECT * 
        FROM tickets 
        WHERE event_id = ?
    `;

    const checkQuery = `
        SELECT quantity
        FROM tickets
        WHERE event_id = ? AND type = ?
    `;

    // Retrieve the selected published event
    global.db.get(eventQuery, [eventId], (err, event) => {
        if (err) return next(err);
        if (!event) return res.status(404).send("Published event not found");

        // Check whether the requested ticket type has enough availability
        global.db.get(checkQuery, [eventId, ticket_type], (err, ticket) => {
            if (err) return next(err);

            if (!ticket || ticket.quantity < qty) {
                return global.db.all(ticketQuery, [eventId], (err, tickets) => {
                    if (err) return next(err);

                    res.render("attendee-event", {
                        event,
                        tickets,
                        successMessage: null,
                        errorMessage: "Not enough tickets available."
                    });
                });
            }

            // Insert the booking into the bookings table
            const bookQuery = `
                INSERT INTO bookings (attendee_name, attendee_email, event_id, ticket_type, quantity)
                VALUES (?, ?, ?, ?, ?)
            `;

            global.db.run(bookQuery, [attendee_name, attendee_email, eventId, ticket_type, qty], function (err) {
                if (err) return next(err);

                // Reduce the available ticket quantity
                const updateQuery = `
                    UPDATE tickets
                    SET quantity = quantity - ?
                    WHERE event_id = ? AND type = ?
                `;

                global.db.run(updateQuery, [qty, eventId, ticket_type], function (err) {
                    if (err) return next(err);

                    // Re-fetch ticket data and render the page with a success message
                    global.db.all(ticketQuery, [eventId], (err, tickets) => {
                        if (err) return next(err);

                        res.render("attendee-event", {
                            event,
                            tickets,
                            successMessage: `Thank you, ${attendee_name}! Your booking is confirmed.`,
                            errorMessage: null
                        });
                    });
                });
            });
        });
    });
});

module.exports = router;