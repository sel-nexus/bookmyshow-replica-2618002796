import type { Metadata } from 'next';
import './globals.css';

/** Defines global metadata and the document shell for public auth pages. */
export const metadata: Metadata = {
  title: 'Signal Red | Secure access',
  description: 'A deliberate, secure passwordless access experience.'
};

/** Renders the shared document layout. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
