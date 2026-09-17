import type Database from 'better-sqlite3';

/** Represents the public movie data stored in the catalogue. */
export interface CatalogMovie { id: string; title: string; }

/** Represents the public theatre data stored in the catalogue. */
export interface CatalogTheatre { id: string; name: string; }

/** Reads seeded catalogue data and its explicit movie-theatre mappings. */
export class CatalogRepository {
  /** Creates a repository bound to the application's SQLite connection. */
  constructor(private readonly database: Database.Database) {}

  /** Lists every seeded movie in deterministic display order. */
  listMovies(): CatalogMovie[] {
    return this.database.prepare('SELECT id, title FROM movies ORDER BY display_order').all() as CatalogMovie[];
  }

  /** Finds one movie by its public identifier. */
  findMovie(movieId: string): CatalogMovie | undefined {
    return this.database.prepare('SELECT id, title FROM movies WHERE id = ?').get(movieId) as CatalogMovie | undefined;
  }

  /** Lists only theatres explicitly mapped to the requested movie. */
  listTheatresForMovie(movieId: string): CatalogTheatre[] {
    return this.database.prepare(`SELECT theatres.id, theatres.name FROM theatres
      INNER JOIN movie_theatres ON movie_theatres.theatre_id = theatres.id
      WHERE movie_theatres.movie_id = ? ORDER BY theatres.display_order`).all(movieId) as CatalogTheatre[];
  }
}
