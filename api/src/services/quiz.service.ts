import mongoose from 'mongoose';

import { assertCanModify } from '../lib/authorization';
import { QuizModel } from '../models/Quiz';
import type { JwtPayload } from '../lib/authentication';

export interface CreateQuizInput {
  title: string;
  description?: string;
  questions: string[];
}

export interface UpdateQuizInput {
  title?: string;
  description?: string;
  questions?: string[];
}

export class QuizNotFoundError extends Error {
  constructor() {
    super('Quiz not found');
    this.name = 'QuizNotFoundError';
  }
}

export async function createQuiz(input: CreateQuizInput, authorId: string) {
  const quiz = await QuizModel.create({
    ...input,
    author: authorId,
  });
  return quiz.populate('author', 'username isAdmin');
}

// List view: author populated; questions left as ObjectId array (count only).
export async function getQuizzes() {
  return QuizModel.find().populate('author', 'username isAdmin');
}

// Detail view: questions + author fully populated (used for taking the quiz).
export async function getQuizById(id: string) {
  if (!mongoose.isValidObjectId(id)) {
    throw new QuizNotFoundError();
  }

  const quiz = await QuizModel.findById(id)
    .populate('author', 'username isAdmin')
    .populate('questions');

  if (!quiz) {
    throw new QuizNotFoundError();
  }
  return quiz;
}

export async function updateQuiz(
  id: string,
  input: UpdateQuizInput,
  user: JwtPayload,
) {
  if (!mongoose.isValidObjectId(id)) {
    throw new QuizNotFoundError();
  }

  const quiz = await QuizModel.findById(id);
  if (!quiz) {
    throw new QuizNotFoundError();
  }

  assertCanModify(quiz.author, user);

  if (input.title !== undefined) quiz.title = input.title;
  if (input.description !== undefined) quiz.description = input.description;
  if (input.questions !== undefined) quiz.set('questions', input.questions);

  await quiz.save();
  return quiz.populate('author', 'username isAdmin');
}

export async function deleteQuiz(id: string, user: JwtPayload) {
  if (!mongoose.isValidObjectId(id)) {
    throw new QuizNotFoundError();
  }

  const quiz = await QuizModel.findById(id);
  if (!quiz) {
    throw new QuizNotFoundError();
  }

  assertCanModify(quiz.author, user);

  await quiz.deleteOne();
  return { success: true };
}
