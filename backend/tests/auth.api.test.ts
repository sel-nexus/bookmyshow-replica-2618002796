import { existsSync, rmSync } from 'fs';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import type { AppConfig } from '../src/config';
import { createDatabase } from '../src/db/database';

const files: string[] = [];
const testConfig: AppConfig = { port: 3001, databasePath: '', sessionSecret: 'a-test-secret-that-is-long-enough', sessionCookieName: 'bms_session', corsOrigin: 'http://localhost:3000', cookieSecure: false };

/** Creates an API app backed by a unique temporary SQLite file. */
function buildApp() {
  const path = join(tmpdir(), `auth-api-${randomUUID()}.sqlite`);
  files.push(path);
  return createApp({ database: createDatabase(path), appConfig: { ...testConfig, databasePath: path } });
}

afterEach(() => { files.splice(0).forEach((path) => { if (existsSync(path)) rmSync(path); }); });

describe('authentication API', () => {
  it('returns OTP_REQUIRED only after a valid deliberate mobile-number login request', async () => {
    const response = await request(buildApp()).post('/api/auth/login').send({ mobileNumber: '9876543210' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'OTP_REQUIRED' });
    expect(response.headers['x-request-id']).toBeTruthy();
  });

  it('returns 400 with the error envelope for missing mobile number', async () => {
    const response = await request(buildApp()).post('/api/auth/login').send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({ code: 'INVALID_REQUEST', requestId: expect.any(String) });
  });

  it('returns OTP_NOT_ACCEPTED for an incorrect OTP without creating a user', async () => {
    const response = await request(buildApp()).post('/api/auth/verify').send({ mobileNumber: '9876543210', otp: '0000' });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('OTP_NOT_ACCEPTED');
  });

  it('creates one durable mobile-number user and returns token/cookie for OTP 1234', async () => {
    const app = buildApp();
    const response = await request(app).post('/api/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'AUTHENTICATED', sessionToken: expect.any(String), user: { mobileNumber: '9876543210' } });
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    const second = await request(app).post('/api/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' });
    expect(second.body.user.id).toBe(response.body.user.id);
  });
});
