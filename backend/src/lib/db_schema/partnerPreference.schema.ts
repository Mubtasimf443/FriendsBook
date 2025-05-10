/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Schema } from 'mongoose';

import { Height, MaritalStatus, Occupation, Religion, Language } from '../types/user.types';
import { EducationLevel } from '../types/userEducation.types';
import { PhysicalStatus, ReligiousBranch, BadHabits } from '../types/userProfile.types';
import { CurrencyCode } from '../types/currencyCodes.enum';
import { CountryNamesEnum } from '../types/country_names.enum';
import {
    IPartnerPreference,
    ComplexionPreference,
    EmploymentSector,
    FamilyValues,
    PreferredLocation
} from '../types/partnerPreference';

export const partnerPreferenceSchema = new Schema<IPartnerPreference>({
    ageRange: {
        min: { type: Number, required: false, min: 18, max: 70 },
        max: { type: Number, required: false, min: 18, max: 70 }
    },
    heightRange:{
        min: { type: Number, required: false, min: 4, max: 8 },
        max: { type: Number, required: false, min: 5, max: 9 }
    },
    weightRange: {
        min: { type: Number, required: false, min: 30, max: 200 },
        max: { type: Number, required: false, min: 30, max: 200 }
    },
    maritalStatus: [{
        type: String,
        enum: Object.values(MaritalStatus),
        required: false
    }],
    complexion: [{
        type: String,
        enum: Object.values(ComplexionPreference)
    }],
    physicalStatus: [{
        type: String,
        enum: Object.values(PhysicalStatus),
        required: false
    }],
    religiousBranch: [{
        type: String,
        enum: Object.values(ReligiousBranch)
    }],
    dealBreakers: [{
        type: String,
        enum: Object.values(BadHabits)
    }],
    locationPreference: {
        preferredCountries: [{
            type: String,
            enum: Object.values(CountryNamesEnum),
            required: false
        }],
        preferredRegions: [String],
        preferredCities: [String],
        locationType: {
            type: String,
            enum: Object.values(PreferredLocation),
            required: false
        },
        willingToRelocate: Boolean
    },
    education: {
        minimumLevel: {
            type: String,
            enum: Object.values(EducationLevel),
            required: false
        },
        preferredLevels: [{
            type: String,
            enum: Object.values(EducationLevel)
        }],
        mustBeEducated: {
            type: Boolean,
            required: false,
            default: true
        },
        preferredInstitutions: [String]
    },
    profession: {
        acceptedOccupations: [{
            type: String,
            enum: Object.values(Occupation)
        }],
        preferredSectors: [{
            type: String,
            enum: Object.values(EmploymentSector)
        }],
        minimumAnnualIncome: {
            min: Number,
            max: Number,
            currency: {
                type: String,
                enum: Object.values(CurrencyCode)
            }
        }
    },
    religion: [{
        type: String,
        enum: Object.values(Religion),
        required: false
    }],
    motherTongue: [{
        type: String,
        enum: Object.values(Language)
    }],
    familyValues: [{
        type: String,
        enum: Object.values(FamilyValues)
    }],
    familyBackground: {
        maxSiblings: Number,
        preferredFamilyType: [String],
        preferredFamilyStatus: [String]
    },
    lastUpdated: {
        type: Date,
        required: false,
        default: Date.now
    },
    strictPreferences: {
        type: Boolean,
        default: false
    },
    priority: {
        education: {
            type: Number,
            min: 1,
            max: 5,
            default: 3
        },
        profession: {
            type: Number,
            min: 1,
            max: 5,
            default: 3
        },
        location: {
            type: Number,
            min: 1,
            max: 5,
            default: 3
        },
        religion: {
            type: Number,
            min: 1,
            max: 5,
            default: 5
        },
        age: {
            type: Number,
            min: 1,
            max: 5,
            default: 3
        }
    }
});

// Add validation for age range
partnerPreferenceSchema.pre('save', function (next) {
    if (this.ageRange.min > this.ageRange.max) {
        next(new Error('Minimum age cannot be greater than maximum age'));
    }
    if (this.heightRange.min > this.heightRange.max) {
        next(new Error('Minimum height cannot be greater than maximum height'));
    }
    next();
});

