'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBooking } from '../lib/api';
import { useBookingJourney } from '../state/BookingJourneyProvider';
import { ProcessingView } from './ProcessingView';

/** Collects transient payment fields and submits exactly one safe booking request. */
export function CheckoutForm(): React.JSX.Element {
  const router = useRouter();
  const {
    selectedMovie,
    selectedTheatre,
    selectedSeats,
    totalPricePaise,
    paymentMethod,
    selectPaymentMethod,
    saveConfirmation
  } = useBookingJourney();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const completeJourney = Boolean(
    selectedMovie && selectedTheatre && selectedSeats && totalPricePaise,
  );

  useEffect(() => {
    return () => {
      formRef.current?.reset();
    };
  }, []);

  if (!completeJourney) {
    return (
      <section className="auth-panel">
        <h1>Complete your booking journey first.</h1>
        <button type="button" onClick={() => router.push('/movies')}>
          Choose a movie
        </button>
      </section>
    );
  }

  if (processing) {
    return (
      <section className="auth-panel">
        <ProcessingView />
      </section>
    );
  }

  function clearPaymentDetails(): void {
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setUpiId('');
  }

  function handlePaymentMethodChange(method: 'CARD' | 'UPI'): void {
    clearPaymentDetails();
    selectPaymentMethod(method);
  }

  async function pay(): Promise<void> {
    if (!paymentMethod) {
      setError('Choose a payment method.');
      return;
    }
    setError(null);
    setProcessing(true);
    window.setTimeout(async () => {
      try {
        const booking = await createBooking(
          {
            movieId: selectedMovie!.id,
            theatreId: selectedTheatre!.id,
            seats: selectedSeats!,
            paymentMethod,
            totalPricePaise: totalPricePaise!
          },
          crypto.randomUUID(),
        );
        saveConfirmation(booking);
        router.push('/confirmation');
      } catch (submissionError) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : 'Unable to confirm your booking.',
        );
        setProcessing(false);
      }
    }, 2000);
  }

  return (
    <form
      ref={formRef}
      className="auth-panel"
      onSubmit={(event) => {
        event.preventDefault();
        void pay();
      }}
    >
      <p className="eyebrow">STEP 04 · PAYMENT</p>
      <h1>Choose how to pay.</h1>
      <fieldset disabled={processing}>
        <legend>Payment method</legend>
        <label>
          <input
            type="radio"
            name="paymentMethod"
            checked={paymentMethod === 'CARD'}
            onChange={() => handlePaymentMethodChange('CARD')}
          />
          Card
        </label>
        <label>
          <input
            type="radio"
            name="paymentMethod"
            checked={paymentMethod === 'UPI'}
            onChange={() => handlePaymentMethodChange('UPI')}
          />
          UPI
        </label>
        {paymentMethod === 'CARD' && (
          <>
            <label htmlFor="card-number">Card Number</label>
            <input
              id="card-number"
              value={cardNumber}
              onChange={(event) => setCardNumber(event.target.value)}
              autoComplete="cc-number"
            />
            <label htmlFor="expiry">Expiry</label>
            <input
              id="expiry"
              value={expiry}
              onChange={(event) => setExpiry(event.target.value)}
              autoComplete="cc-exp"
            />
            <label htmlFor="cvv">CVV</label>
            <input
              id="cvv"
              value={cvv}
              onChange={(event) => setCvv(event.target.value)}
              autoComplete="cc-csc"
            />
          </>
        )}
        {paymentMethod === 'UPI' && (
          <>
            <label htmlFor="upi-id">UPI ID</label>
            <input
              id="upi-id"
              value={upiId}
              onChange={(event) => setUpiId(event.target.value)}
            />
          </>
        )}
      </fieldset>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={processing}>
        Pay Rs. {totalPricePaise! / 100}
      </button>
    </form>
  );
}
