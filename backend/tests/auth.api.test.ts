import { existsSync, rmSync } from 'fs';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import type Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import type { AppConfig } from '../src/config';
import { createDatabase } from '../src/db/database';

const fixtures: Array<{ path: string; database: Database.Database }> = [];
const testConfig: AppConfig = { port: 3001, databasePath: '', sessionSecret: 'a-test-secret-that-is-long-enough', sessionCookieName: 'bms_session', corsOrigin: 'http://localhost:3000', cookieSecure: false };

function buildApp() {
  const path = join(tmpdir(), `auth-api-${randomUUID()}.sqlite`);
  const database = createDatabase(path);
  fixtures.push({ path, database });
  return { app: createApp({ database, appConfig: { ...testConfig, databasePath: path } }), database };
}

afterEach(() => {
  fixtures.splice(0).forEach(({ path, database }) => {
    database.close();
    if (existsSync(path)) rmSync(path);
  });
});

describe('authentication API', () => {
  it('returns OTP_REQUIRED only after a valid deliberate mobile-number login request', async () => {
    const response = await request(buildApp().app).post('/api/auth/login').send({ mobileNumber: '9876543210' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'OTP_REQUIRED' });
    expect(response.headers['x-request-id']).toBeTruthy();
  });

  it.each([
    ['missing mobileNumber', {}],
    ['wrong-type mobileNumber', { mobileNumber: 9876543210 }],
    ['empty mobileNumber', { mobileNumber: '' }],
    ['oversized mobileNumber', { mobileNumber: '9'.repeat(33) }],
  ])('returns 400 for login with %s', async (_label, body) => {
    const response = await request(buildApp().app).post('/api/auth/login').send(body);
    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({ code: 'INVALID_REQUEST', requestId: expect.any(String) });
  });

  it.each([
    ['missing mobileNumber', { otp: '1234' }],
    ['wrong-type mobileNumber', { mobileNumber: 9876543210, otp: '1234' }],
    ['empty mobileNumber', { mobileNumber: '', otp: '1234' }],
    ['oversized mobileNumber', { mobileNumber: '9'.repeat(33), otp: '1234' }],
    ['missing otp', { mobileNumber: '9876543210' }],
    ['wrong-type otp', { mobileNumber: '9876543210', otp: 1234 }],
    ['empty otp', { mobileNumber: '9876543210', otp: '' }],
    ['oversized otp safely rejected', { mobileNumber: '9876543210', otp: '1'.repeat(10_000) }],
  ])('returns 400 for verify with %s', async (_label, body) => {
    const response = await request(buildApp().app).post('/api/auth/verify').send(body);
    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({ code: 'INVALID_REQUEST', requestId: expect.any(String) });
  });

  it('returns 401 for an incorrect OTP without creating a user', async () => {
    const { app, database } = buildApp();
    const response = await request(app).post('/api/auth/verify').send({ mobileNumber: '9876543210', otp: '0000' });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('OTP_NOT_ACCEPTED');
    expect((database.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number }).count).toBe(0);
  });

  it('safely rejects SQL/XSS-shaped verification values without changing users', async () => {
    const { app, database } = buildApp();
    const response = await request(app).post('/api/auth/verify').send({ mobileNumber: "9876543210'; DROP TABLE users;--<script>", otp: '0000' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_REQUEST');
    expect((database.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number }).count).toBe(0);
  });

  it('creates one durable mobile-number user and returns token/cookie for OTP 1234', async () => {
    const { app, database } = buildApp();
    const response = await request(app).post('/api/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'AUTHENTICATED', sessionToken: expect.any(String), user: { mobileNumber: '9876543210' } });
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    const second = await request(app).post('/api/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' });
    expect(second.status).toBe(200);
    expect(second.body.user.id).toBe(response.body.user.id);
    expect((database.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number }).count).toBe(1);
  });
});
