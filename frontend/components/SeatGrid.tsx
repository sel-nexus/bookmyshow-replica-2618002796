import React from 'react';

const seatRows = ['A', 'B', 'C', 'D'] as const;
const seatsPerRow = 8;

/** Render a visual-only seating preview without exposing seat-level interactions. */
export function SeatGrid(): React.ReactElement {
  return (
    <section aria-labelledby="seat-grid-title">
      <h2 id="seat-grid-title">Seating preview</h2>
      <p>Choose the preset seats to continue.</p>
      <div aria-label="Theatre seating layout" role="img">
        {seatRows.map((row) => (
          <div key={row}>
            {Array.from({ length: seatsPerRow }, (_, index) => (
              <span aria-hidden="true" key={`${row}${index + 1}`}>
                {row}{index + 1}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
