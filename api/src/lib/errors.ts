/**
 * Cross-cutting domain errors shared across services.
 * The global error handler in `router.ts` maps these to HTTP status codes.
 */

export class ForbiddenError extends Error {
  constructor() {
    super('You are not authorized to perform this action');
    this.name = 'ForbiddenError';
  }
}
