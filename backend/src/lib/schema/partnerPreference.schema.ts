import { z } from 'zod';
import {
    ComplexionPreference,
    EmploymentSector,
    FamilyValues,
    PreferredLocation
} from '../types/partnerPreference';
import { Height, MaritalStatus, Occupation, Religion, Language } from '../types/user.types';
import { EducationLevel } from '../types/userEducation.types';
import { PhysicalStatus, ReligiousBranch, BadHabits } from '../types/userProfile.types';
import { CurrencyCode } from '../types/currencyCodes.enum';
import { CountryNamesEnum } from '../types/country_names.enum';

export const partnerPreferenceSchema = z.object({
    ageRange: z.object({
        min: z.number().min(18).max(70),
        max: z.number().min(18).max(70)
    }).refine(data => data.min <= data.max, {
        message: "Minimum age must be less than or equal to maximum age"
    }),

    heightRange: z.object({
        min: z.nativeEnum(Height),
        max: z.nativeEnum(Height)
    }).refine(data => {
        const minHeight = parseInt(data.min.split(' ')[0]);
        const maxHeight = parseInt(data.max.split(' ')[0]);
        return minHeight <= maxHeight;
    }, {
        message: "Minimum height must be less than or equal to maximum height"
    }),

    weightRange: z.object({
        min: z.number().min(30).max(200),
        max: z.number().min(30).max(200)
    }).refine(data => data.min <= data.max, {
        message: "Minimum weight must be less than or equal to maximum weight"
    }),

    maritalStatus: z.array(z.nativeEnum(MaritalStatus)).min(1),
    complexion: z.array(z.nativeEnum(ComplexionPreference)).optional(),
    physicalStatus: z.array(z.nativeEnum(PhysicalStatus)).min(1),
    religiousBranch: z.array(z.nativeEnum(ReligiousBranch)).optional(),
    dealBreakers: z.array(z.nativeEnum(BadHabits)).optional(),

    locationPreference: z.object({
        preferredCountries: z.array(z.nativeEnum(CountryNamesEnum)).min(1),
        preferredRegions: z.array(z.string()).optional(),
        preferredCities: z.array(z.string()).optional(),
        locationType: z.nativeEnum(PreferredLocation),
        willingToRelocate: z.boolean().optional()
    }),

    education: z.object({
        minimumLevel: z.nativeEnum(EducationLevel),
        preferredLevels: z.array(z.nativeEnum(EducationLevel)).optional(),
        mustBeEducated: z.boolean(),
        preferredInstitutions: z.array(z.string()).optional()
    }),

    profession: z.object({
        acceptedOccupations: z.array(z.nativeEnum(Occupation)).optional(),
        preferredSectors: z.array(z.nativeEnum(EmploymentSector)).optional(),
        minimumAnnualIncome: z.object({
            min: z.number(),
            max: z.number(),
            currency: z.nativeEnum(CurrencyCode)
        }).optional()
    }),

    religion: z.array(z.nativeEnum(Religion)).min(1),
    motherTongue: z.array(z.nativeEnum(Language)).optional(),
    familyValues: z.array(z.nativeEnum(FamilyValues)).optional(),

    familyBackground: z.object({
        maxSiblings: z.number().optional(),
        preferredFamilyType: z.array(z.string()).optional(),
        preferredFamilyStatus: z.array(z.string()).optional()
    }).optional(),

    strictPreferences: z.boolean().optional(),
    priority: z.object({
        education: z.number().min(1).max(5),
        profession: z.number().min(1).max(5),
        location: z.number().min(1).max(5),
        religion: z.number().min(1).max(5),
        age: z.number().min(1).max(5)
    })
});

export type PartnerPreferenceInput = z.infer<typeof partnerPreferenceSchema>;