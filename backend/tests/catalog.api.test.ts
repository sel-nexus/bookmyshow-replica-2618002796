import { existsSync, rmSync } from 'fs';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';
import express from 'express';
import Database, { type Database as DatabaseConnection } from 'better-sqlite3';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { loadConfig, type AppConfig } from '../src/config';
import { createCatalogRouter } from '../src/catalog/catalogRouter';
import { CatalogRepository } from '../src/catalog/catalogRepository';
import { CatalogService } from '../src/catalog/catalogService';
import { createDatabase } from '../src/db/database';
import { runMigrations } from '../src/db/migrations';
import { errorHandler, requestIdMiddleware } from '../src/shared/errors';

const fixtures: Array<{ path: string; database: DatabaseConnection }> = [];
const testConfig: AppConfig = { port: 3001, databasePath: '', sessionSecret: 'a-test-secret-that-is-long-enough', sessionCookieName: 'bms_session', corsOrigin: 'http://localhost:3000', cookieSecure: false, catalogueEmpty: false, catalogueDelayMs: 0 };
function buildApp() {
  const path = join(tmpdir(), `catalog-api-${randomUUID()}.sqlite`);
  const database = createDatabase(path);
  fixtures.push({ path, database });
  return { app: createApp({ database, appConfig: { ...testConfig, databasePath: path } }), database };
}
afterEach(() => fixtures.splice(0).forEach(({ path, database }) => { if (database.open) database.close(); if (existsSync(path)) rmSync(path); }));

describe('catalogue API', () => {
  it('returns exactly the seeded movies', async () => {
    const response = await request(buildApp().app).get('/api/movies');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ movies: [{ id: 'movie-paradise', title: 'Paradise' }, { id: 'movie-bloody-romeo', title: 'Bloody Romeo' }, { id: 'movie-og2', title: 'OG2' }] });
  });

  it('returns CATALOG_UNAVAILABLE when its real SQLite catalogue dependency has closed', async () => {
    const { app, database } = buildApp();
    database.close();
    const response = await request(app).get('/api/movies');
    expect(response.status).toBe(500);
    expect(response.body.error).toEqual({ code: 'CATALOG_UNAVAILABLE', message: 'The catalogue is temporarily unavailable.', requestId: expect.any(String) });
  });

  it('uses normal seed and immediate-response defaults while validating E2E fixture settings', () => {
    const defaults = loadConfig({ SESSION_SECRET: 'a-test-secret-that-is-long-enough' });
    expect(defaults).toMatchObject({ catalogueEmpty: false, catalogueDelayMs: 0 });
    expect(loadConfig({ SESSION_SECRET: 'a-test-secret-that-is-long-enough', CATALOGUE_EMPTY: 'true', CATALOGUE_DELAY_MS: '20' })).toMatchObject({ catalogueEmpty: true, catalogueDelayMs: 20 });
    expect(() => loadConfig({ SESSION_SECRET: 'a-test-secret-that-is-long-enough', CATALOGUE_EMPTY: 'yes' })).toThrow();
    expect(() => loadConfig({ SESSION_SECRET: 'a-test-secret-that-is-long-enough', CATALOGUE_DELAY_MS: '-1' })).toThrow();
  });

  it('can create a clean catalogue fixture when configured not to seed', () => {
    const path = join(tmpdir(), `catalog-empty-${randomUUID()}.sqlite`);
    const database = new Database(path);
    fixtures.push({ path, database });
    runMigrations(database, true);
    expect(database.prepare('SELECT COUNT(*) AS count FROM movies').get()).toEqual({ count: 0 });
  });

  it('delays catalogue responses only when configured without changing their JSON contract', async () => {
    const { database } = buildApp();
    const app = express();
    app.use(requestIdMiddleware);
    app.use('/api', createCatalogRouter(new CatalogService(new CatalogRepository(database)), 20));
    app.use(errorHandler);
    const startedAt = Date.now();
    const response = await request(app).get('/api/movies');
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(15);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ movies: [{ id: 'movie-paradise', title: 'Paradise' }, { id: 'movie-bloody-romeo', title: 'Bloody Romeo' }, { id: 'movie-og2', title: 'OG2' }] });
  });

  it('returns only theatres mapped to the requested movie', async () => {
    const response = await request(buildApp().app).get('/api/theatres').query({ movieId: 'movie-og2' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ theatres: [{ id: 'theatre-allu-cinemas', name: 'Allu Cinemas' }] });
  });

  it.each([
    ['missing movieId', '/api/theatres'],
    ['wrong-type repeated movieId', '/api/theatres?movieId=movie-og2&movieId=movie-paradise'],
    ['empty movieId', '/api/theatres?movieId='],
    ['oversized movieId', `/api/theatres?movieId=${'m'.repeat(129)}`],
  ])('returns 400 for theatres with %s', async (_label, path) => {
    const response = await request(buildApp().app).get(path);
    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({ code: 'INVALID_REQUEST', requestId: expect.any(String) });
  });

  it('returns 404 with an error envelope for an unknown movie', async () => {
    const response = await request(buildApp().app).get('/api/theatres').query({ movieId: 'missing' });
    expect(response.status).toBe(404);
    expect(response.body.error).toMatchObject({ code: 'MOVIE_NOT_FOUND', requestId: expect.any(String) });
  });

  it('safely rejects SQL/XSS-shaped catalogue lookup values without changing the catalogue', async () => {
    const { app, database } = buildApp();
    const before = database.prepare('SELECT COUNT(*) AS count FROM movies').get() as { count: number };
    const response = await request(app).get('/api/theatres').query({ movieId: "movie-og2' OR 1=1 --<script>alert(1)</script>" });
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('MOVIE_NOT_FOUND');
    expect((database.prepare('SELECT COUNT(*) AS count FROM movies').get() as { count: number }).count).toBe(before.count);
  });
});
