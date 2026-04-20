### Event Management Web App ###

This project is a simple event management system where organisers can create and manage events, and attendees can browse and book tickets.

I built it as part of my University of London coursework (Database Networks and the Web). It is a full web application, end-to-end from routing and database design to user flows and things like ticket availability updates.

### Key functionality ###

- Events can have multiple ticket types (e.g. standard, student)
- Each ticket type has limited availability
- Booking reduces available tickets in real time
- Only published events are visible to attendees

### How to run the project ###

- Install dependencies: ```npm install```

- Create the database:

  Mac / Linux:
  ```npm run build-db```
        
  Windows:
  ```npm run build-db-win```

- Start the server: ```npm start```

- Open in browser: http://localhost:3000


To reset database:  

Mac / Linux: 
        ```npm run clean-db```  
        
Windows: 
        ```npm run clean-db-win```


### Folder Structure ###

`/routes/`  
    `organiser.js` — Event and ticket management.  
    `attendee.js` — Booking logic.

`/views/` — EJS templates (UI)  

`/public/` — CSS

`/db_schema.sql` — Database schema.

`/index.js` — Main app entry point.

`/package.json` — Dependencies and scripts.

### Technical Summary ###

- Backend: Node.js + Express
- Templating: EJS (server-side rendering)
- Database: SQLite3

### Future Improvements ###

- Organisers page: add login system. Show bookings statistics. 
- Auto calculation for discounted price for member and student tickets.
- Attendee page: filter events by data, category, location.
- Members sign up page.
