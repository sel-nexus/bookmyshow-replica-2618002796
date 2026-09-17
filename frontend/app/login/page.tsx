import Link from 'next/link';
import { LoginForm } from '../../components/LoginForm';

/** Renders the public login workflow. */
export default function LoginPage() {
  return <main className="auth-shell"><header className="site-header"><Link className="wordmark" href="/">SIGNAL<span>RED</span></Link><Link className="text-link" href="/">Back home</Link></header><section className="auth-panel" aria-labelledby="login-title"><p className="eyebrow">SECURE ACCESS</p><h1 id="login-title">Welcome back.</h1><p className="auth-intro">Enter your email to receive a verification step.</p><LoginForm /></section></main>;
}
