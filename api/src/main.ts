/* eslint-disable no-process-env */

import express from 'express';
import helmet from 'helmet';
import logger from 'jet-logger';
import morgan from 'morgan';

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
