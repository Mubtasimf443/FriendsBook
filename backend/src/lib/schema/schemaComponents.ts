/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { z } from 'zod';
import { Types } from 'mongoose';


export const _idValidator =  z.string({
    required_error: "User ID is required",
    invalid_type_error: "User ID must be a string"
})
    .trim()
    .refine((val) => Types.ObjectId.isValid(val), {
        message: "Invalid user ID format"
    });


export const passwordValidator = z.string()
         .min(8, "Password must be at least 8 characters")
         .max(100, "Password must not exceed 100 characters")
         .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
             "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character")
         .transform((val) => val.trim());


export const emailValidatior = z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string"
})
    .email("Invalid email format")
    .trim()
    .max(100 , "Email  must not exceed 100 characters")
    .toLowerCase();
    
    