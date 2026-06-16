/* eslint-disable no-process-env */

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import logger from 'jet-logger';
import morgan from 'morgan';

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup CORS
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      if (
        allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV === 'development' &&
          origin.startsWith('http://localhost:'))
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

// Show routes called in console during development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Security headers in production
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
}

// Simple health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';

// Start the server
app.listen(Number(port), host, () => {
  logger.info(`Express server started on http://${host}:${port}`);
});
