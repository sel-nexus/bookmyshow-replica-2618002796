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
const config: AppConfig = { port: 3001, databasePath: '', sessionSecret: 'a-test-secret-that-is-long-enough', sessionCookieName: 'bms_session', corsOrigin: 'http://localhost:3000', cookieSecure: false };
const payload = { movieId: 'movie-paradise', theatreId: 'theatre-sandhya-70mm', seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD', totalPricePaise: 45000 };
function buildApp() {
  const path = join(tmpdir(), `booking-api-${randomUUID()}.sqlite`);
  const database = createDatabase(path);
  fixtures.push({ path, database });
  return { app: createApp({ database, appConfig: { ...config, databasePath: path } }), database };
}
async function agentWithSession(application: ReturnType<typeof buildApp>['app']) {
  const agent = request.agent(application);
  const login = await agent.post('/api/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' });
  expect(login.status).toBe(200);
  return agent;
}
afterEach(() => fixtures.splice(0).forEach(({ path, database }) => { database.close(); if (existsSync(path)) rmSync(path); }));

describe('booking API', () => {
  it('returns 401 with the error envelope for an unauthenticated valid booking', async () => {
    const response = await request(buildApp().app).post('/api/bookings').set('Idempotency-Key', randomUUID()).send(payload);
    expect(response.status).toBe(401);
    expect(response.body.error).toMatchObject({ code: 'UNAUTHENTICATED', requestId: expect.any(String) });
  });

  it.each([
    ['missing Idempotency-Key', payload, undefined],
    ['wrong-type movieId', { ...payload, movieId: 7 }, randomUUID()],
    ['missing movieId', { theatreId: payload.theatreId, seats: payload.seats, paymentMethod: 'CARD', totalPricePaise: 45000 }, randomUUID()],
    ['empty movieId', { ...payload, movieId: '' }, randomUUID()],
    ['oversized movieId', { ...payload, movieId: 'm'.repeat(10_000) }, randomUUID()],
    ['wrong-type theatreId', { ...payload, theatreId: 7 }, randomUUID()],
    ['missing theatreId', { movieId: payload.movieId, seats: payload.seats, paymentMethod: 'CARD', totalPricePaise: 45000 }, randomUUID()],
    ['empty theatreId', { ...payload, theatreId: '' }, randomUUID()],
    ['oversized theatreId', { ...payload, theatreId: 't'.repeat(10_000) }, randomUUID()],
    ['wrong-type seats', { ...payload, seats: 'A1' }, randomUUID()],
    ['missing seats', { movieId: payload.movieId, theatreId: payload.theatreId, paymentMethod: 'CARD', totalPricePaise: 45000 }, randomUUID()],
    ['empty seats', { ...payload, seats: [] }, randomUUID()],
    ['oversized seats', { ...payload, seats: Array.from({ length: 10_000 }, () => 'A1') }, randomUUID()],
    ['wrong-type paymentMethod', { ...payload, paymentMethod: 5 }, randomUUID()],
    ['missing paymentMethod', { movieId: payload.movieId, theatreId: payload.theatreId, seats: payload.seats, totalPricePaise: 45000 }, randomUUID()],
    ['empty paymentMethod', { ...payload, paymentMethod: '' }, randomUUID()],
    ['oversized paymentMethod', { ...payload, paymentMethod: 'CARD'.repeat(10_000) }, randomUUID()],
    ['wrong-type totalPricePaise', { ...payload, totalPricePaise: '45000' }, randomUUID()],
    ['missing totalPricePaise', { movieId: payload.movieId, theatreId: payload.theatreId, seats: payload.seats, paymentMethod: 'CARD' }, randomUUID()],
    ['empty totalPricePaise safely rejected', { ...payload, totalPricePaise: 0 }, randomUUID()],
    ['non-UUID Idempotency-Key', payload, 'not-a-uuid'],
    ['empty Idempotency-Key', payload, ''],
    ['oversized Idempotency-Key', payload, 'x'.repeat(10_000)],
  ])('returns 400 for %s', async (_label, body, key) => {
    const { app } = buildApp();
    const agent = await agentWithSession(app);
    const response = await agent.post('/api/bookings').set('Idempotency-Key', key ?? '').send(body);
    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({ code: 'INVALID_REQUEST', requestId: expect.any(String) });
  });

  it('returns 409 for a valid but noncanonical mapping, seat list, and price', async () => {
    const { app } = buildApp();
    const agent = await agentWithSession(app);
    for (const body of [{ ...payload, theatreId: 'theatre-allu-cinemas' }, { ...payload, seats: ['A1'] }, { ...payload, totalPricePaise: 1 }]) {
      const response = await agent.post('/api/bookings').set('Idempotency-Key', randomUUID()).send(body);
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CANONICAL_BOOKING_MISMATCH');
    }
  });

  it('safely rejects SQL/XSS-shaped booking values without persisting a booking', async () => {
    const { app, database } = buildApp();
    const agent = await agentWithSession(app);
    const response = await agent.post('/api/bookings').set('Idempotency-Key', randomUUID()).send({ ...payload, movieId: "movie-paradise'; DROP TABLE bookings;--<script>" });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CANONICAL_BOOKING_MISMATCH');
    expect((database.prepare('SELECT COUNT(*) AS count FROM bookings').get() as { count: number }).count).toBe(0);
  });

  it('returns canonical conflict errors and stable 201 replay confirmations', async () => {
    const { app, database } = buildApp();
    const agent = await agentWithSession(app);
    const key = randomUUID();
    const first = await agent.post('/api/bookings').set('Idempotency-Key', key).send(payload);
    const replay = await agent.post('/api/bookings').set('Idempotency-Key', key).send(payload);
    expect(first.status).toBe(201);
    expect(replay.status).toBe(201);
    expect(replay.body.booking.confirmationId).toBe(first.body.booking.confirmationId);
    const changed = await agent.post('/api/bookings').set('Idempotency-Key', key).send({ ...payload, paymentMethod: 'UPI' });
    expect(changed.status).toBe(409);
    expect(changed.body.error.code).toBe('IDEMPOTENCY_KEY_PAYLOAD_MISMATCH');
    expect((database.prepare('SELECT COUNT(*) AS count FROM bookings').get() as { count: number }).count).toBe(1);
  });
});
