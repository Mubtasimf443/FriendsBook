/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { z } from 'zod';
import { ProfileCreatedBy, Gender } from '../types/user.types';

export const UserSchema = z.object({
  profileCreatedBy: z.nativeEnum(ProfileCreatedBy),
  gender: z.nativeEnum(Gender),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters'),
  dateOfBirth: z.string()
    .transform((str) => new Date(str))
    .refine((date) => date <= new Date(), {
      message: 'Date of birth cannot be in the future'
    }),
  email: z.string()
    .email('Invalid email address'),
  height: z.number()
    .min(100, 'Height must be at least 100 cm')
    .max(250, 'Height must not exceed 250 cm'),
  age: z.number()
    .min(18, 'Must be at least 18 years old')
    .max(100, 'Age must not exceed 100'),
  weight: z.number()
    .min(30, 'Weight must be at least 30 kg')
    .max(200, 'Weight must not exceed 200 kg'),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    yearOfCompletion: z.number()
      .min(1950)
      .max(new Date().getFullYear())
  })),
  country: z.string(),
  address: z.string(),
  phoneNumber: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  languages: z.array(z.string()),
  religion: z.string(),
  preferences: z.object({
    education: z.array(z.string()).optional(),
    location: z.array(z.string()).optional(),
    weight: z.object({
      min: z.number().optional(),
      max: z.number().optional()
    }).optional()
  }).optional()
});