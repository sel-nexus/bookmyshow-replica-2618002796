import { existsSync, rmSync } from 'fs';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import type { AppConfig } from '../src/config';
import { createDatabase } from '../src/db/database';

const paths: string[] = []; const config: AppConfig = { port: 3001, databasePath: '', sessionSecret: 'a-test-secret-that-is-long-enough', sessionCookieName: 'bms_session', corsOrigin: 'http://localhost:3000', cookieSecure: false };
const payload = { movieId: 'movie-paradise', theatreId: 'theatre-sandhya-70mm', seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD', totalPricePaise: 45000 };
function app() { const path = join(tmpdir(), `booking-api-${randomUUID()}.sqlite`); paths.push(path); return createApp({ database: createDatabase(path), appConfig: { ...config, databasePath: path } }); }
async function agentWithSession(application: ReturnType<typeof app>) { const agent = request.agent(application); await agent.post('/api/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' }); return agent; }
afterEach(() => paths.splice(0).forEach((path) => { if (existsSync(path)) rmSync(path); }));

describe('booking API', () => {
  it('rejects unauthenticated and malformed booking confirmation attempts', async () => {
    const application = app();
    expect((await request(application).post('/api/bookings').set('Idempotency-Key', randomUUID()).send(payload)).body.error.code).toBe('UNAUTHENTICATED');
    const agent = await agentWithSession(application); const invalid = await agent.post('/api/bookings').send(payload);
    expect(invalid.status).toBe(400); expect(invalid.body.error.code).toBe('INVALID_REQUEST');
  });
  it('returns canonical conflict errors and stable 201 replay confirmations', async () => {
    const application = app(); const agent = await agentWithSession(application); const key = randomUUID();
    const mismatch = await agent.post('/api/bookings').set('Idempotency-Key', randomUUID()).send({ ...payload, seats: ['A1'] });
    expect(mismatch.body.error.code).toBe('CANONICAL_BOOKING_MISMATCH');
    const first = await agent.post('/api/bookings').set('Idempotency-Key', key).send(payload); const replay = await agent.post('/api/bookings').set('Idempotency-Key', key).send(payload);
    expect(first.status).toBe(201); expect(replay.status).toBe(201); expect(replay.body.booking.confirmationId).toBe(first.body.booking.confirmationId);
    const changed = await agent.post('/api/bookings').set('Idempotency-Key', key).send({ ...payload, paymentMethod: 'UPI' });
    expect(changed.status).toBe(409); expect(changed.body.error.code).toBe('IDEMPOTENCY_KEY_PAYLOAD_MISMATCH');
  });
});
