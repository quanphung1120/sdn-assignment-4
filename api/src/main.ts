import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import logger from 'jet-logger';
import mongoose from 'mongoose';
import morgan from 'morgan';

import { env } from './config/env';
import router from './router';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      if (
        env.CORS_ALLOWED_ORIGINS.includes(origin) ||
        (env.NODE_ENV === 'development' && origin.startsWith('http://localhost:'))
      ) {
        return callback(null, true);
      }
      const msg =
        'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    },
    credentials: true,
  }),
);

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

if (env.NODE_ENV === 'production') {
  app.use(helmet());
}

app.use(router);

mongoose
  .connect(env.MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    app.listen(env.PORT, env.HOST, () => {
      logger.info(`Express server started on http://${env.HOST}:${env.PORT}`);
    });
  })
  .catch((err: unknown) => {
    logger.err(`MongoDB connection error: ${String(err)}`);
    process.exit(1);
  });
