import React from 'react';
import type { BookingConfirmation } from '../lib/api';

/** Renders confirmation details returned by the backend, not local selections. */
export function ConfirmationCard({ booking }: { booking: BookingConfirmation }) {
  return <section className="auth-panel" aria-labelledby="confirmation-title">
    <p className="eyebrow">BOOKING CONFIRMED</p>
    <h1 id="confirmation-title">Congratulations!</h1>
    <p><strong>Confirmation:</strong> {booking.confirmationId}</p>
    <p><strong>Movie:</strong> {booking.movie.title}</p>
    <p><strong>Theatre:</strong> {booking.theatre.name}</p>
    <p><strong>Seats:</strong> {booking.seats.join(', ')}</p>
    <p><strong>Total:</strong> Rs. {booking.totalPricePaise / 100}</p>
  </section>;
}
