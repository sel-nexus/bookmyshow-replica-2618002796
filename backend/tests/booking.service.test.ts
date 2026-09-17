import { existsSync, rmSync } from 'fs';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { BookingRepository } from '../src/booking/bookingRepository';
import { BookingService } from '../src/booking/bookingService';
import { createDatabase } from '../src/db/database';

const paths: string[] = [];
const request = { movieId: 'movie-paradise', theatreId: 'theatre-sandhya-70mm', seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD' as const, totalPricePaise: 45000 };
function service(): BookingService { const path = join(tmpdir(), `booking-service-${randomUUID()}.sqlite`); paths.push(path); const database = createDatabase(path); database.prepare('INSERT INTO users (id, mobile_number, created_at) VALUES (?, ?, ?)').run('user-1', '9876543210', new Date().toISOString()); return new BookingService(new BookingRepository(database)); }
afterEach(() => paths.splice(0).forEach((path) => { if (existsSync(path)) rmSync(path); }));

describe('BookingService', () => {
  it('creates a confirmation using backend catalogue details', () => {
    const result = service().confirm('user-1', randomUUID(), request);
    expect(result).toMatchObject({ movie: { title: 'Paradise' }, theatre: { name: 'Sandhya 70mm' }, seats: ['A1', 'A2', 'A3'], totalPricePaise: 45000 });
  });
  it('replays an identical authenticated request without duplicate booking', () => {
    const bookingService = service(); const key = randomUUID(); const first = bookingService.confirm('user-1', key, request); const replay = bookingService.confirm('user-1', key, request);
    expect(replay.confirmationId).toBe(first.confirmationId);
  });
  it('rejects canonical conflicts and a reused key with changed payload', () => {
    const bookingService = service(); const key = randomUUID();
    expect(() => bookingService.confirm('user-1', key, { ...request, totalPricePaise: 1 })).toThrow(/canonical booking/i);
    bookingService.confirm('user-1', key, request);
    try { bookingService.confirm('user-1', key, { ...request, paymentMethod: 'UPI' }); throw new Error('expected conflict'); } catch (error) { expect((error as { code?: string }).code).toBe('IDEMPOTENCY_KEY_PAYLOAD_MISMATCH'); }
  });
});
