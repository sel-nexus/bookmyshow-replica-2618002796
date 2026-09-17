import type Database from 'better-sqlite3';

/** Creates the durable schema required for mobile OTP authentication. */
export function runMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      mobile_number TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );
  `);
}
