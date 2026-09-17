import type { ErrorRequestHandler, RequestHandler } from 'express';
import { randomUUID } from 'crypto';

/** Represents an error that can be safely returned from the API. */
export class ApiError extends Error {
  /** Creates a structured API error with an HTTP status and stable code. */
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
  }
}

/** Adds a correlation identifier to every API response. */
export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const requestId = req.header('x-request-id') ?? randomUUID();
  res.setHeader('X-Request-Id', requestId);
  res.locals.requestId = requestId;
  next();
};

/** Serializes application failures with the API's public error envelope. */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const requestId = res.locals.requestId as string | undefined ?? randomUUID();
  res.setHeader('X-Request-Id', requestId);
  if (error instanceof ApiError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message, requestId } });
    return;
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', requestId } });
};
