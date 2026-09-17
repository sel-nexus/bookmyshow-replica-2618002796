import { ApiError } from '../shared/errors';
import { CatalogRepository, type CatalogMovie, type CatalogTheatre } from './catalogRepository';

/** Applies catalogue retrieval rules to persisted movie and theatre data. */
export class CatalogService {
  /** Creates a service using the supplied catalogue repository. */
  constructor(private readonly catalogRepository: CatalogRepository) {}

  /** Returns all movies made available by the seeded catalogue. */
  listMovies(): CatalogMovie[] {
    return this.catalogRepository.listMovies();
  }

  /** Returns mapped theatres or fails when the requested movie does not exist. */
  listTheatres(movieId: string): CatalogTheatre[] {
    if (!this.catalogRepository.findMovie(movieId)) throw new ApiError(404, 'MOVIE_NOT_FOUND', 'The requested movie was not found.');
    return this.catalogRepository.listTheatresForMovie(movieId);
  }
}
