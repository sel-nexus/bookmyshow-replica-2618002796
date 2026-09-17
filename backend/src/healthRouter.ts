import { Router, type Request, type Response } from 'express';
import type Database from 'better-sqlite3';

/** Builds a readiness endpoint that proves SQLite can serve a query. */
export function createHealthRouter(database: Database.Database): Router {
  const router = Router();
  router.get('/health', (_req: Request, res: Response): void => {
    try {
      database.prepare('SELECT 1 AS healthy').get();
      res.status(200).json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'unavailable' });
    }
  });
  return router;
}
