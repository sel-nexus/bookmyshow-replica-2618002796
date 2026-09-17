import '@testing-library/jest-dom/vitest';
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CheckoutForm } from '../components/CheckoutForm';

const push = vi.fn(); const saveConfirmation = vi.fn(); const createBooking = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('../lib/api', () => ({ createBooking: (...args: unknown[]) => createBooking(...args) }));
vi.mock('../state/BookingJourneyProvider', () => ({ useBookingJourney: () => ({ selectedMovie: { id: 'movie-paradise', title: 'Local movie' }, selectedTheatre: { id: 'theatre-sandhya-70mm', name: 'Local theatre' }, selectedSeats: ['A1', 'A2', 'A3'], totalPricePaise: 45000, paymentMethod: 'CARD', selectPaymentMethod: vi.fn(), saveConfirmation }) }));
afterEach(() => { vi.useRealTimers(); push.mockReset(); saveConfirmation.mockReset(); createBooking.mockReset(); });

describe('CheckoutForm', () => {
  it('shows the exact processing copy for two seconds then posts once without raw card fields', async () => {
    vi.useFakeTimers(); createBooking.mockResolvedValue({ confirmationId: 'server-id', movie: { id: 'movie-paradise', title: 'Paradise' }, theatre: { id: 'theatre-sandhya-70mm', name: 'Sandhya 70mm' }, seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD', totalPricePaise: 45000, createdAt: '2026-01-01T00:00:00.000Z' });
    render(<CheckoutForm />);
    fireEvent.change(screen.getByLabelText('Card Number'), { target: { value: '4111111111111111' } }); fireEvent.change(screen.getByLabelText('Expiry'), { target: { value: '12/30' } }); fireEvent.change(screen.getByLabelText('CVV'), { target: { value: '123' } }); fireEvent.click(screen.getByRole('button', { name: /Pay/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Processing Payment...'); expect(createBooking).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(createBooking).toHaveBeenCalledTimes(1); expect(createBooking.mock.calls[0][0]).toEqual({ movieId: 'movie-paradise', theatreId: 'theatre-sandhya-70mm', seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD', totalPricePaise: 45000 }); expect(JSON.stringify(createBooking.mock.calls[0][0])).not.toContain('411111'); expect(JSON.stringify(createBooking.mock.calls[0][0])).not.toContain('123'); expect(push).toHaveBeenCalledWith('/confirmation');
  });
});
