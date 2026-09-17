import { existsSync, rmSync } from 'fs';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { CatalogRepository } from '../src/catalog/catalogRepository';
import { CatalogService } from '../src/catalog/catalogService';
import { runMigrations } from '../src/db/migrations';

const databases: Database.Database[] = [];
const files: string[] = [];
/** Builds an isolated file-backed SQLite catalogue service. */
function buildService(): CatalogService {
  const path = join(tmpdir(), `catalog-service-${randomUUID()}.sqlite`);
  files.push(path);
  const database = new Database(path);
  databases.push(database);
  runMigrations(database);
  return new CatalogService(new CatalogRepository(database));
}
afterEach(() => { databases.splice(0).forEach((database) => database.close()); files.splice(0).forEach((path) => { if (existsSync(path)) rmSync(path); }); });

describe('CatalogService', () => {
  it('returns exactly the seeded movies from SQLite', () => {
    expect(buildService().listMovies()).toEqual([{ id: 'movie-paradise', title: 'Paradise' }, { id: 'movie-bloody-romeo', title: 'Bloody Romeo' }, { id: 'movie-og2', title: 'OG2' }]);
  });
  it('returns only the explicitly mapped theatre for a movie', () => {
    expect(buildService().listTheatres('movie-paradise')).toEqual([{ id: 'theatre-sandhya-70mm', name: 'Sandhya 70mm' }]);
  });
  it('rejects an unknown movie', () => {
    expect(() => buildService().listTheatres('missing')).toThrow('requested movie was not found');
  });
});
