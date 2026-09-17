import Database from 'better-sqlite3';
import { runMigrations } from './migrations';

/** Opens a SQLite database and applies idempotent schema migrations. */
export function createDatabase(databasePath: string): Database.Database {
  const database = new Database(databasePath);
  database.pragma('foreign_keys = ON');
  runMigrations(database);
  return database;
}
