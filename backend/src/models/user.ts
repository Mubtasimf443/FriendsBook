/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import mongoose, { Schema } from 'mongoose';
import { IUser, ProfileCreatedBy, Gender, Height, Religion, Language, EducationLevel, SettingsType } from '../lib/types/user.types';
import { countryCodes } from '../lib/data/countryCodes';

const userSchema = new Schema<IUser>({
    profileCreatedBy: {
        type: String,
        enum: Object.values(ProfileCreatedBy),
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,

    },
    profileImage: {
        url: {
            type: String,
            required: function () { return !!this.profileImage?.id }
        },
        id: {
            type: String,
            required: function () { return !!this.profileImage?.url }
        }
    },
    userImages: [{
        url: {
            type: String,
            required: false
        },
        id: {
            type: String,
            required: false
        }
    }],
    gender: {
        type: String,
        enum: Object.values(Gender),
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    height: {
        type: String,
        enum: Object.values(Height),
        required: true,

    },
    age: {
        type: Number,
        required: true,
        min: 18,
        max: 70
    },
    weight: {
        type: Number,
        required: true,
        min: 30,
        max: 200
    },
    isEducated: {
        type: Boolean,
        default: true,
        required: true
    },
    education: [{
        level: {
            type: String,
            required: function () { return this.isEducated; },
            enum: Object.values(EducationLevel)
        },
        certificate: {
            type: String,
            required: function () { return this.isEducated; }
        },
        institution: {
            type: String,
            required: function () { return this.isEducated; }
        },
        yearOfCompletion: {
            type: Number,
            required: function () { return this.isEducated; }
        },
        grade: {
            type: String,
            required: false
        },
        additionalInfo: {
            type: String,
            required: false
        }
    }],
    country: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 100
    },

    address: {
        type: String,
        required: true,
        minlength: 30,
        maxlength: 120,
    },

    phoneInfo: {
        number: {
            type: String,
            required: true
        },
        country: {
            name: {
                type: String,
                enum: countryCodes.map(element => element.country),
                required: true
            },
            phone_code: {
                type: String,
                required: true,
                enum: countryCodes.map(element => element.code),
                maxlength: 5
            }
        }
    },
    languages: [{
        type: String,
        enum: Object.values(Language),
        required: true
    }],
    religion: {
        type: String,
        enum: Object.values(Religion),
        required: true
    },
    preferences: {
        isEducated: {
            type: Boolean
        },
        education: [{
            type: {
                level: {
                    type: String,
                    enum: Object.values(EducationLevel)
                }
            }
        }],
        location: [{
            type: String
        }],
        weight: {
            minWeight: {
                type: Number,
                min: 30,
                max: 200
            },
            maxWeight: {
                type: Number,
                min: 30,
                max: 200
            }
        },
        height: {
            minHeight: {
                type: Number, // Height in foots 
                min: 3,
                max: 9
            },
            maxHeight: {
                type: Number, // Height in foots 
                min: 3,
                max: 9
            }
        },
        age: {
            minAge: {
                type: Number
            },
            maxAge: {
                type: Number
            }
        }
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    settings: {
        notifications: {
            dailyRecommendations: {
                type: String,
                required: true,
                enum: Object.values(SettingsType),
                default: Object.values(SettingsType)[0]
            },
            todaysMatch: {
                type: String,
                required: true,
                enum: Object.values(SettingsType),
                default: Object.values(SettingsType)[0]
            },
            viewedMyProfile: {
                type: String,
                required: true,
                enum: Object.values(SettingsType),
                default: Object.values(SettingsType)[0]
            },
        },
        privacy: {
            sendNotificationOnProfileView: {
                type: String,
                required: true,
                enum: Object.values(SettingsType),
                default: Object.values(SettingsType)[0]
            }
        }
    },
    isSuspended: {
        type: Boolean,
        required: true,
        default: false
    },
    password: {
        hashed: {
            type: String,
            required: true
        },
        salt: {
            type: String,
            required: true
        },
    }
});

userSchema.methods.createPreference = function() {
    // Age preferences based on gender and cultural norms
    const agePreferences = (() => {
        const minAllowedAge = 18;
        const maxAllowedAge = 70;
        
        if (this.gender === Gender.MALE) {
            return {
                minAge: Math.max(Math.floor(this.age - 10), minAllowedAge), // More flexible range
                maxAge: Math.max(this.age - 1, minAllowedAge)
            };
        } else if (this.gender === Gender.FEMALE) {
            return {
                minAge: Math.max(this.age, minAllowedAge),
                maxAge: Math.min(this.age + 10, maxAllowedAge) // More flexible range
            };
        }
        return { minAge: 21, maxAge: 30 }; // Default values
    })();

    // Height preferences based on cultural norms
    const heightPreferences = (() => {
        const userHeightInFeet = parseFloat(this.height);
        const minAcceptableHeight = 4.5; // Minimum acceptable height
        const maxAcceptableHeight = 7.0; // Maximum acceptable height

        if (this.gender === Gender.MALE) {
            return {
                minHeight: Math.max(userHeightInFeet - 0.5, minAcceptableHeight),
                maxHeight: userHeightInFeet - 0.1 // Slightly less than user's height
            };
        } else if (this.gender === Gender.FEMALE) {
            return {
                minHeight: userHeightInFeet + 0.1, // Slightly more than user's height
                maxHeight: Math.min(userHeightInFeet + 0.7, maxAcceptableHeight)
            };
        }
        return { minHeight: 5, maxHeight: 6 }; // Default values
    })();

    // Weight preferences with cultural considerations
    const weightPreferences = (() => {
        const userWeight = this.weight;
        const minHealthyWeight = 40; // Minimum healthy weight
        const maxHealthyWeight = 120; // Maximum considered weight

        if (this.gender === Gender.MALE) {
            return {
                minWeight: Math.max(minHealthyWeight, userWeight - 25),
                maxWeight: Math.min(userWeight - 2, maxHealthyWeight) // Ensuring partner is lighter
            };
        } else {
            return {
                minWeight: Math.max(minHealthyWeight, userWeight + 2), // Ensuring partner is heavier
                maxWeight: Math.min(userWeight + 30, maxHealthyWeight)
            };
        }
    })();

    // Enhanced education preferences
    const educationPreferences = (() => {
        if (!this.isEducated) return [];
        
        const userHighestEducation = this.education.reduce((highest:any, current:any) => {
            const currentLevel = Object.values(EducationLevel).indexOf(current.level);
            const highestLevel = highest ? Object.values(EducationLevel).indexOf(highest.level) : -1;
            return currentLevel > highestLevel ? current : highest;
        }, null);

        if (!userHighestEducation) return [];

        // For females, accept same or higher education
        // For males, accept same or lower education
        const educationLevels = Object.values(EducationLevel);
        const userLevelIndex = educationLevels.indexOf(userHighestEducation.level);

        if (this.gender === Gender.FEMALE) {
            return educationLevels
                .slice(userLevelIndex)
                .map(level => ({ level }));
        } else {
            return educationLevels
                .slice(0, userLevelIndex + 1)
                .map(level => ({ level }));
        }
    })();

    // Location preferences with district/division consideration
    const locationPreferences = (() => {
        const baseLocations = [this.country];
        if (this.district) {
            baseLocations.push(this.district);
        }
        if (this.division) {
            baseLocations.push(this.division);
        }
        return baseLocations;
    })();

    // Update preferences with all calculated values
    this.preferences = {
        ...this.preferences,
        isEducated: this.isEducated,
        education: educationPreferences,
        location: locationPreferences,
        age: agePreferences,
        height: heightPreferences,
        weight: weightPreferences,
        lastUpdated: new Date() // Adding timestamp for preference updates
    };

    return this;
};



userSchema.index({ gender: 1, country: 1 });
userSchema.index({ age: 1 });
userSchema.index({ 'education.level': 1 });
userSchema.index({ dateOfBirth: 1 });


export const User = mongoose.model<IUser>('User', userSchema);

