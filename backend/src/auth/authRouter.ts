import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import type { AppConfig } from '../config';
import { ApiError } from '../shared/errors';
import { AuthService } from './authService';

const loginSchema = z.object({ mobileNumber: z.string().min(1).max(32) }).strict();
const verifySchema = z.object({ mobileNumber: z.string().min(1).max(32), otp: z.string().min(1).max(32) }).strict();

/** Builds mobile OTP authentication routes using the supplied service. */
export function createAuthRouter(authService: AuthService, appConfig: AppConfig): Router {
  const router = Router();
  router.post('/login', (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!loginSchema.safeParse(req.body).success) throw new ApiError(400, 'INVALID_REQUEST', 'A mobile number is required.');
      res.status(200).json({ status: 'OTP_REQUIRED' });
    } catch (error) { next(error); }
  });
  router.post('/verify', (req: Request, res: Response, next: NextFunction): void => {
    try {
      const input = verifySchema.safeParse(req.body);
      if (!input.success) throw new ApiError(400, 'INVALID_REQUEST', 'Mobile number and OTP are required.');
      const result = authService.verify(input.data.mobileNumber, input.data.otp);
      res.cookie(appConfig.sessionCookieName, result.sessionToken, { httpOnly: true, secure: appConfig.cookieSecure, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' });
      res.status(200).json({ status: 'AUTHENTICATED', sessionToken: result.sessionToken, user: result.user });
    } catch (error) { next(error); }
  });
  return router;
}
