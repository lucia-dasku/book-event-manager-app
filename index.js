/**
 * index.js
 * Main entry point of the application
 */

// Set up Express, body-parser, and EJS
const express = require('express');
const app = express();
const port = 3000;
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); // Configure EJS as the view engine
app.use(express.static(__dirname + '/public')); // Serve static files from the public folder

// Set up SQLite
// Items in the global namespace are accessible throughout the Node application
const sqlite3 = require('sqlite3').verbose();
global.db = new sqlite3.Database('./database.db', function (err) {
    if (err) {
        console.error(err);
        process.exit(1); // Exit if the database connection fails
    } else {
        console.log("Database connected");
        global.db.run("PRAGMA foreign_keys=ON"); // Enforce foreign key constraints in SQLite
    }
});

// Handle requests to the home page
app.get('/', (req, res) => {
    res.render('home');
});

// Add all route handlers from organiserRoutes under the /organiser path
const organiserRoutes = require('./routes/organiser');
app.use('/organiser', organiserRoutes);

// Add all route handlers from attendeeRoutes under the /attendee path
const attendeeRoutes = require('./routes/attendee');
app.use('/attendee', attendeeRoutes);

// Start the web application and listen for HTTP requests
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});