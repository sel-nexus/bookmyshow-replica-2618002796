import { existsSync, rmSync } from 'fs';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import type { AppConfig } from '../src/config';
import { createDatabase } from '../src/db/database';

const files: string[] = [];
const testConfig: AppConfig = { port: 3001, databasePath: '', sessionSecret: 'a-test-secret-that-is-long-enough', sessionCookieName: 'bms_session', corsOrigin: 'http://localhost:3000', cookieSecure: false };
/** Builds an API app backed by one temporary SQLite catalogue database. */
function buildApp() { const path = join(tmpdir(), `catalog-api-${randomUUID()}.sqlite`); files.push(path); return createApp({ database: createDatabase(path), appConfig: { ...testConfig, databasePath: path } }); }
afterEach(() => { files.splice(0).forEach((path) => { if (existsSync(path)) rmSync(path); }); });

describe('catalogue API', () => {
  it('returns exactly the seeded movies', async () => {
    const response = await request(buildApp()).get('/api/movies');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ movies: [{ id: 'movie-paradise', title: 'Paradise' }, { id: 'movie-bloody-romeo', title: 'Bloody Romeo' }, { id: 'movie-og2', title: 'OG2' }] });
  });
  it('returns only theatres mapped to the requested movie', async () => {
    const response = await request(buildApp()).get('/api/theatres').query({ movieId: 'movie-og2' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ theatres: [{ id: 'theatre-allu-cinemas', name: 'Allu Cinemas' }] });
  });
  it('uses the error envelope when movieId is missing', async () => {
    const response = await request(buildApp()).get('/api/theatres');
    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({ code: 'INVALID_REQUEST', requestId: expect.any(String) });
  });
  it('uses the error envelope for an unknown movie', async () => {
    const response = await request(buildApp()).get('/api/theatres').query({ movieId: 'missing' });
    expect(response.status).toBe(404);
    expect(response.body.error).toMatchObject({ code: 'MOVIE_NOT_FOUND', requestId: expect.any(String) });
  });
});
