
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS site_settings (
    site_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL
);

-- Events table, parameters: name, description, location, date
CREATE TABLE IF NOT EXISTS events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    event_date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    published_at TEXT,
    status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
    venue_id INTEGER,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
);

-- Store location, capacity
CREATE TABLE IF NOT EXISTS venues (
    venue_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    country TEXT,
    capacity INTEGER CHECK (capacity >= 0)
);

INSERT INTO venues (name, address, city, country, capacity)
VALUES
  ('Skandibooks Central Bookstore', 'Centralgatan 1', 'Stockholm', 'Sweden', 120),
  ('Skandibooks Bookstore', 'Storgatan 5', 'Gothenburg', 'Sweden', 90),
  ('Skandibooks Bookstore', 'Lilla Nygatan 7', 'Malmö', 'Sweden', 100),
  ('Skandibooks Bookstore', 'Biblioteksgatan 3', 'Uppsala', 'Sweden', 80),
  ('Skandibooks Bookstore', 'Akademigatan 2', 'Lund', 'Sweden', 75);

-- Ticket table, required parameters: type, price quanntity
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    price REAL NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

-- Booking event table, required parameters: name, email, ticket type, quantity
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    attendee_name TEXT NOT NULL,
    attendee_email TEXT NOT NULL,
    event_id INTEGER NOT NULL,
    ticket_type TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

-- Default site settings
INSERT INTO site_settings (name, description) 
VALUES ('Bookish Events', 'Events across all our stores');

COMMIT;