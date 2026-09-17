import type Database from 'better-sqlite3';

/** Creates the durable schema required for mobile OTP authentication. */
export function runMigrations(database: Database.Database): void {
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
  seedCatalogue();
}
