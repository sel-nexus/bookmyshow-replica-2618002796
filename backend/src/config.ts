import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/** Represents the validated runtime configuration for the backend. */
export interface AppConfig {
  port: number;
  databasePath: string;
  sessionSecret: string;
  sessionCookieName: string;
  corsOrigin: string;
  cookieSecure: boolean;
}

const environmentSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_PATH: z.string().min(1).default('./auth-foundation.sqlite'),
  SESSION_SECRET: z.string().min(16),
  SESSION_COOKIE_NAME: z.string().min(1).default('bms_session'),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false')
});

/** Loads and validates environment-backed backend configuration. */
export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = environmentSchema.parse(environment);
  return {
    port: parsed.PORT,
    databasePath: parsed.DATABASE_PATH,
    sessionSecret: parsed.SESSION_SECRET,
    sessionCookieName: parsed.SESSION_COOKIE_NAME,
    corsOrigin: parsed.CORS_ORIGIN,
    cookieSecure: parsed.COOKIE_SECURE === 'true'
  };
}

/** Holds the process configuration after fail-fast validation. */
export const config = loadConfig();
