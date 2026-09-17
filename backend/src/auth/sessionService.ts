import jwt from 'jsonwebtoken';
import type { User } from './userRepository';

/** Signs and validates opaque session tokens for authenticated users. */
export class SessionService {
  /** Creates a service using a configuration-supplied signing secret. */
  constructor(private readonly signingSecret: string) {}

  /** Issues a signed token whose contents are not consumed by clients. */
  issue(user: User): string {
    return jwt.sign({ sub: user.id, mobileNumber: user.mobileNumber }, this.signingSecret, { expiresIn: '7d', issuer: 'bookmyshow-replica' });
  }

  /** Verifies the named session cookie and returns its authenticated principal. */
  verifyFromCookie(cookieHeader: string | undefined, cookieName: string): { userId: string } | undefined {
    const token = cookieHeader?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    if (!token) return undefined;
    try {
      const payload = jwt.verify(token, this.signingSecret, { issuer: 'bookmyshow-replica' });
      return typeof payload === 'object' && typeof payload.sub === 'string' ? { userId: payload.sub } : undefined;
    } catch {
      return undefined;
    }
  }
}
