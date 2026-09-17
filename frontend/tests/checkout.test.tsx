import '@testing-library/jest-dom/vitest';
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckoutForm } from '../components/CheckoutForm';

const push = vi.fn();
const saveConfirmation = vi.fn();
const createBooking = vi.fn();
const selectPaymentMethod = vi.fn();
let paymentMethod: 'CARD' | 'UPI' | null = 'CARD';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('../lib/api', () => ({
  createBooking: (...args: unknown[]) => createBooking(...args)
}));
vi.mock('../state/BookingJourneyProvider', () => ({
  useBookingJourney: () => ({
    selectedMovie: { id: 'movie-paradise', title: 'Local movie' },
    selectedTheatre: { id: 'theatre-sandhya-70mm', name: 'Local theatre' },
    selectedSeats: ['A1', 'A2', 'A3'],
    totalPricePaise: 45000,
    paymentMethod,
    selectPaymentMethod,
    saveConfirmation
  })
}));

beforeEach(() => {
  paymentMethod = 'CARD';
  push.mockReset();
  saveConfirmation.mockReset();
  createBooking.mockReset();
  selectPaymentMethod.mockReset();
});

afterEach(() => vi.useRealTimers());

describe('CheckoutForm', () => {
  it('shows the exact processing copy for two seconds then posts once after method selection', async () => {
    vi.useFakeTimers();
    createBooking.mockResolvedValue({
      confirmationId: 'server-id',
      movie: { id: 'movie-paradise', title: 'Paradise' },
      theatre: { id: 'theatre-sandhya-70mm', name: 'Sandhya 70mm' },
      seats: ['A1', 'A2', 'A3'],
      paymentMethod: 'CARD',
      totalPricePaise: 45000,
      createdAt: '2026-01-01T00:00:00.000Z'
    });
    render(<CheckoutForm />);
    fireEvent.click(screen.getByRole('button', { name: /Pay/ }));

    expect(screen.getByRole('status')).toHaveTextContent('Processing Payment...');
    expect(createBooking).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(createBooking).toHaveBeenCalledTimes(1);
    expect(createBooking.mock.calls[0][0]).toEqual({
      movieId: 'movie-paradise',
      theatreId: 'theatre-sandhya-70mm',
      seats: ['A1', 'A2', 'A3'],
      paymentMethod: 'CARD',
      totalPricePaise: 45000
    });
    expect(push).toHaveBeenCalledWith('/confirmation');
  });

  it('requires a payment choice before it starts processing', () => {
    paymentMethod = null;
    render(<CheckoutForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Pay Rs. 450' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Choose a payment method.');
    expect(createBooking).not.toHaveBeenCalled();
  });

  it('dispatches payment method selection and shows only that method’s transient fields', () => {
    paymentMethod = 'CARD';
    const { rerender } = render(<CheckoutForm />);
    expect(screen.getByLabelText('Card Number')).toBeInTheDocument();
    expect(screen.queryByLabelText('UPI ID')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'UPI' }));
    expect(selectPaymentMethod).toHaveBeenCalledWith('UPI');

    paymentMethod = 'UPI';
    rerender(<CheckoutForm />);
    expect(screen.getByLabelText('UPI ID')).toBeInTheDocument();
    expect(screen.queryByLabelText('Card Number')).not.toBeInTheDocument();
  });

  it('clears all card fields before selecting a different payment method', () => {
    const { rerender } = render(<CheckoutForm />);
    fireEvent.change(screen.getByLabelText('Card Number'), {
      target: { value: '4111111111111111' }
    });
    fireEvent.change(screen.getByLabelText('Expiry'), { target: { value: '12/30' } });
    fireEvent.change(screen.getByLabelText('CVV'), { target: { value: '123' } });

    fireEvent.click(screen.getByRole('radio', { name: 'UPI' }));
    paymentMethod = 'UPI';
    rerender(<CheckoutForm />);
    fireEvent.click(screen.getByRole('radio', { name: 'Card' }));
    paymentMethod = 'CARD';
    rerender(<CheckoutForm />);

    expect(screen.getByLabelText('Card Number')).toHaveValue('');
    expect(screen.getByLabelText('Expiry')).toHaveValue('');
    expect(screen.getByLabelText('CVV')).toHaveValue('');
  });

  it('does not retain a UPI ID after the checkout form unmounts', () => {
    paymentMethod = 'UPI';
    const { unmount } = render(<CheckoutForm />);
    fireEvent.change(screen.getByLabelText('UPI ID'), {
      target: { value: 'customer@upi' }
    });
    expect(screen.getByLabelText('UPI ID')).toHaveValue('customer@upi');

    unmount();
    render(<CheckoutForm />);

    expect(screen.getByLabelText('UPI ID')).toHaveValue('');
  });

  it('returns to the form and reports a booking API failure after processing', async () => {
    vi.useFakeTimers();
    createBooking.mockRejectedValue(new Error('Booking service is unavailable.'));
    render(<CheckoutForm />);
    fireEvent.click(screen.getByRole('button', { name: /Pay/ }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Booking service is unavailable.');
    expect(screen.getByRole('button', { name: 'Pay Rs. 450' })).toBeEnabled();
    expect(push).not.toHaveBeenCalled();
  });
});
