'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useBookingJourney } from '../state/BookingJourneyProvider';

const presetSeats = ['A1', 'A2', 'A3'] as const;
const presetTotalPricePaise = 45000;

/** Apply the fixed seat preset locally and continue the booking journey to checkout. */
export function PresetSeatAction(): React.ReactElement {
  const router = useRouter();
  const { selectedSeats, totalPricePaise, selectPresetSeats } = useBookingJourney();

  function handleSelectSeats(): void {
    selectPresetSeats();
    router.push('/checkout');
  }

  return (
    <section aria-label="Seat selection action">
      <button type="button" onClick={handleSelectSeats}>
        Select Seats
      </button>
      {selectedSeats && totalPricePaise !== null ? (
        <p role="status">
          Selected seats: {selectedSeats.join(', ')}. Total: Rs. {totalPricePaise / 100}
        </p>
      ) : (
        <p role="status">No seats selected.</p>
      )}
    </section>
  );
}

export { presetSeats, presetTotalPricePaise };
