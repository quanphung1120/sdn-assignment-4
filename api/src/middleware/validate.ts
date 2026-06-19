import { RequestHandler } from 'express';
import { flattenError, ZodTypeAny, z } from 'zod';

/**
 * Express middleware factory for Zod body validation.
 * The return type threads `z.infer<T>` into Express's `RequestHandler` so that
 * downstream route handlers receive a fully-typed `req.body` with no manual cast.
 *
 * @example
 * router.post('/register', validateBody(RegisterSchema), handler);
 */
export function validateBody<T extends ZodTypeAny>(schema: T): RequestHandler<Record<string, unknown>, unknown, z.infer<T>> {
  return (req, res, next): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: flattenError(result.error).fieldErrors,
      });
      return;
    }

    // Replace req.body with the parsed & coerced value
    req.body = result.data;
    next();
  };
}
