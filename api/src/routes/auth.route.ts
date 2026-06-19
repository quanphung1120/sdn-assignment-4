import express from 'express';
import { z } from 'zod';

import { env } from '../config/env';
import { asyncHandler } from '../lib/utils';
import { validateBody } from '../middleware/validate';
import { login, register } from '../services/auth.service';
import type { LoginInput, RegisterInput } from '../services/auth.service';

const router = express.Router();

const RegisterSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  isAdmin: z.boolean().optional().default(false),
});

const LoginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});


router.post(
  '/register',
  validateBody(RegisterSchema),
  asyncHandler<RegisterInput>(async (req, res) => {
    // Registration creates the account but does NOT start a session — no auth
    // cookie is set, so the user must log in afterward.
    const result = await register(req.body);
    res.status(201).json({ user: result.user });
  }),
);

router.post(
  '/login',
  validateBody(LoginSchema),
  asyncHandler<LoginInput>(async (req, res) => {
    const result = await login(req.body);
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
    res.json({ user: result.user });
  }),
);

export default router;
