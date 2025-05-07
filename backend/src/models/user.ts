/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import mongoose, { Schema } from 'mongoose';
import { IUser, ProfileCreatedBy, Gender, Height, Religion, Language, EducationLevel, SettingsType, MaritalStatus, Occupation } from '../lib/types/user.types';
import { countryCodes } from '../lib/data/countryCodes';
import countryNames from '../lib/data/countryNames';
import generateMatrimonyId from '../lib/core/mid-geneator';
import { CurrencyCode } from '../lib/types/currencyCodes.enum';
import { 
    PhysicalStatus, 
    ReligiousBranch, 
    BadHabits, 
    Sports, 
    Hobbies, 
    MusicTypes, 
    FoodTypes,
    SettingsPermissionType 
} from '../lib/types/userProfile.types';


const aboutMeSchema = new Schema({
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    physicalStatus: {
        type: String,
        enum: Object.values(PhysicalStatus),
        default: PhysicalStatus.NORMAL
    },
    religiousBranch: {
        type: String,
        enum: Object.values(ReligiousBranch)
    },
    badHabits: [{
        type: String,
        enum: Object.values(BadHabits),
        default: [BadHabits.NONE]
    }],
    interestedSports: [{
        type: String,
        enum: Object.values(Sports)
    }],
    interestedHobbies: [{
        type: String,
        enum: Object.values(Hobbies)
    }],
    interestedFoodTypes: [{
        type: String,
        enum: Object.values(FoodTypes)
    }],
    interestedMusicTypes: [{
        type: String,
        enum: Object.values(MusicTypes)
    }]
});

const familyInfoSchema = new Schema({
    aboutFamily: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    familyOrigin: {
        type: String,
        trim: true
    },
    numberOfBrothers: {
        type: Number,
        min: 0,
        default: 0
    },
    numberOfSisters: {
        type: Number,
        min: 0,
        default: 0
    },
    numberOfMarriedBrothers: {
        type: Number,
        min: 0,
        default: 0,
        validate: {
            validator: function(this: any, val: number) {
                return val <= this.numberOfBrothers;
            },
            message: 'Number of married brothers cannot exceed total brothers'
        }
    },
    numberOfMarriedSisters: {
        type: Number,
        min: 0,
        default: 0,
        validate: {
            validator: function(this: any, val: number) {
                return val <= this.numberOfSisters;
            },
            message: 'Number of married sisters cannot exceed total sisters'
        }
    }
});

const blockedProfileSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    blockedAt: {
        type: Date,
        default: Date.now
    },
    reason: String
});


const userSchema = new Schema<IUser>({
    mid : {
        type: String,
        required: true,
        unique: true,
        immutable: true, // Cannot be changed once set
        index: true,
    },
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
    
    address: {
        type: {
            country: {
                type: String,
                required: true,
                minlength: 2,
                maxlength: 100,
                default : "Bangladesh",
                enum : countryNames
            },
            state: {
                name: {
                    type: String,
                    trim: true
                },
                id : {
                    type : String
                },
                country_name : {
                    type : String
                }
            },
            division: {
                id: {
                    type: String,
                    required: function (this: any) {
                        return this.country === "Bangladesh";
                    }
                },
                name: {
                    type: String,
                    required: function (this: any) {
                        return this.country === "Bangladesh";
                    }
                },
                bd_name: {
                    type: String,
                    required: function (this: any) {
                        return this.country === "Bangladesh";
                    }
                }
            },
            district: {
                id: {
                    type: String,
                    required: function (this: any) {
                        return this.country === "Bangladesh";
                    }
                },
                division_id: {
                    type: String,
                    required: function (this: any) {
                        return this.country === "Bangladesh";
                    },
                    
                },
                name: {
                    type: String,
                    required: function (this: any) {
                        return this.country === "Bangladesh";
                    }
                },
                bn_name: {
                    type: String,
                    required: function (this: any) {
                        return this.country === "Bangladesh";
                    }
                },
                lat: Number,
                long: Number
            },
            upazila: {
                id: {
                    type: String,
                    required: function (this: any) {
                        return this.country === "Bangladesh";
                    }
                },
                district_id: {
                    type: String,
                    required: function (this: any) {
                        return this.country === "Bangladesh";
                    },
                
                },
                name: {
                    type: String,
                    required: function (this: any) {
                        return this.country === "Bangladesh";
                    }
                },
                bn_name: {
                    type: String,
                 
                }
            },
            union: {
                id: {
                    type: String,
                    required: function (this: any) {
                        return this.country === "Bangladesh";
                    }
                },
                upazilla_id: {
                    type: String,
                    required: function (this: any) {
                        return this.country === "Bangladesh";
                    },
               
                },
                name: {
                    type: String,
                    required: function (this: any) {
                        return this.country === "Bangladesh";
                    }
                },
                bn_name: {
                    type: String,
                    required: function (this: any) {
                        return this.country === "Bangladesh";
                    }
                }
            }
        },
        required: true
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

    maritalStatus: {
        type: String,
        enum: Object.values(MaritalStatus),
        required: false
    },

    occupation: {
        type: String,
        enum: Object.values(Occupation),
        required: false
    },

    annualIncome: {
        
        amount: {
            type: Number,
            required: false,
            min: 0,
            max: 1000000000, // 1 billion - adjust as needed
            validate: {
                validator: Number.isInteger,
                message: 'Annual income must be a whole number'
            }
        },
        currency: {
            type: String,
            required(this) {
                return !!this.annualIncome?.currency
            },
            uppercase: true,
            enum: Object.values(CurrencyCode),
            minlength: 3,
            maxlength: 3,
            default: 'BDT'
        }
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
        },
        lastUpdated : Date,
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
    },
    onlineStatus: {
        isOnline: {
            type: Boolean,
            default: false,
            required: true
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
        lastActive: {
            type: Date,
            default: Date.now,
        }
    },
    aboutMe: aboutMeSchema,
    familyInfo: familyInfoSchema,
    coverImage: {
        url: String,
        id: String
    },
    enhancedSettings: {
        blocked: [blockedProfileSchema],
        privacy: {
            whoCanViewProfile: {
                type: String,
                enum: Object.values(SettingsPermissionType),
                default: SettingsPermissionType.EVERYONE
            },
            whoCanContactMe: {
                type: String,
                enum: Object.values(SettingsPermissionType),
                default: SettingsPermissionType.EVERYONE
            },
            showShortlistedNotification: {
                type: Boolean,
                default: true
            },
            showProfileViewNotification: {
                type: Boolean,
                default: true
            }
        },
        notifications: {
            dailyRecommendations: {
                type: Boolean,
                default: true
            },
            todaysMatch: {
                type: Boolean,
                default: true
            },
            profileViews: {
                type: Boolean,
                default: true
            },
            shortlists: {
                type: Boolean,
                default: true
            },
            messages: {
                type: Boolean,
                default: true
            },
            connectionRequests: {
                type: Boolean,
                default: true
            }
        }
    }
});

userSchema.methods.createPreference = function() {
    // Age preferences based on gender and cultural norms
    const agePreferences = (() => {
        // Age constraints for men
        const MIN_ALLOWED_AGE_MEN: number = 21;
        const MAX_ALLOWED_AGE_MEN: number = 70;

        // Age constraints for women
        const MIN_ALLOWED_AGE_WOMEN: number = 18;
        const MAX_ALLOWED_AGE_WOMEN: number = 70;
        if (this.gender === Gender.MALE) {
            return {
                minAge: Math.max(Math.floor(this.age - 10), MIN_ALLOWED_AGE_WOMEN), // More flexible range
                maxAge: Math.max(this.age - 1, MIN_ALLOWED_AGE_WOMEN)
            };
        } else if (this.gender === Gender.FEMALE) {
            return {
                minAge: Math.max(this.age, MIN_ALLOWED_AGE_MEN ),
                maxAge: Math.min(this.age + 10, MAX_ALLOWED_AGE_MEN - this.age) // More flexible range
            };
        }
        else return { minAge: 21, maxAge: 30 }; // Default values
    })();

    // Height preferences based on cultural norms
    const heightPreferences = (() => {
        const userHeightInFeet = parseFloat(this.height.at(0));
        const minAcceptableHeight = 4; // Minimum acceptable height
        const maxAcceptableHeight = 7; // Maximum acceptable height

        if (this.gender === Gender.MALE) {
            return {
                minHeight: Math.max(userHeightInFeet - 1, minAcceptableHeight),
                maxHeight: userHeightInFeet 
            };
        } else if (this.gender === Gender.FEMALE) {
            return {
                minHeight:userHeightInFeet, // Slightly more than user's height
                maxHeight: Math.min(userHeightInFeet + 1, maxAcceptableHeight)
            };
        }
     
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

  
    // Update preferences with all calculated values
    this.preferences = {
        ...this.preferences,
        isEducated: this.isEducated,
        education: educationPreferences,
        age: agePreferences,
        height: heightPreferences,
        weight: weightPreferences,
        lastUpdated: new Date() // Adding timestamp for preference updates
    };

    return this;
};
userSchema.methods.createMID = function() {
    return generateMatrimonyId(this.address.country);
};


userSchema.index({ gender: 1, country: 1 });
userSchema.index({ age: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'education.level': 1 });
userSchema.index({ dateOfBirth: 1 });
userSchema.index({ 'address.country': 1, 'address.district.id': 1, 'isSuspended': 1 });
userSchema.index({ 'onlineStatus.lastActive': -1});
userSchema.index({ maritalStatus: 1 });
userSchema.index({ occupation: 1 });
userSchema.index({ 'annualIncome.amount': 1, 'annualIncome.currency': 1 });


export const User = mongoose.model<IUser>('User', userSchema);

