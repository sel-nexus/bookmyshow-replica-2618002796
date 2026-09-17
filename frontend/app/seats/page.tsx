'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PresetSeatAction } from '../../components/PresetSeatAction';
import { SeatGrid } from '../../components/SeatGrid';
import { useBookingJourney } from '../../state/BookingJourneyProvider';

/** Present the fixed seat preset only when a theatre was deliberately selected. */
export default function SeatsPage(): React.ReactElement {
  const router = useRouter();
  const { selectedTheatre } = useBookingJourney();

  if (!selectedTheatre) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <h1>Choose a theatre first.</h1>
          <button type="button" onClick={() => router.push('/theatres')}>
            Browse theatres
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <header className="site-header">
        <p className="wordmark">SIGNAL<span>RED</span></p>
      </header>
      <section aria-labelledby="seats-title" className="auth-panel">
        <p className="eyebrow">STEP 03 · {selectedTheatre.name}</p>
        <h1 id="seats-title">Review your seats.</h1>
        <SeatGrid />
        <PresetSeatAction />
      </section>
    </main>
  );
}
