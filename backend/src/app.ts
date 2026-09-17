import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import type Database from 'better-sqlite3';
import { createAuthRouter } from './auth/authRouter';
import { AuthService } from './auth/authService';
import { SessionService } from './auth/sessionService';
import { createCatalogRouter } from './catalog/catalogRouter';
import { CatalogRepository } from './catalog/catalogRepository';
import { CatalogService } from './catalog/catalogService';
import { UserRepository } from './auth/userRepository';
import { BookingRepository } from './booking/bookingRepository';
import { BookingService } from './booking/bookingService';
import { createBookingRouter } from './booking/bookingRouter';
import { config, type AppConfig } from './config';
import { createDatabase } from './db/database';
import { createHealthRouter } from './healthRouter';
import { errorHandler, requestIdMiddleware } from './shared/errors';

/** Creates an Express app with durable passwordless authentication routes. */
export function createApp(options: { database?: Database.Database; appConfig?: AppConfig } = {}): Express {
  const appConfig = options.appConfig ?? config;
  const database = options.database ?? createDatabase(appConfig.databasePath);
  const sessionService = new SessionService(appConfig.sessionSecret);
  const authService = new AuthService(new UserRepository(database), sessionService);
  const catalogService = new CatalogService(new CatalogRepository(database));
  const bookingService = new BookingService(new BookingRepository(database));
  const app = express();
  app.use(cors({ origin: appConfig.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestIdMiddleware);
  app.use('/api', createHealthRouter(database));
  app.use('/api/auth', createAuthRouter(authService, appConfig));
  app.use('/api', createCatalogRouter(catalogService));
  app.use('/api', createBookingRouter(bookingService, sessionService, appConfig.sessionCookieName));
  app.use(errorHandler);
  return app;
}
