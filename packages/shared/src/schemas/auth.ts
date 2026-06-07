import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  display_name: z.string().min(1, 'Display name is required').max(50),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  display_name: z.string().min(1).max(50).optional(),
  bio: z.string().max(150).optional(),
  avatar_url: z.string().url().optional(),
});

export const postSchema = z.object({
  caption: z.string().max(2200).optional(),
  location: z.string().max(100).optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(500),
});

export const messageSchema = z.object({
  content: z.string().min(1).max(1000),
});
