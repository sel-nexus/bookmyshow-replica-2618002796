import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';

/** Represents a durable authenticated moviegoer. */
export interface User {
  id: string;
  mobileNumber: string;
  createdAt: string;
}

/** Reads and writes durable users in SQLite. */
export class UserRepository {
  /** Creates a repository backed by the supplied SQLite database. */
  constructor(private readonly database: Database.Database) {}

  /** Finds a user by mobile number. */
  findByMobile(mobileNumber: string): User | undefined {
    const row = this.database.prepare('SELECT id, mobile_number, created_at FROM users WHERE mobile_number = ?').get(mobileNumber) as { id: string; mobile_number: string; created_at: string } | undefined;
    return row === undefined ? undefined : { id: row.id, mobileNumber: row.mobile_number, createdAt: row.created_at };
  }

  /** Finds an existing moviegoer or atomically creates their durable record. */
  findOrCreate(mobileNumber: string): User {
    const existing = this.findByMobile(mobileNumber);
    if (existing !== undefined) return existing;
    const user: User = { id: randomUUID(), mobileNumber, createdAt: new Date().toISOString() };
    try {
      this.database.prepare('INSERT INTO users (id, mobile_number, created_at) VALUES (?, ?, ?)').run(user.id, user.mobileNumber, user.createdAt);
      return user;
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        const concurrentUser = this.findByMobile(mobileNumber);
        if (concurrentUser !== undefined) return concurrentUser;
      }
      throw error;
    }
  }
}
