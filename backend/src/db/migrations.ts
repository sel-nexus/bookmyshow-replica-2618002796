import type Database from 'better-sqlite3';
import { config } from '../config';

/** Creates the durable schema required for mobile OTP authentication. */
export function runMigrations(database: Database.Database, catalogueEmpty = config.catalogueEmpty): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      mobile_number TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS movies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL UNIQUE,
      display_order INTEGER NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS theatres (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      display_order INTEGER NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS movie_theatres (
      movie_id TEXT NOT NULL PRIMARY KEY REFERENCES movies(id),
      theatre_id TEXT NOT NULL UNIQUE REFERENCES theatres(id)
    );
    CREATE TABLE IF NOT EXISTS bookings (
      confirmation_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      idempotency_key TEXT NOT NULL,
      payload_fingerprint TEXT NOT NULL,
      movie_id TEXT NOT NULL REFERENCES movies(id),
      theatre_id TEXT NOT NULL REFERENCES theatres(id),
      seats_json TEXT NOT NULL CHECK (seats_json = '["A1","A2","A3"]'),
      payment_method TEXT NOT NULL CHECK (payment_method IN ('CARD', 'UPI')),
      total_price_paise INTEGER NOT NULL CHECK (total_price_paise = 45000),
      created_at TEXT NOT NULL,
      UNIQUE (user_id, idempotency_key)
    );
  `);
  const insertMovie = database.prepare('INSERT OR IGNORE INTO movies (id, title, display_order) VALUES (?, ?, ?)');
  const insertTheatre = database.prepare('INSERT OR IGNORE INTO theatres (id, name, display_order) VALUES (?, ?, ?)');
  const insertMapping = database.prepare('INSERT OR IGNORE INTO movie_theatres (movie_id, theatre_id) VALUES (?, ?)');
  const seedCatalogue = database.transaction(() => {
    insertMovie.run('movie-paradise', 'Paradise', 1);
    insertMovie.run('movie-bloody-romeo', 'Bloody Romeo', 2);
    insertMovie.run('movie-og2', 'OG2', 3);
    insertTheatre.run('theatre-sandhya-70mm', 'Sandhya 70mm', 1);
    insertTheatre.run('theatre-sudharsham-70mm', 'Sudharsham 70mm', 2);
    insertTheatre.run('theatre-allu-cinemas', 'Allu Cinemas', 3);
    insertMapping.run('movie-paradise', 'theatre-sandhya-70mm');
    insertMapping.run('movie-bloody-romeo', 'theatre-sudharsham-70mm');
    insertMapping.run('movie-og2', 'theatre-allu-cinemas');
  });
  if (!catalogueEmpty) seedCatalogue();
}
