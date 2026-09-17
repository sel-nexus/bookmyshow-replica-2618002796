import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { config } from '../config';
import { ApiError } from '../shared/errors';
import { CatalogService } from './catalogService';

const theatresQuerySchema = z.object({ movieId: z.string().min(1).max(128) }).strict();

/** Waits only when the configuration requests catalogue response latency for E2E coverage. */
function delayCatalogueResponse(delayMs: number): Promise<void> {
  return delayMs === 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, delayMs));
}

/** Converts an unexpected catalogue dependency failure into the stable public error contract. */
function handleCatalogueError(error: unknown, next: NextFunction): void {
  next(error instanceof ApiError ? error : new ApiError(500, 'CATALOG_UNAVAILABLE', 'The catalogue is temporarily unavailable.'));
}

/** Builds public catalogue routes using the supplied retrieval service. */
export function createCatalogRouter(catalogService: CatalogService, catalogueDelayMs = config.catalogueDelayMs): Router {
  const router = Router();
  router.get('/movies', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await delayCatalogueResponse(catalogueDelayMs);
      res.status(200).json({ movies: catalogService.listMovies() });
    } catch (error) { handleCatalogueError(error, next); }
  });
  router.get('/theatres', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = theatresQuerySchema.safeParse(req.query);
      if (!query.success) throw new ApiError(400, 'INVALID_REQUEST', 'A movieId query parameter is required.');
      await delayCatalogueResponse(catalogueDelayMs);
      res.status(200).json({ theatres: catalogService.listTheatres(query.data.movieId) });
    } catch (error) { handleCatalogueError(error, next); }
  });
  return router;
}
