import express from 'express';
import { z } from 'zod';

import { asyncHandler } from '../lib/utils';
import { verifyUser } from '../lib/authentication';
import { validateBody } from '../middleware/validate';
import {
  createQuestion,
  deleteQuestion,
  getQuestionById,
  getQuestions,
  updateQuestion,
} from '../services/question.service';
import type {
  CreateQuestionInput,
  UpdateQuestionInput,
} from '../services/question.service';

const router = express.Router();

const CreateQuestionSchema = z
  .object({
    text: z.string().trim().min(1, 'Question text is required'),
    options: z
      .array(z.string().trim().min(1, 'Option cannot be empty'))
      .min(2, 'At least 2 options are required'),
    keywords: z.array(z.string().trim()).optional().default([]),
    correctAnswerIndex: z
      .number()
      .int()
      .min(0, 'Correct answer index must be >= 0'),
  })
  .refine((data) => data.correctAnswerIndex < data.options.length, {
    message: 'correctAnswerIndex must be less than the number of options',
    path: ['correctAnswerIndex'],
  });

const UpdateQuestionSchema = z
  .object({
    text: z.string().trim().min(1, 'Question text cannot be empty').optional(),
    options: z
      .array(z.string().trim().min(1, 'Option cannot be empty'))
      .min(2, 'At least 2 options are required')
      .optional(),
    keywords: z.array(z.string().trim()).optional(),
    correctAnswerIndex: z
      .number()
      .int()
      .min(0, 'Correct answer index must be >= 0')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.options !== undefined && data.correctAnswerIndex !== undefined) {
        return data.correctAnswerIndex < data.options.length;
      }
      return true;
    },
    {
      message: 'correctAnswerIndex must be less than the number of options',
      path: ['correctAnswerIndex'],
    },
  );

router.get(
  '/',
  verifyUser,
  asyncHandler(async (_req, res) => {
    const questions = await getQuestions();
    res.json(questions);
  }),
);

router.get(
  '/:id',
  verifyUser,
  asyncHandler(async (req, res) => {
    const question = await getQuestionById(req.params.id as string);
    res.json(question);
  }),
);

router.post(
  '/',
  verifyUser,
  validateBody(CreateQuestionSchema),
  asyncHandler<CreateQuestionInput>(async (req, res) => {
    const result = await createQuestion(req.body, req.user!.id);
    res.status(201).json(result);
  }),
);

router.put(
  '/:id',
  verifyUser,
  validateBody(UpdateQuestionSchema),
  asyncHandler<UpdateQuestionInput>(async (req, res) => {
    const result = await updateQuestion(req.params.id as string, req.body, req.user!);
    res.json(result);
  }),
);

router.delete(
  '/:id',
  verifyUser,
  asyncHandler(async (req, res) => {
    const result = await deleteQuestion(req.params.id as string, req.user!);
    res.json(result);
  }),
);

export default router;
