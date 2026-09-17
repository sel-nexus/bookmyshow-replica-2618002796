'use client';

import React from 'react';
import { CheckoutForm } from '../../components/CheckoutForm';

/** Presents the guarded final payment step for a completed journey. */
export default function CheckoutPage(): React.JSX.Element {
  return (
    <main className="auth-shell">
      <CheckoutForm />
    </main>
  );
}
