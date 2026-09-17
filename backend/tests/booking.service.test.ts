import { existsSync, rmSync } from 'fs';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';
import type Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { BookingRepository } from '../src/booking/bookingRepository';
import { BookingService } from '../src/booking/bookingService';
import { createDatabase } from '../src/db/database';

const fixtures: Array<{ path: string; database: Database.Database }> = [];
const bookingRequest = { movieId: 'movie-paradise', theatreId: 'theatre-sandhya-70mm', seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD' as const, totalPricePaise: 45000 };
function service() {
  const path = join(tmpdir(), `booking-service-${randomUUID()}.sqlite`);
  const database = createDatabase(path);
  fixtures.push({ path, database });
  database.prepare('INSERT INTO users (id, mobile_number, created_at) VALUES (?, ?, ?)').run('user-1', '9876543210', new Date().toISOString());
  return { database, bookingService: new BookingService(new BookingRepository(database)) };
}
afterEach(() => fixtures.splice(0).forEach(({ path, database }) => { database.close(); if (existsSync(path)) rmSync(path); }));

describe('BookingService', () => {
  it('creates a canonical confirmation with the expected seat list and price, then durably re-reads one row', () => {
    const { database, bookingService } = service();
    const result = bookingService.confirm('user-1', randomUUID(), bookingRequest);
    expect(result).toMatchObject({ movie: { title: 'Paradise' }, theatre: { name: 'Sandhya 70mm' }, seats: ['A1', 'A2', 'A3'], totalPricePaise: 45000 });
    const row = database.prepare('SELECT seats_json, total_price_paise FROM bookings WHERE confirmation_id = ?').get(result.confirmationId) as { seats_json: string; total_price_paise: number };
    expect(row).toEqual({ seats_json: '["A1","A2","A3"]', total_price_paise: 45000 });
    expect((database.prepare('SELECT COUNT(*) AS count FROM bookings').get() as { count: number }).count).toBe(1);
  });

  it.each([
    ['invalid mapping', { ...bookingRequest, theatreId: 'theatre-allu-cinemas' }],
    ['wrong seat list', { ...bookingRequest, seats: ['A1', 'A3', 'A2'] }],
    ['wrong price', { ...bookingRequest, totalPricePaise: 1 }],
  ])('rejects %s without creating a row', (label, input) => {
    const { database, bookingService } = service();
    expect(() => bookingService.confirm('user-1', randomUUID(), input)).toThrow(/canonical booking/i);
    expect((database.prepare('SELECT COUNT(*) AS count FROM bookings').get() as { count: number }).count).toBe(0);
    expect(label).toBeTruthy();
  });

  it('replays an identical request and rejects an idempotency key collision without duplicate rows', () => {
    const { database, bookingService } = service();
    const key = randomUUID();
    const first = bookingService.confirm('user-1', key, bookingRequest);
    const replay = bookingService.confirm('user-1', key, bookingRequest);
    expect(replay.confirmationId).toBe(first.confirmationId);
    try {
      bookingService.confirm('user-1', key, { ...bookingRequest, paymentMethod: 'UPI' });
      throw new Error('Expected an idempotency collision.');
    } catch (error) {
      expect(error).toMatchObject({ code: 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH' });
    }
    expect((database.prepare('SELECT COUNT(*) AS count FROM bookings').get() as { count: number }).count).toBe(1);
  });

  it('enforces direct SQLite foreign-key, CHECK, and unique constraints', () => {
    const { database } = service();
    const insert = database.prepare(`INSERT INTO bookings (confirmation_id, user_id, idempotency_key, payload_fingerprint, movie_id, theatre_id, seats_json, payment_method, total_price_paise, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    expect(() => insert.run(randomUUID(), 'missing-user', randomUUID(), 'fingerprint', 'movie-paradise', 'theatre-sandhya-70mm', '["A1","A2","A3"]', 'CARD', 45000, new Date().toISOString())).toThrow();
    expect(() => insert.run(randomUUID(), 'user-1', randomUUID(), 'fingerprint', 'movie-paradise', 'theatre-sandhya-70mm', '["A1"]', 'CARD', 45000, new Date().toISOString())).toThrow();
    const key = randomUUID();
    insert.run(randomUUID(), 'user-1', key, 'fingerprint', 'movie-paradise', 'theatre-sandhya-70mm', '["A1","A2","A3"]', 'CARD', 45000, new Date().toISOString());
    expect(() => insert.run(randomUUID(), 'user-1', key, 'fingerprint-2', 'movie-paradise', 'theatre-sandhya-70mm', '["A1","A2","A3"]', 'UPI', 45000, new Date().toISOString())).toThrow();
  });
});
