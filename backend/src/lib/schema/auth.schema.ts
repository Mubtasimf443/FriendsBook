/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { z } from "zod";
import { ProfileCreatedBy, Gender, Height, Religion, Language, EducationLevel, SettingsType, IAddress } from "../types/user.types";
import { countryCodes } from "../data/countryCodes";
import { _idValidator, emailValidatior, passwordValidator } from "./schemaComponents";
import { CountryNamesEnum as CountryNamesEnumForAdressField} from "../types/country_names.enum";
import { Divisions } from "../data/divisions";
import { Districts } from "../data/districts";
import { Upazilas } from "../data/upazilas";
import { Unions } from "../data/unions";
import { setHeapSnapshotNearHeapLimit } from "v8";
import { countryNames as CountryNamesForCountryField} from '../data/countries'
import { log } from "console";


const calculateAge = (dateOfBirth: Date): number => {
    const diff = new Date().getTime() - dateOfBirth.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)); // Convert milliseconds to years
};

const countryNames = countryCodes.map(c => c.country);
const phoneCountryCodes = countryCodes.map(c => c.code);
const CountryNameEnum = z.enum([countryNames[0], ...countryNames]);
const CountryPhoneCodeEnum = z.enum([phoneCountryCodes[0], ...phoneCountryCodes]);


const AddressSchema = z.object({
    country: z.enum(
        [
            CountryNamesForCountryField[0],
            ...CountryNamesForCountryField.map((el, i) => i !== 0 && el) as readonly string[]
        ],
        {
            invalid_type_error: 'country value is not in the allowed Country List',
            required_error: "address.country field is required",
        }
    ),

    // Optional state field for non-Bangladesh addresses
    state: z.object({
        name: z.string().optional(),
        // Add any other IState properties here
    }).optional(),

    // Optional division field for Bangladesh addresses
    division: z.optional(
        z.object({
            id: z.number({
                required_error: "Division ID is required",
                invalid_type_error: "Division ID must be a number"
            })
            .gte(1, "Division ID must be between 1 and 8")
            .lte(8, "Division ID must be between 1 and 8")
            .transform(data => data.toString()),
            name: z.string().optional(),
            bd_name: z.string().optional(),
        })),

    // Optional district field for Bangladesh addresses
    district: z.optional(
        z.object({
            id: z.number({
                required_error: "District ID is required",
                invalid_type_error: "District ID must be a number"
            })
            .gte(1, "District ID must be between 1 and 64")
            .lte(64, "District ID must be between 1 and 64")
            .transform(data => data.toString()),
            division_id: z.string().optional(),
            name: z.string().optional(),
            bn_name: z.string().optional(),
        })),

    // Optional upazila field for Bangladesh addresses
    upazila: z.optional(
        z.object({
            id: z.number({
                required_error: "Upazila ID is required",
                invalid_type_error: "Upazila ID must be a number"
            })
            .gte(1, "Upazila ID must be between 1 and 494")
            .lte(494, "Upazila ID must be between 1 and 494")
            .transform(data => data.toString()),
            district_id: z.string().optional(),
            name: z.string().optional(),
            bn_name: z.string().optional(),
        })
    ),

    // Optional union/city field for Bangladesh addresses
    union: z.optional(
        z.object({
            id: z.number({
                required_error: "Union ID is required",
                invalid_type_error: "Union ID must be a number"
            })
            .gte(1, "Union ID must be between 1 and 4540")
            .lte(4540, "Union ID must be between 1 and 4540")
            .transform(data => data.toString()),
            upazilla_id: z.string().optional(),
            name: z.string().optional(),
            bn_name: z.string().optional(),
        })
    )
})
    .refine(
        (data) => {
            if (data.country === CountryNamesEnumForAdressField.BANGLADESH) {
                return !!data.division?.id && !!data.district?.id && !!data.upazila?.id && !!data.union?.id;
            }
            return true;
        },
        {
            message: "address.division.id, address.district.id, address.upazila.id, address.union.id are required for Bangladesh addresses"
        }
    )
    .refine(
        function (data) {
            if (data.country !== CountryNamesEnumForAdressField.BANGLADESH) {
                // For Bangladesh, require division and district
                return !!data.state;
            }
            return true;
        },
        {
            message: "State is required for non-Bangladesh addresses",
        }
    )
    .transform(
        function (data) {
            if (data.country === CountryNamesEnumForAdressField.BANGLADESH) {
                data.division = Divisions.find(element => element.id == data.division?.id);
                data.district = Districts.find(element => element.id == data.district?.id);
                data.upazila = Upazilas.find(element => element.id == data.upazila?.id);
                data.union = Unions.find(element => element.id == data.union?.id);
            } else {
                (data.division) && (delete data.division);
                (data.district) && (delete data.district);
                (data.upazila) && (delete data.upazila);
                (data.union) && (delete data.union);
            }
            return data;
        },
       
    );


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

    email: emailValidatior,

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
    )
        .optional()
        .default([]),

    

    address: AddressSchema ,

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

    password: passwordValidator,


    confirmPassword: z.string().trim(),
})
    // Age Checking By Gender
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
    // Age Checking By dateOfBirth
    .refine(
        function (data) {
            return data.age == calculateAge(data.dateOfBirth);
        },
        {
            message: "Invalid age for the selected gender. Male must be 21-70 years old, and female must be 18-70 years old.",
            path: ["dateOfBirth"],
        }
    )
    // password Checking By confirmPassword
    .refine(
        (data) => data.password === data.confirmPassword,
        {
            message: "Passwords don't match",
            path: ["confirmPassword"],
        }
    )
    // Division Id Check Districts
    .refine(
        function (data) {
            if (data.address.country === CountryNamesEnumForAdressField.BANGLADESH) {
                return data.address.district?.division_id === data.address.division?.id;
            }
            return true;
        },
        {
            message: "Selected district does not belong to the selected division",
            path: ["address.district.division_id"]
        }
    )
    // Districts Id Check Upazillas
    .refine(
        function (data) {
            if (data.address.country === CountryNamesEnumForAdressField.BANGLADESH) {
                return data.address.upazila?.district_id === data.address.district?.id;
            }
            return true;
        },
        {
            message: "Selected upazila does not belong to the selected district",
            path: ["address.upazila.district_id"]
        }
    )
    // Upazilla Id Check Unions
    .refine(
        function (data) {
            if (data.address.country === CountryNamesEnumForAdressField.BANGLADESH) {
                return data.address.union?.upazilla_id === data.address.upazila?.id
            }
            return true;
        },
        {
            message: "Selected union does not belong to the selected upazila",
            path: ["address.union.upazilla_id"]
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
    password: passwordValidator,
    email: emailValidatior,
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

export const zodOTPValidation = z.string({
    required_error: "OTP is required",
    invalid_type_error: "OTP must be a string"
})
    .trim()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^[0-9]{6}$/, "OTP must contain only numbers")
    .transform((val) => parseInt(val, 10)); // Convert to number after validation

// Session key validation
export const tempSessionValidation = z.string({
    required_error: "Session key is required",
    invalid_type_error: "Session key must be a string"
})
    .trim()
    .min(64, "Invalid session key length")
    .max(64, "Invalid session key length")
    .regex(/^[0-9a-fA-F]{64}$/, "Session key must be a valid hex string")


// Session key validation
export const authSessionValidation = z.string({
    required_error: "Auth Token is required",
    invalid_type_error: "Auth Token must be a string"
})
    .trim()
    .min(64, "Invalid session key length")
    .max(64, "Invalid session key length")
    .regex(/^[0-9a-fA-F]{64}$/, "Session key must be a valid hex string")


export const VerifyOtpSchema = z.object({
    sessionKey: tempSessionValidation,
    otp: zodOTPValidation
});




export const ResetPasswordSchema = z.object({

    // User ID validation using MongoDB ObjectId
    userId: z.optional(_idValidator),

    // New password validation with strong password requirements
    password: passwordValidator,

    // Confirm password validation
    confirmPassword: passwordValidator,

    // new Password
    newPassword: passwordValidator,

})
    .refine(
        (data) => data.password === data.confirmPassword,
        {
            message: "Passwords do not match",
            path: ["confirmPassword"] // Path helps client identify which field caused the error
        }
    );

export const VerifyForgotPasswordOtpSchema = z.object({
    sessionKey: tempSessionValidation,
    otp: zodOTPValidation,
    newPassword: passwordValidator,
    confirmPassword: passwordValidator
})
    .refine(
        (data) => data.newPassword === data.confirmPassword,
        {
            message: "Passwords don't match",
            path: ["confirmPassword"]
        }
    );