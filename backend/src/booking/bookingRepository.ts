import type Database from 'better-sqlite3';

/** Canonical booking record stored after a successful confirmation. */
export interface BookingRecord {
  confirmationId: string;
  userId: string;
  idempotencyKey: string;
  payloadFingerprint: string;
  movieId: string;
  movieTitle: string;
  theatreId: string;
  theatreName: string;
  seats: string[];
  paymentMethod: 'CARD' | 'UPI';
  totalPricePaise: number;
  createdAt: string;
}

/** Provides durable booking and catalogue mapping access. */
export class BookingRepository {
  /** Binds the repository to the application's SQLite database. */
  constructor(private readonly database: Database.Database) {}

  /** Reads a booking only within the authenticated user's idempotency namespace. */
  findByUserAndKey(userId: string, idempotencyKey: string): BookingRecord | undefined {
    const row = this.database.prepare(`SELECT b.confirmation_id, b.user_id, b.idempotency_key, b.payload_fingerprint,
      b.movie_id, m.title AS movie_title, b.theatre_id, t.name AS theatre_name, b.seats_json,
      b.payment_method, b.total_price_paise, b.created_at
      FROM bookings b INNER JOIN movies m ON m.id = b.movie_id INNER JOIN theatres t ON t.id = b.theatre_id
      WHERE b.user_id = ? AND b.idempotency_key = ?`).get(userId, idempotencyKey) as StoredBooking | undefined;
    return row ? this.toBooking(row) : undefined;
  }

  /** Returns server-owned movie and theatre details when their mapping is valid. */
  findCanonicalMapping(movieId: string, theatreId: string): { movieId: string; movieTitle: string; theatreId: string; theatreName: string } | undefined {
    return this.database.prepare(`SELECT movies.id AS movieId, movies.title AS movieTitle, theatres.id AS theatreId, theatres.name AS theatreName
      FROM movie_theatres INNER JOIN movies ON movies.id = movie_theatres.movie_id
      INNER JOIN theatres ON theatres.id = movie_theatres.theatre_id
      WHERE movie_theatres.movie_id = ? AND movie_theatres.theatre_id = ?`).get(movieId, theatreId) as { movieId: string; movieTitle: string; theatreId: string; theatreName: string } | undefined;
  }

  /** Inserts a confirmed booking with the database uniqueness constraint as the final guard. */
  create(booking: BookingRecord): BookingRecord {
    this.database.prepare(`INSERT INTO bookings (confirmation_id, user_id, idempotency_key, payload_fingerprint, movie_id, theatre_id, seats_json, payment_method, total_price_paise, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(booking.confirmationId, booking.userId, booking.idempotencyKey, booking.payloadFingerprint, booking.movieId, booking.theatreId, JSON.stringify(booking.seats), booking.paymentMethod, booking.totalPricePaise, booking.createdAt);
    return booking;
  }

  /** Converts SQLite's serialized seat list to the public durable representation. */
  private toBooking(row: StoredBooking): BookingRecord {
    return { confirmationId: row.confirmation_id, userId: row.user_id, idempotencyKey: row.idempotency_key, payloadFingerprint: row.payload_fingerprint, movieId: row.movie_id, movieTitle: row.movie_title, theatreId: row.theatre_id, theatreName: row.theatre_name, seats: JSON.parse(row.seats_json) as string[], paymentMethod: row.payment_method, totalPricePaise: row.total_price_paise, createdAt: row.created_at };
  }
}

interface StoredBooking {
  confirmation_id: string; user_id: string; idempotency_key: string; payload_fingerprint: string;
  movie_id: string; movie_title: string; theatre_id: string; theatre_name: string; seats_json: string;
  payment_method: 'CARD' | 'UPI'; total_price_paise: number; created_at: string;
}
