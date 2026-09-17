'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmationCard } from '../../components/ConfirmationCard';
import { useBookingJourney } from '../../state/BookingJourneyProvider';

/** Shows only backend-confirmed booking data and safely redirects on a direct visit. */
export default function ConfirmationPage(): React.JSX.Element {
  const router = useRouter();
  const { bookingConfirmation } = useBookingJourney();

  useEffect(() => {
    if (!bookingConfirmation) router.replace('/checkout');
  }, [bookingConfirmation, router]);

  if (!bookingConfirmation) {
    return (
      <main className="auth-shell">
        <p role="status">Returning to checkout…</p>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <ConfirmationCard booking={bookingConfirmation} />
    </main>
  );
}
