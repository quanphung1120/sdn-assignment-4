import { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wraps an async Express route handler and forwards any thrown errors
 * to the next() error-handling middleware, eliminating boilerplate try/catch.
 *
 * Accepts an optional Body generic so the handler receives a typed req.body:
 * @example
 * asyncHandler<RegisterInput>(async (req, res) => {
 *   await register(req.body); // req.body is RegisterInput, not any
 * })
 */
export const asyncHandler =
  <Body = unknown>(
    fn: (req: Request<Record<string, unknown>, unknown, Body>, res: Response, next: NextFunction) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req as Request<Record<string, unknown>, unknown, Body>, res, next)).catch(next);
  };
