import type { Metadata } from 'next';
import './globals.css';
import { BookingJourneyProvider } from '../state/BookingJourneyProvider';

/** Defines global metadata and the document shell for public auth pages. */
export const metadata: Metadata = {
  title: 'Signal Red | Secure access',
  description: 'A deliberate, secure passwordless access experience.'
};

/** Renders the shared document layout. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><BookingJourneyProvider>{children}</BookingJourneyProvider></body></html>;
}
