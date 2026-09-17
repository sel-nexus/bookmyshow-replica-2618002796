import { createHash, randomUUID } from 'crypto';
import { ApiError } from '../shared/errors';
import { BookingRepository, type BookingRecord } from './bookingRepository';

/** Validated, payment-data-free request used to create a booking. */
export interface BookingRequest { movieId: string; theatreId: string; seats: string[]; paymentMethod: 'CARD' | 'UPI'; totalPricePaise: number; }

/** Public confirmation returned solely from durable backend state. */
export interface BookingConfirmation { confirmationId: string; movie: { id: string; title: string }; theatre: { id: string; name: string }; seats: string[]; paymentMethod: 'CARD' | 'UPI'; totalPricePaise: number; createdAt: string; }

const canonicalSeats = ['A1', 'A2', 'A3'];
const canonicalPricePaise = 45000;

/** Enforces canonical booking data and durable idempotent confirmation. */
export class BookingService {
  /** Creates a service over the booking repository. */
  constructor(private readonly repository: BookingRepository) {}

  /** Confirms a canonical booking or replays its original durable confirmation. */
  confirm(userId: string, idempotencyKey: string, request: BookingRequest): BookingConfirmation {
    const fingerprint = this.fingerprint(request);
    const existing = this.repository.findByUserAndKey(userId, idempotencyKey);
    if (existing) {
      if (existing.payloadFingerprint !== fingerprint) throw new ApiError(409, 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH', 'This idempotency key was already used with a different booking request.');
      return this.toConfirmation(existing);
    }
    const mapping = this.repository.findCanonicalMapping(request.movieId, request.theatreId);
    if (!mapping || request.totalPricePaise !== canonicalPricePaise || request.seats.length !== canonicalSeats.length || request.seats.some((seat, index) => seat !== canonicalSeats[index])) {
      throw new ApiError(409, 'CANONICAL_BOOKING_MISMATCH', 'Movie, theatre, seats, or price do not match the canonical booking.');
    }
    const stored = this.repository.create({ confirmationId: randomUUID(), userId, idempotencyKey, payloadFingerprint: fingerprint, movieId: mapping.movieId, movieTitle: mapping.movieTitle, theatreId: mapping.theatreId, theatreName: mapping.theatreName, seats: [...canonicalSeats], paymentMethod: request.paymentMethod, totalPricePaise: canonicalPricePaise, createdAt: new Date().toISOString() });
    return this.toConfirmation(stored);
  }

  /** Produces a stable digest without retaining payment instrument data. */
  private fingerprint(request: BookingRequest): string {
    return createHash('sha256').update(JSON.stringify(request)).digest('hex');
  }

  /** Projects durable data into the API confirmation shape. */
  private toConfirmation(booking: BookingRecord): BookingConfirmation {
    return { confirmationId: booking.confirmationId, movie: { id: booking.movieId, title: booking.movieTitle }, theatre: { id: booking.theatreId, name: booking.theatreName }, seats: booking.seats, paymentMethod: booking.paymentMethod, totalPricePaise: booking.totalPricePaise, createdAt: booking.createdAt };
  }
}
