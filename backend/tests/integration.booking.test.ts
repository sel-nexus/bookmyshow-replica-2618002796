import { existsSync, rmSync } from 'fs';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import type Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { createDatabase } from '../src/db/database';

const fixtures: Array<{ path: string; database: Database.Database }> = [];
function buildApp() {
  const path = join(tmpdir(), `booking-integration-${randomUUID()}.sqlite`);
  const database = createDatabase(path);
  fixtures.push({ path, database });
  return { app: createApp({ database, appConfig: { port: 3001, databasePath: path, sessionSecret: 'a-test-secret-that-is-long-enough', sessionCookieName: 'bms_session', corsOrigin: 'http://localhost:3000', cookieSecure: false } }), database };
}
afterEach(() => fixtures.splice(0).forEach(({ path, database }) => { database.close(); if (existsSync(path)) rmSync(path); }));

describe('authentication to catalogue to booking integration', () => {
  it('chains auth, catalogue, and booking then verifies the durable non-orphaned state in SQLite', async () => {
    const { app, database } = buildApp();
    const agent = request.agent(app);
    const auth = await agent.post('/api/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' });
    expect(auth.status).toBe(200);
    const movies = await agent.get('/api/movies');
    expect(movies.status).toBe(200);
    const movie = movies.body.movies[0];
    const theatres = await agent.get('/api/theatres').query({ movieId: movie.id });
    expect(theatres.status).toBe(200);
    const theatre = theatres.body.theatres[0];
    const booking = await agent.post('/api/bookings').set('Idempotency-Key', randomUUID()).send({ movieId: movie.id, theatreId: theatre.id, seats: ['A1', 'A2', 'A3'], paymentMethod: 'UPI', totalPricePaise: 45000 });
    expect(booking.status).toBe(201);
    expect(booking.body.booking).toMatchObject({ movie: { title: movie.title }, theatre: { name: theatre.name } });
    const stored = database.prepare(`SELECT b.user_id, b.movie_id, b.theatre_id, b.seats_json, b.total_price_paise
      FROM bookings b JOIN users u ON u.id = b.user_id JOIN movies m ON m.id = b.movie_id JOIN theatres t ON t.id = b.theatre_id
      WHERE b.confirmation_id = ?`).get(booking.body.booking.confirmationId) as { user_id: string; movie_id: string; theatre_id: string; seats_json: string; total_price_paise: number };
    expect(stored).toMatchObject({ user_id: auth.body.user.id, movie_id: movie.id, theatre_id: theatre.id, seats_json: '["A1","A2","A3"]', total_price_paise: 45000 });
    expect((database.prepare('SELECT COUNT(*) AS count FROM bookings WHERE user_id NOT IN (SELECT id FROM users) OR movie_id NOT IN (SELECT id FROM movies) OR theatre_id NOT IN (SELECT id FROM theatres)').get() as { count: number }).count).toBe(0);
  });

  it('returns explicit failures for unauthenticated and invalid-mapping requests without orphan bookings', async () => {
    const { app, database } = buildApp();
    const unauthenticated = await request(app).post('/api/bookings').set('Idempotency-Key', randomUUID()).send({ movieId: 'movie-paradise', theatreId: 'theatre-sandhya-70mm', seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD', totalPricePaise: 45000 });
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.body.error.code).toBe('UNAUTHENTICATED');
    const agent = request.agent(app);
    const auth = await agent.post('/api/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' });
    expect(auth.status).toBe(200);
    const invalidMapping = await agent.post('/api/bookings').set('Idempotency-Key', randomUUID()).send({ movieId: 'movie-paradise', theatreId: 'theatre-allu-cinemas', seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD', totalPricePaise: 45000 });
    expect(invalidMapping.status).toBe(409);
    expect(invalidMapping.body.error.code).toBe('CANONICAL_BOOKING_MISMATCH');
    expect((database.prepare('SELECT COUNT(*) AS count FROM bookings').get() as { count: number }).count).toBe(0);
    expect((database.prepare('SELECT COUNT(*) AS count FROM bookings WHERE user_id NOT IN (SELECT id FROM users) OR movie_id NOT IN (SELECT id FROM movies) OR theatre_id NOT IN (SELECT id FROM theatres)').get() as { count: number }).count).toBe(0);
  });
});
