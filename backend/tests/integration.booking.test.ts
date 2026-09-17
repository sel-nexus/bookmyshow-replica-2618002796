import { existsSync, rmSync } from 'fs';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { createDatabase } from '../src/db/database';

const paths: string[] = [];
afterEach(() => paths.splice(0).forEach((path) => { if (existsSync(path)) rmSync(path); }));
describe('authentication to catalogue to booking integration', () => {
  it('uses an authenticated session and catalogue mapping to obtain a durable confirmation', async () => {
    const path = join(tmpdir(), `booking-integration-${randomUUID()}.sqlite`); paths.push(path);
    const app = createApp({ database: createDatabase(path), appConfig: { port: 3001, databasePath: path, sessionSecret: 'a-test-secret-that-is-long-enough', sessionCookieName: 'bms_session', corsOrigin: 'http://localhost:3000', cookieSecure: false } });
    const agent = request.agent(app); await agent.post('/api/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' });
    const movie = (await agent.get('/api/movies')).body.movies[0]; const theatre = (await agent.get(`/api/theatres?movieId=${movie.id}`)).body.theatres[0];
    const booking = await agent.post('/api/bookings').set('Idempotency-Key', randomUUID()).send({ movieId: movie.id, theatreId: theatre.id, seats: ['A1', 'A2', 'A3'], paymentMethod: 'UPI', totalPricePaise: 45000 });
    expect(booking.status).toBe(201); expect(booking.body.booking).toMatchObject({ movie: { title: movie.title }, theatre: { name: theatre.name } });
  });
});
