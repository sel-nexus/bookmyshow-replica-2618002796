import React from 'react';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MoviesPage from '../app/movies/page';
import { TheatreList } from '../components/TheatreList';
import { BookingJourneyProvider, useBookingJourney } from '../state/BookingJourneyProvider';

const fetchMock = vi.fn();
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));
beforeEach(() => { vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset(); pushMock.mockReset(); });
afterEach(() => cleanup());

/** Renders the selected theatre as an observable user-facing outcome. */
function SelectedTheatreName() {
  const { selectedTheatre } = useBookingJourney();
  return <p>{selectedTheatre?.name ?? 'No theatre selected'}</p>;
}

describe('catalogue journey', () => {
  it('renders titles fetched from the API and navigates only after a movie click', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ movies: [{ id: 'movie-paradise', title: 'Paradise' }] }) });
    const user = userEvent.setup();
    render(<BookingJourneyProvider><MoviesPage /></BookingJourneyProvider>);
    expect(await screen.findByRole('button', { name: 'Select Paradise' })).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Select Paradise' }));
    expect(pushMock).toHaveBeenCalledWith('/theatres');
  });
  it('stores a theatre only after the user selects it', async () => {
    const user = userEvent.setup();
    function TheatreSelection() {
      const { selectTheatre } = useBookingJourney();
      return <><TheatreList theatres={[{ id: 'theatre-sandhya-70mm', name: 'Sandhya 70mm' }]} onSelect={selectTheatre} /><SelectedTheatreName /></>;
    }
    render(<BookingJourneyProvider><TheatreSelection /></BookingJourneyProvider>);
    expect(screen.getByText('No theatre selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Select Sandhya 70mm' }));
    expect(screen.getByText('Sandhya 70mm')).toBeInTheDocument();
  });
});
