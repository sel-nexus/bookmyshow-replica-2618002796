import { ApiError } from '../shared/errors';
import { SessionService } from './sessionService';
import type { User } from './userRepository';
import { UserRepository } from './userRepository';

/** Describes a successful OTP verification response. */
export interface VerifiedSession {
  user: User;
  sessionToken: string;
}

/** Coordinates fixed-OTP verification and durable user provisioning. */
export class AuthService {
  /** Creates the authentication service from persistence and token collaborators. */
  constructor(private readonly users: UserRepository, private readonly sessions: SessionService) {}

  /** Validates the prescribed OTP and creates or finds the mobile-number user. */
  verify(mobileNumber: string, otp: string): VerifiedSession {
    if (otp !== '1234') throw new ApiError(401, 'OTP_NOT_ACCEPTED', 'The verification code is incorrect.');
    const user = this.users.findOrCreate(mobileNumber.trim());
    return { user, sessionToken: this.sessions.issue(user) };
  }
}
