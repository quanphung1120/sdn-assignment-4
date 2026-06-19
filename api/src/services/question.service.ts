import { assertCanModify } from '../lib/authorization';
import { QuestionModel } from '../models/Question';
import type { JwtPayload } from '../lib/authentication';

export interface CreateQuestionInput {
  text: string;
  options: string[];
  keywords?: string[];
  correctAnswerIndex: number;
}

export interface UpdateQuestionInput {
  text?: string;
  options?: string[];
  keywords?: string[];
  correctAnswerIndex?: number;
}

export class QuestionNotFoundError extends Error {
  constructor() {
    super('Question not found');
    this.name = 'QuestionNotFoundError';
  }
}

export class QuestionValidationError extends Error {
  errors: Record<string, string[]>;
  constructor(errors: Record<string, string[]>) {
    super('Validation failed');
    this.name = 'QuestionValidationError';
    this.errors = errors;
  }
}

export async function createQuestion(
  input: CreateQuestionInput,
  authorId: string,
) {
  const question = await QuestionModel.create({
    ...input,
    author: authorId,
  });
  return question.populate('author', 'username isAdmin');
}

export async function getQuestions() {
  return QuestionModel.find().populate('author', 'username isAdmin');
}

export async function getQuestionById(id: string) {
  const question = await QuestionModel.findById(id).populate(
    'author',
    'username isAdmin',
  );
  if (!question) {
    throw new QuestionNotFoundError();
  }
  return question;
}

export async function updateQuestion(
  id: string,
  input: UpdateQuestionInput,
  user: JwtPayload,
) {
  const question = await QuestionModel.findById(id);
  if (!question) {
    throw new QuestionNotFoundError();
  }

  // Validate correctAnswerIndex against the effective options (current + incoming).
  const options = input.options ?? question.options;
  const index = input.correctAnswerIndex ?? question.correctAnswerIndex;
  if (index >= options.length) {
    throw new QuestionValidationError({
      correctAnswerIndex: [
        'correctAnswerIndex must be less than the number of options',
      ],
    });
  }

  assertCanModify(question.author, user);

  // Update fields
  if (input.text !== undefined) question.text = input.text;
  if (input.options !== undefined) question.options = input.options;
  if (input.keywords !== undefined) question.keywords = input.keywords;
  if (input.correctAnswerIndex !== undefined)
    question.correctAnswerIndex = input.correctAnswerIndex;

  await question.save();
  return question.populate('author', 'username isAdmin');
}

export async function deleteQuestion(id: string, user: JwtPayload) {
  const question = await QuestionModel.findById(id);
  if (!question) {
    throw new QuestionNotFoundError();
  }

  assertCanModify(question.author, user);

  await question.deleteOne();
  return { success: true };
}
