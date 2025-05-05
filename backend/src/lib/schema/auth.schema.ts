/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { z } from "zod";
import { ProfileCreatedBy, Gender, Height, Religion, Language, EducationLevel, SettingsType } from "../types/user.types";
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

const divisionNames = Divisions.map(({ name }: { name: string }) => name) as readonly string[];
const districtNames = Districts.map(({ name }: { name: string }) => name) as readonly string[];
const upazilaNames = Upazilas.map(({ name }: { name: string }) => name) as readonly string[];
const unionNames = Unions.map(({ name }: { name: string }) => name) as readonly string[];


// const bangladeshAddressSchema = z.object({
//     division: z.enum([divisionNames[0], ...divisionNames.map((el, i) => i !== 0 && el) as readonly string[]], {
//         required_error: "Division is required",
//         invalid_type_error: "Invalid division selection"
//     })
//         .transform((name) => {
//             const division = Divisions.find(element => element.name === name);
//             if (!division) {
//                 throw new Error("Selected division not found in the system");
//             }
//             return division;
//         }),

//     district: z.enum([districtNames[0], ...districtNames.map((el, i) => i !== 0 && el) as readonly string[]], {
//         required_error: "District is required",
//         invalid_type_error: "Invalid district selection"
//     })
//         .transform((name) => {
//             const district = Districts.find(element => element.name === name);
//             if (!district) {
//                 throw new Error("Selected district not found in the system");
//             }
//             return district;
//         }),

//     upazila: z.enum([upazilaNames[0], ...upazilaNames.map((el, i) => i !== 0 && el) as readonly string[]], {
//         required_error: "Upazila is required",
//         invalid_type_error: "Invalid upazila selection"
//     })
//         .transform((name) => {
//             const upazila = Upazilas.find(element => element.name === name);
//             if (!upazila) {
//                 throw new Error("Selected upazila not found in the system");
//             }
//             return upazila;
//         }),

//     union: z.enum([unionNames[0], ...unionNames.map((el, i) => i !== 0 && el) as readonly string[]], {
//         required_error: "Union is required",
//         invalid_type_error: "Invalid union selection"
//     })
//         .transform((name) => {
//             const union = Unions.find(element => element.name === name);
//             if (!union) {
//                 throw new Error("Selected union not found in the system");
//             }
//             return union;
//         }),
// }
// )
//     .refine(
//         (data) => {
//             // Verify district belongs to selected division
//             return data.district.division_id === data.division.id;
//         },
//         {
//             message: "Selected district does not belong to the selected division",
//             path: ["district"]
//         }
//     )
//     .refine(
//         (data) => {
//             // Verify upazila belongs to selected district
//             return data.upazila.district_id === data.district.id;
//         },
//         {
//             message: "Selected upazila does not belong to the selected district",
//             path: ["upazila"]
//         }
//     )
//     .refine(
//         (data) => {
//             // Verify union belongs to selected upazila
//             return data.union.upazilla_id === data.upazila.id;
//         },
//         {
//             message: "Selected union does not belong to the selected upazila",
//             path: ["union"]
//         }
//     );
// // Address schema for other countries
// const otherCountryAddressSchema = z.object({
//     state: z.string().transform(name => ({ name })).optional()
// });


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

    

    address: z.object({
        country: z.enum([
            CountryNamesForCountryField[0],
            ...CountryNamesForCountryField.map((el, i) => i !== 0 && el) as readonly string[]
        ], {
            invalid_type_error: 'country value is not in the allowed Country List , Please check The api "/location/country-names" to get the allowed country names list',
            required_error: "address.country field is required",

        }),
        division_id: z.optional(z.number().gte(1).lte(8).transform(num => num.toString())),
        district_id: z.optional(z.number().gte(1).lte(64).transform(num => num.toString())),
        upazila_id: z.optional(z.number().gte(1).lte(494).transform(num => num.toString())),
        union_id: z.optional(z.number().gte(1).lte(4540).transform(num => num.toString())),
        state: z.optional(z.string().transform(name => ({ name }))),
        
    })
        .refine(
            function ({ country, district_id, division_id, union_id, upazila_id }) {
                if (country === CountryNamesEnumForAdressField.BANGLADESH) {
                    return (!!division_id && !!district_id && !upazila_id && !union_id)
                }
                return true;
            },
            {
                message: " district_id, division_id, union_id, upazila_id  is required if country is Bangladesh",
                path: ["data.address.division_id"],
            }
        )
        .transform(function (data) {
            if (data.country === CountryNamesEnumForAdressField.BANGLADESH) {
                data.division= Divisions.find((element) => element.id == data.division_id);
                data.district=Districts.find((element) => element.id == data.district_id);
                data.upazila= Upazilas.find((element) => element.id === data.upazila_id);
                data.union=Unions.find(element => element.name == data.union_id);
            }
            return data;
        }
        )
    ,

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
    
    .refine(
        function (data) {
            if (data.address.country === CountryNamesEnumForAdressField.BANGLADESH) {
                return data.address.district.division_id === data.address.division.id;
            }
            return true;
        },
        {
            message: "Selected district does not belong to the selected division",
            path: ["district"]
        }
    )
    .refine(
        function (data) {
            if (data.address.country === CountryNamesEnumForAdressField.BANGLADESH) {
                return data.address.upazila.district_id === data.address.district.id;
            }
            return true;
        },
        {
            message: "Selected upazila does not belong to the selected district",
            path: ["upazila"]
        }
    )
    .refine(
        function (data) {
            if (data.address.country === CountryNamesEnumForAdressField.BANGLADESH) {
                return data.address.union.upazilla_id === data.address.upazila.id
            }
            return true;
        },
        {
            message: "Selected union does not belong to the selected upazila",
            path: ["union"]
        }
    )
    .transform(function (data:any) {
        if (data.country === CountryNamesEnumForAdressField.BANGLADESH) {
            delete data.address.state;
        }
        else {
            data.address = { state :data.address.state }
        }
        return data;
    });

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