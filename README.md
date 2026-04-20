### Event Management Web App ###

This project is a simple event management system where organisers can create and manage events, and attendees can browse and book tickets.

I built it as part of my University of London coursework (Database Networks and the Web). It is a full web application, end-to-end from routing and database design to user flows and things like ticket availability updates.

### Key functionality ###

- Events can have multiple ticket types (e.g. standard, student)
- Each ticket type has limited availability
- Booking reduces available tickets in real time
- Only published events are visible to attendees

### How to run the project ###

Install dependencies:

```npm install```

Create the database:

# Mac / Linux
```npm run build-db```

# Windows
```npm run build-db-win```

Start the server:

```npm start```

Open in browser:

http://localhost:3000

To reset database: 
```npm run clean-db``` on Mac or Linux
```npm run clean-db-win``` on Windows

#### Folder Structure ####

`/routes/`
    `organiser.js` — Organiser routes and event/ticket logic.
    `attendee.js` — Attendee routes and booking logic.

`/views/`
    `organiser-home.ejs` — The organiser dashboard to create, manage and published events.
    `organiser-edit.ejs` — Form interface for editing an event and managing ticket types.
    `attendee-home.ejs` — List of all published events available to book.
    `attendee-event.ejs` — Booking form where attendee can purchase tickets for an event.
    `main-home.ejs` — The landing page.

`/public/`
    `main.css` — Shared stylesheet across all pages, defining buttons, forms, spacing, and general design.

`/db_schema.sql` — SQL script that builds the SQLite database.

`/index.js` — Main app entry point. Sets Express, middleware, routes, and database connection.

`/package.json` — Defines project dependencies and scripts.

`/README.md` — Project documentation file.


#### Technical Summary ####

- Backend: Node.js + Express
- Templating: EJS (server-side rendering)
- Database: SQLite3

#### Future Improvements ####

- Organisers page: add login system. Show bookings statistics. 
- Auto calculation for discounted price for member and student tickets.
- Attendee page: filter events by data, category, location.
- Members sign up page.
