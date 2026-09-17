import Link from 'next/link';

/** Renders the branded public landing page. */
export default function HomePage() {
  return (
    <main className="landing-shell">
      <header className="site-header"><Link className="wordmark" href="/">SIGNAL<span>RED</span></Link><Link className="text-link" href="/login">Sign in</Link></header>
      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">PASSWORDLESS ACCESS</p>
        <h1 id="hero-title">A clear signal for secure work.</h1>
        <p className="hero-copy">A focused, verification-first entry point built for people who value a direct path and a trusted session.</p>
        <Link className="primary-link" href="/login">Continue to sign in <span aria-hidden="true">→</span></Link>
      </section>
      <section className="principles" aria-label="Access principles"><p><strong>01</strong> One-time verification</p><p><strong>02</strong> Durable identity</p><p><strong>03</strong> Secure session cookie</p></section>
    </main>
  );
}
