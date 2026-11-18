import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { notFoundHandler } from './middlewares/notFound.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { env } from './config/env';

export const createApp = (): Application => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/', (_req, res) => {
    res.status(200).json({
      name: 'Teacher Session Booking REST API',
      version: '1.0.0',
      status: 'active',
      documentation: '/api/v1/health'
    });
  });

  app.use('/api/v1', routes);
  app.use('/', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
