'use client';

import { CheckoutForm } from '../../components/CheckoutForm';

/** Presents the guarded final payment step for a completed journey. */
export default function CheckoutPage() {
  return <main className="auth-shell"><CheckoutForm /></main>;
}
