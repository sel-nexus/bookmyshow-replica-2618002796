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
}
