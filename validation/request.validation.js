import { z } from 'zod';

export const createUserSchema = z.object({
    firstname: z.string().min(3, 'First name is required'),
    lastname: z.string().optional(),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
}); 

export const loginUserSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
});


export const shortenUrlSchema = z.object({
    url: z.string().url('Invalid URL format'),
    code: z.string().min(3).max(20).optional(),
});