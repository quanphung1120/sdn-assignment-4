import { JwtPayload } from '../lib/authentication';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
