/**
 * HOOPERITS CMS - Auth Service
 * User authentication and management
 */

import { db } from '../db';
import { hashPassword, verifyPassword } from './password';
import { NotFoundError, UnauthorizedError, ConflictError } from '../errors';
import type { UserRole } from './permissions';

export interface UserInput {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends User {
  password: string;
}

/**
 * Create a new user
 */
export async function createUser(input: UserInput): Promise<User> {
  // Check if email already exists
  const existing = await db.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existing) {
    throw new ConflictError('A user with this email already exists');
  }

  const hashedPassword = await hashPassword(input.password);

  const user = await db.user.create({
    data: {
      email: input.email.toLowerCase(),
      password: hashedPassword,
      name: input.name,
      role: input.role ?? 'VIEWER',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user as User;
}

/**
 * Authenticate a user with email and password
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<User> {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User> {
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User', id);
  }

  return user as User;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user as User | null;
}

/**
 * Update user
 */
export async function updateUser(
  id: string,
  data: Partial<Pick<UserInput, 'name' | 'role'>>
): Promise<User> {
  const user = await db.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user as User;
}

/**
 * Update user password
 */
export async function updatePassword(id: string, newPassword: string): Promise<void> {
  const hashedPassword = await hashPassword(newPassword);

  await db.user.update({
    where: { id },
    data: { password: hashedPassword },
  });
}

/**
 * Delete user
 */
export async function deleteUser(id: string): Promise<void> {
  await db.user.delete({
    where: { id },
  });
}

/**
 * List all users
 */
export async function listUsers(): Promise<User[]> {
  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return users as User[];
}
