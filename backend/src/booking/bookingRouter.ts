import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { SessionService } from '../auth/sessionService';
import { ApiError } from '../shared/errors';
import { BookingService } from './bookingService';

const requestSchema = z.object({ movieId: z.string().min(1).max(128), theatreId: z.string().min(1).max(128), seats: z.array(z.string().min(1).max(32)).min(1).max(100), paymentMethod: z.enum(['CARD', 'UPI']), totalPricePaise: z.number().int().positive() }).strict();
const uuidSchema = z.string().uuid();

/** Builds protected, idempotent booking confirmation routes. */
export function createBookingRouter(bookingService: BookingService, sessionService: SessionService, cookieName: string): Router {
  const router = Router();
  router.post('/bookings', (req: Request, res: Response, next: NextFunction): void => {
    try {
      const input = requestSchema.safeParse(req.body);
      const idempotencyKey = req.header('Idempotency-Key');
      if (!input.success || !idempotencyKey || !uuidSchema.safeParse(idempotencyKey).success) throw new ApiError(400, 'INVALID_REQUEST', 'A valid booking request and UUID Idempotency-Key are required.');
      const principal = sessionService.verifyFromCookie(req.header('cookie'), cookieName);
      if (!principal) throw new ApiError(401, 'UNAUTHENTICATED', 'A verified session is required to confirm a booking.');
      const confirmation = bookingService.confirm(principal.userId, idempotencyKey, input.data);
      res.status(201).json({ booking: confirmation });
    } catch (error) { next(error); }
  });
  return router;
}
