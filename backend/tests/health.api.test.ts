import { existsSync, rmSync } from 'fs';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { createDatabase } from '../src/db/database';

const fixtures: Array<{ path: string; database: ReturnType<typeof createDatabase> }> = [];
function buildApp() {
  const path = join(tmpdir(), `health-api-${randomUUID()}.sqlite`);
  const database = createDatabase(path);
  fixtures.push({ path, database });
  return { app: createApp({ database, appConfig: { port: 3001, databasePath: path, sessionSecret: 'a-test-secret-that-is-long-enough', sessionCookieName: 'bms_session', corsOrigin: 'http://localhost:3000', cookieSecure: false } }), database };
}
afterEach(() => fixtures.splice(0).forEach(({ path, database }) => { if (database.open) database.close(); if (existsSync(path)) rmSync(path); }));

describe('health API', () => {
  it('returns 200 and ok when SQLite is available', async () => {
    const response = await request(buildApp().app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns 503 and unavailable after the SQLite database is closed', async () => {
    const { app, database } = buildApp();
    database.close();
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: 'unavailable' });
  });
});
