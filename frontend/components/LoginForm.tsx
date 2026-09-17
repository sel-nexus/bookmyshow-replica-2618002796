'use client';

import React, { type FormEvent, useState } from 'react';
import { requestLogin } from '../lib/api';
import { OtpForm } from './OtpForm';

/** Collects a mobile number before revealing the OTP verification step. */
export function LoginForm(): React.JSX.Element {
  const [mobileNumber, setMobileNumber] = useState('');
  const [submittedMobileNumber, setSubmittedMobileNumber] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /** Requests the verification step after an explicit mobile-number submission. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await requestLogin(mobileNumber);
      setSubmittedMobileNumber(mobileNumber);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to request verification.');
    } finally {
      setIsLoading(false);
    }
  }

  if (submittedMobileNumber !== null) return <OtpForm mobileNumber={submittedMobileNumber} onStartOver={() => setSubmittedMobileNumber(null)} />;
  return <form className="auth-form" onSubmit={handleSubmit} noValidate><label htmlFor="mobileNumber">Mobile number</label><input id="mobileNumber" name="mobileNumber" type="tel" autoComplete="tel" value={mobileNumber} onChange={(event) => setMobileNumber(event.target.value)} aria-required="true" aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} required /><button type="submit" disabled={isLoading}>{isLoading ? 'Requesting…' : 'Continue'}</button>{error && <p id="login-error" className="form-error" role="alert">{error}</p>}</form>;
}
