import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import type Database from 'better-sqlite3';
import { createAuthRouter } from './auth/authRouter';
import { AuthService } from './auth/authService';
import { SessionService } from './auth/sessionService';
import { UserRepository } from './auth/userRepository';
import { config, type AppConfig } from './config';
import { createDatabase } from './db/database';
import { errorHandler, requestIdMiddleware } from './shared/errors';

/** Creates an Express app with durable passwordless authentication routes. */
export function createApp(options: { database?: Database.Database; appConfig?: AppConfig } = {}): Express {
  const appConfig = options.appConfig ?? config;
  const database = options.database ?? createDatabase(appConfig.databasePath);
  const authService = new AuthService(new UserRepository(database), new SessionService(appConfig.sessionSecret));
  const app = express();
  app.use(cors({ origin: appConfig.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestIdMiddleware);
  app.get('/api/health', (_req: Request, res: Response): void => { res.status(200).json({ status: 'ok' }); });
  app.use('/api/auth', createAuthRouter(authService, appConfig));
  app.use(errorHandler);
  return app;
}
