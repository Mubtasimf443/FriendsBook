/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { z } from "zod";
import { ProfileCreatedBy, Gender, Height, Religion, Language, EducationLevel, SettingsType } from "../types/user.types";
import { countryCodes } from "../data/countryCodes";

const calculateAge = (dateOfBirth: Date): number => {
    const diff = new Date().getTime() - dateOfBirth.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)); // Convert milliseconds to years
};

const countryNames = countryCodes.map(c => c.country);
const phoneCountryCodes = countryCodes.map(c => c.code);
const CountryNameEnum = z.enum([countryNames[0], ...countryNames]);
const CountryPhoneCodeEnum = z.enum([phoneCountryCodes[0], ...phoneCountryCodes]);

export const registrationUserSchema = z.object({
    profileCreatedBy: z.nativeEnum(ProfileCreatedBy, {
        required_error: "Profile creator type is required",
        invalid_type_error: "Invalid profile creator type"
    }),
    age: z.number(),

    gender: z.nativeEnum(Gender, {
        required_error: "Gender is required",
        invalid_type_error: "Invalid gender type"
    }),

    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must not exceed 50 characters')
        .trim(),

    dateOfBirth: z.string()
        .transform((str) => new Date(str))
        .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
            message: "Invalid date format"
        })
        .refine((date) => date < new Date(), {
            message: "Date of birth cannot be in the future"
        })
        .refine((date) => {
            const age = Math.floor((new Date().getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            return age >= 18;
        }, {
            message: "You must be at least 18 years old"
        }),

    email: z.string()
        .email('Invalid email format')
        .toLowerCase()
        .trim(),

    height: z.nativeEnum(Height, {
        required_error: "Height is required",
        invalid_type_error: "Invalid height value"
    }),

    weight: z.number()
        .min(30, 'Weight must be at least 30 kg')
        .max(200, 'Weight must not exceed 200 kg'),

    isEducated: z.boolean(),

    education: z.array(
        z.object({
            level: z.nativeEnum(EducationLevel),
            certificate: z.string().min(2, "Certificate name is too short"),
            institution: z.string().min(2, "Institution name is too short"),
            yearOfCompletion: z.number()
                .min(1950, "Year must be after 1950")
                .max(new Date().getFullYear(), "Year cannot be in the future"),
            grade: z.string().optional(),
            additionalInfo: z.string().optional()
        })
    ).optional()
        .default([]),

    country: z.string()
        .min(2, "Country name is too short")
        .max(100, "Country name is too long"),

    address: z.string()
        .min(30, "Address must be at least 40 characters")
        .max(120, "Address must not exceed 120 characters"),

    phoneInfo: z.object({
        number: z.string()
            .regex(/^\d{10,15}$/, "Phone number must be between 10 and 15 digits"),
        country: z.object({
            name: CountryNameEnum.describe("Country name must be from the provided list"),
            phone_code: CountryPhoneCodeEnum.describe("Phone code must be from the provided list")
        }).refine((data) => {
            // Verify that the country name and phone code match
            const countryCode = countryCodes.find(c => c.country === data.name);
            return countryCode?.code === data.phone_code;
        }, {
            message: "Country name and phone code do not match"
        })
    }),

    languages: z.array(
        z.nativeEnum(Language, {
            invalid_type_error: "Invalid language selection"
        })
    ).min(1, "At least one language is required"),

    religion: z.nativeEnum(Religion, {
        required_error: "Religion is required",
        invalid_type_error: "Invalid religion selection"
    }),

    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password must not exceed 100 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character")
        .transform((val) => val.trim()),

    // Optional: Add confirm password field if needed
    confirmPassword: z.string(),
})
    .refine(
        function (data) {
            const age = data.age;
            if (data.gender === Gender.MALE) {
                return age >= 21 && age <= 70;
            } else if (data.gender === Gender.FEMALE) {
                return age >= 18 && age <= 70;
            }
        },
        {
            message: "Invalid age for the selected gender. Male must be 21-70 years old, and female must be 18-70 years old.",
            path: ["age"],
        }
    )
    .refine(
        function (data) {
            return data.age == calculateAge(data.dateOfBirth);
        },
        {
            message: "Invalid age for the selected gender. Male must be 21-70 years old, and female must be 18-70 years old.",
            path: ["dateOfBirth"],
        }
    )
    .refine(
        (data) => data.password === data.confirmPassword,
        {
            message: "Passwords don't match",
            path: ["confirmPassword"],
        }
    );
// You might want to create a type from the schema
export type RegistrationUserInput = z.infer<typeof registrationUserSchema>;



export enum LoginEnum {
    withPhone = "with_phone",
    withEmail = "with_email"
}

// Base schema for common fields
export const LoginSchema = z.object({
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password must not exceed 100 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character")
        .transform((val) => val.trim()),
    email: z.string({
        required_error: "Email is required",
        invalid_type_error: "Email must be a string"
    })
        .email("Invalid email format")
        .toLowerCase()
        .trim()
        .optional(),
    phoneInfo: z.object({
        number: z.string({
            required_error: "Phone number is required",
            invalid_type_error: "Phone number must be a string"
        })
            .regex(/^\d{10,15}$/, "Phone number must be between 10 and 15 digits"),
        phone_code: CountryPhoneCodeEnum.describe("Phone code must be from the provided list")
    }).optional(),

    loginType: z.nativeEnum(LoginEnum)
})
    .refine(
        (data) => !!data.email || (!!data.phoneInfo?.number || !!data?.phoneInfo?.phone_code),
        {
            message: 'Either email or phone information (number and phone code) must be provided.',
            path: ['phoneInfo', 'email']
        }
    )
    .refine(
        (data) => {
            if (data.loginType === LoginEnum.withEmail) {
                return !!data.email;
            } 
            return true;
        },
        {
            message: 'Email must be provided when login type is "with_email".',
            path: ['loginType', 'email']
        }
    )
    .refine(
        (data) => {
            if (data.loginType === LoginEnum.withPhone) {
                return !!data.phoneInfo?.number || !!data?.phoneInfo?.phone_code;
            } 
            return true;
        },
        {
            message: 'Phone number and phone code must be provided when login type is "with_phone".',
            path: ['loginType', 'phoneInfo']
        }
    );

export const zodOTP = z.string({
    required_error: "OTP is required",
    invalid_type_error: "OTP must be a string"
})
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^[0-9]{6}$/, "OTP must contain only numbers")
    .transform(val => val.trim())