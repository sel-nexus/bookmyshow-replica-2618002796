import { randomUUID } from 'crypto';
import { existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { AuthService } from '../src/auth/authService';
import { SessionService } from '../src/auth/sessionService';
import { UserRepository } from '../src/auth/userRepository';
import { runMigrations } from '../src/db/migrations';

const databases: Database.Database[] = [];
const files: string[] = [];

/** Builds an isolated file-backed authentication service for each test. */
function buildService(): { service: AuthService; users: UserRepository } {
  const path = join(tmpdir(), `auth-service-${randomUUID()}.sqlite`);
  files.push(path);
  const database = new Database(path);
  databases.push(database);
  runMigrations(database);
  const users = new UserRepository(database);
  return { service: new AuthService(users, new SessionService('a-test-secret-that-is-long-enough')), users };
}

afterEach(() => { databases.splice(0).forEach((database) => database.close()); files.splice(0).forEach((path) => { if (existsSync(path)) rmSync(path); }); });

describe('AuthService', () => {
  it('creates a durable mobile-number user and session for OTP 1234', () => {
    const { service, users } = buildService();
    const result = service.verify('9876543210', '1234');
    expect(result.sessionToken).toBeTypeOf('string');
    expect(users.findByMobile('9876543210')).toMatchObject({ id: result.user.id, mobileNumber: '9876543210' });
  });

  it('rejects an incorrect OTP without creating a user', () => {
    const { service, users } = buildService();
    expect(() => service.verify('9876543210', '0000')).toThrow('verification code is incorrect');
    expect(users.findByMobile('9876543210')).toBeUndefined();
  });
});
