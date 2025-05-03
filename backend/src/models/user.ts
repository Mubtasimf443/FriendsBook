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
        trim: true ,
        
    },
    profileImage : {
        url : {
            type :String ,
            required : function () { return !!this.profileImage?.id }  
        },
        id : {
            type :String ,
            required: function () { return !!this.profileImage?.url } 
        }
    },
    userImages :[{
        url : {
            type :String ,
            required : false
        },
        id : {
            type :String ,
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
        required: true
    },
    age: {
        type: Number,
        required: true,
        min : 18, 
        max : 70
    },
    weight: {
        type: Number,
        required: true,
        min : 30 ,
        max : 200
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
        minlength : 2,
        maxlength : 100
    },
    address:{
        type : String ,
        required : true,
        minlength : 30 ,
        maxlength : 120 ,
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
        education: [{
            type: String
        }],
        location: [{
            type: String
        }],
        weight: {
            min: Number,
            max: Number
        }
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    settings :{
        notifications :{
            dailyRecommendations : {
                type : String ,
                required : true,
                enum : Object.values(SettingsType),
                default : Object.values(SettingsType)[0]
            },
            todaysMatch : {
                type : String ,
                required : true,
                enum : Object.values(SettingsType),
                default : Object.values(SettingsType)[0]
            },
            viewedMyProfile : {
                type : String ,
                required : true,
                enum : Object.values(SettingsType),
                default : Object.values(SettingsType)[0]
            },
        },
        privacy :{
            sendNotificationOnProfileView : {
                type : String ,
                required : true,
                enum : Object.values(SettingsType),
                default : Object.values(SettingsType)[0]
            }
        }
    },
    isSuspended : {
        type : Boolean,
        required : true ,
        default : false
    },
    password : {
        hashed :{
            type : String ,
            required : true
        },
        salt : {
            type : String ,
            required : true
        },
    }
});

userSchema.index({ gender: 1, country: 1 });
userSchema.index({ age: 1 });
userSchema.index({ 'education.level': 1 });
userSchema.index({ dateOfBirth: 1 }); 


export const User = mongoose.model<IUser>('User', userSchema);