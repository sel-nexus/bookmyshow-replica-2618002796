import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../shared/errors';
import { CatalogService } from './catalogService';

const theatresQuerySchema = z.object({ movieId: z.string().min(1) });

/** Builds public catalogue routes using the supplied retrieval service. */
export function createCatalogRouter(catalogService: CatalogService): Router {
  const router = Router();
  router.get('/movies', (_req: Request, res: Response, next: NextFunction): void => {
    try { res.status(200).json({ movies: catalogService.listMovies() }); } catch (error) { next(error); }
  });
  router.get('/theatres', (req: Request, res: Response, next: NextFunction): void => {
    try {
      const query = theatresQuerySchema.safeParse(req.query);
      if (!query.success) throw new ApiError(400, 'INVALID_REQUEST', 'A movieId query parameter is required.');
      res.status(200).json({ theatres: catalogService.listTheatres(query.data.movieId) });
    } catch (error) { next(error); }
  });
  return router;
}
