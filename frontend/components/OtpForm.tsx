'use client';

import React, { type FormEvent, useState } from 'react';
import { verifyOtp } from '../lib/api';

/** Describes the mobile-number and navigation callback required by OTP verification. */
interface OtpFormProps { mobileNumber: string; onStartOver: () => void; }

/** Verifies a four-digit OTP without persisting the backend session token. */
export function OtpForm({ mobileNumber, onStartOver }: OtpFormProps): React.JSX.Element {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /** Submits the verification code after the user explicitly confirms it. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const result = await verifyOtp(mobileNumber, otp);
      setSuccess(`You are verified as ${result.user.mobileNumber}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to verify the code.');
    } finally {
      setIsLoading(false);
    }
  }

  return <form className="auth-form" onSubmit={handleSubmit} noValidate><p className="verification-copy">We sent a code for <strong>{mobileNumber}</strong>. For local development, use <strong>1234</strong>.</p><label htmlFor="otp">Verification code</label><input id="otp" name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{4}" maxLength={4} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} aria-required="true" aria-invalid={Boolean(error)} aria-describedby={error ? 'otp-error' : undefined} required /><button type="submit" disabled={isLoading}>{isLoading ? 'Verifying…' : 'Verify access'}</button><button type="button" className="secondary-button" onClick={onStartOver}>Use a different number</button>{error && <p id="otp-error" className="form-error" role="alert">{error}</p>}{success && <p className="form-success" role="status">{success}</p>}</form>;
}
