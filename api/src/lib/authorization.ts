import { Types } from 'mongoose';

import { ForbiddenError } from './errors';
import type { JwtPayload } from './authentication';

/**
 * Authorize a mutation on an authored resource: only an admin or the resource's
 * own author may proceed. Throws ForbiddenError otherwise.
 */
export function assertCanModify(
  authorId: Types.ObjectId | null | undefined,
  user: JwtPayload,
): void {
  if (!user.isAdmin && authorId && String(authorId) !== user.id) {
    throw new ForbiddenError();
  }
}
