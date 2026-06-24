import bcrypt from 'bcryptjs';

import { generateToken } from '../lib/authentication';
import { UserModel } from '../models/User';

const SALT_ROUNDS = 10;

export interface RegisterInput {
  username: string;
  password: string;
  isAdmin?: boolean;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    username: string;
    isAdmin: boolean;
  };
}

export class UsernameAlreadyTakenError extends Error {
  constructor() {
    super('Username already taken');
    this.name = 'UsernameAlreadyTakenError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}

async function issueAuthResult(user: {
  _id: unknown;
  username: string;
  isAdmin: boolean;
}): Promise<AuthResult> {
  const payload = {
    id: String(user._id),
    username: user.username,
    isAdmin: user.isAdmin,
  };
  const token = await generateToken(payload);
  return { token, user: payload };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const { username, password, isAdmin = false } = input;

  const existing = await UserModel.findOne({ username });
  if (existing) {
    throw new UsernameAlreadyTakenError();
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await UserModel.create({
    username,
    password: hashedPassword,
    isAdmin,
  });
  return issueAuthResult(user);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const { username, password } = input;

  const user = await UserModel.findOne({ username });
  if (!user) {
    throw new InvalidCredentialsError();
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw new InvalidCredentialsError();
  }

  return issueAuthResult(user);
}
