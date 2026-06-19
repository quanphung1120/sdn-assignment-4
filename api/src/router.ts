import express, { NextFunction, Request, Response } from 'express';
import logger from 'jet-logger';

import { ForbiddenError } from './lib/errors';
import authRouter from './routes/auth.route';
import questionRouter from './routes/question.route';
import quizRouter from './routes/quiz.route';
import {
  InvalidCredentialsError,
  UsernameAlreadyTakenError,
} from './services/auth.service';
import {
  QuestionNotFoundError,
  QuestionValidationError,
} from './services/question.service';
import { QuizNotFoundError } from './services/quiz.service';

const router = express.Router();

router.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/api/auth', authRouter);
router.use('/api/questions', questionRouter);
router.use('/api/quizzes', quizRouter);

// ── Global error handler ──────────────────────────────────────────────────────

router.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof UsernameAlreadyTakenError) {
    res.status(409).json({ message: err.message });
    return;
  }

  if (err instanceof InvalidCredentialsError) {
    res.status(401).json({ message: err.message });
    return;
  }

  if (err instanceof QuestionValidationError) {
    res.status(400).json({ message: err.message, errors: err.errors });
    return;
  }

  if (err instanceof QuestionNotFoundError) {
    res.status(404).json({ message: err.message });
    return;
  }

  if (err instanceof QuizNotFoundError) {
    res.status(404).json({ message: err.message });
    return;
  }

  if (err instanceof ForbiddenError) {
    res.status(403).json({ message: err.message });
    return;
  }

  logger.err(err);
  res.status(500).json({ message: 'Internal server error' });
});

export default router;
