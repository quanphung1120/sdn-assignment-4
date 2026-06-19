import express from 'express';
import { z } from 'zod';

import { asyncHandler } from '../lib/utils';
import { verifyUser } from '../lib/authentication';
import { validateBody } from '../middleware/validate';
import {
  createQuiz,
  deleteQuiz,
  getQuizById,
  getQuizzes,
  updateQuiz,
} from '../services/quiz.service';
import type { CreateQuizInput, UpdateQuizInput } from '../services/quiz.service';

const router = express.Router();

const CreateQuizSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional().default(''),
  questions: z
    .array(z.string().trim().min(1))
    .min(1, 'Select at least 1 question'),
});

const UpdateQuizSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').optional(),
  description: z.string().trim().optional(),
  questions: z
    .array(z.string().trim().min(1))
    .min(1, 'Select at least 1 question')
    .optional(),
});

router.get(
  '/',
  verifyUser,
  asyncHandler(async (_req, res) => {
    const quizzes = await getQuizzes();
    res.json(quizzes);
  }),
);

router.get(
  '/:id',
  verifyUser,
  asyncHandler(async (req, res) => {
    const quiz = await getQuizById(req.params.id as string);
    res.json(quiz);
  }),
);

router.post(
  '/',
  verifyUser,
  validateBody(CreateQuizSchema),
  asyncHandler<CreateQuizInput>(async (req, res) => {
    const result = await createQuiz(req.body, req.user!.id);
    res.status(201).json(result);
  }),
);

router.put(
  '/:id',
  verifyUser,
  validateBody(UpdateQuizSchema),
  asyncHandler<UpdateQuizInput>(async (req, res) => {
    const result = await updateQuiz(req.params.id as string, req.body, req.user!);
    res.json(result);
  }),
);

router.delete(
  '/:id',
  verifyUser,
  asyncHandler(async (req, res) => {
    const result = await deleteQuiz(req.params.id as string, req.user!);
    res.json(result);
  }),
);

export default router;
