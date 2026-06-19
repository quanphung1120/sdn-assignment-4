import { NextFunction, Request, Response } from 'express';
import { jwtVerify, SignJWT } from 'jose';

import { env } from '../config/env';

// Encode secret as Uint8Array for jose
const SECRET_KEY = new TextEncoder().encode(env.JWT_SECRET);

export interface JwtPayload {
  id: string;
  username: string;
  isAdmin: boolean;
}

export async function verifyUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = (req.cookies as Record<string, string> | undefined)?.token;

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    req.user = payload as unknown as JwtPayload;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function verifyAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  void verifyUser(req, res, () => {
    if (!req.user?.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }
    next();
  });
}

export async function generateToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setSubject(payload.id)
    .setAudience([payload.username])
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}
