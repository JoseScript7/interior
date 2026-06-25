import { z } from 'zod';

export const feedbackSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be under 100 characters'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(500, 'Message must be under 500 characters'),
  category: z.enum(['bug', 'feature', 'general'], {
    required_error: 'Please select a category',
  }),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
