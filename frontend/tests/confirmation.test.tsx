import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConfirmationPage from '../app/confirmation/page';
import { ConfirmationCard } from '../components/ConfirmationCard';

const replace = vi.fn();
let bookingConfirmation: Record<string, unknown> | null = null;

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('../state/BookingJourneyProvider', () => ({
  useBookingJourney: () => ({ bookingConfirmation })
}));

beforeEach(() => {
  replace.mockReset();
  bookingConfirmation = null;
});

describe('ConfirmationCard', () => {
  it('renders server confirmation data rather than a local selection', () => {
    render(
      <ConfirmationCard
        booking={{
          confirmationId: 'server-confirmation',
          movie: { id: 'movie-paradise', title: 'Paradise from server' },
          theatre: { id: 'theatre-sandhya-70mm', name: 'Sandhya from server' },
          seats: ['A1', 'A2', 'A3'],
          paymentMethod: 'UPI',
          totalPricePaise: 45000,
          createdAt: '2026-01-01T00:00:00.000Z'
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Congratulations!' })).toBeInTheDocument();
    expect(screen.getByText('server-confirmation')).toBeInTheDocument();
    expect(screen.getByText('Paradise from server')).toBeInTheDocument();
    expect(screen.getByText('Sandhya from server')).toBeInTheDocument();
  });
});

describe('ConfirmationPage', () => {
  it('redirects to checkout instead of rendering a confirmation without response-backed data', async () => {
    render(<ConfirmationPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Returning to checkout…');
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/checkout'));
    expect(screen.queryByRole('heading', { name: 'Congratulations!' })).not.toBeInTheDocument();
  });
});
