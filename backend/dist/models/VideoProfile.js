"use strict";
/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const videoProfileSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    profileImage: {
        type: {},
        required: false,
    },
    coverImage: {
        type: {},
        required: false,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: 'other'
    },
    dateOfBirth: {
        type: Date,
        required: true,
    },
    age: { type: Number, required: true },
    status: {
        type: String,
        enum: ['online', 'offline', 'busy'],
        default: 'online'
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    socketId: {
        type: String,
        default: null
    },
    passwordDetails: {
        type: {
            hashed: String,
            salt: String
        },
        required: true
    },
    languages: {
        type: [{
                type: String,
                required: true
            }],
    },
    auth: {
        authSession: {
            type: String,
        },
        session_exp_date: {
            type: Date,
            default: () => Date.now() + 30 * 24 * 3600 * 1000
        },
        lastLoggedIn: [{
                type: Date,
                default: Date.now
            }]
    },
    location: {
        country: {
            type: String,
        },
        lat: Number,
        long: Number
    },
    phone: {
        type: String,
        required: true,
        maxlength: 20,
        minlength: 8
    }
}, { timestamps: true });
videoProfileSchema.index({ "auth.isLoggedIn": 1 }, { unique: true });
videoProfileSchema.index({ "auth.authSession": 1 });
videoProfileSchema.index({ "location.country": 1 });
videoProfileSchema.index({ "location.lat": 1 });
videoProfileSchema.index({ "location.long": 1 });
videoProfileSchema.index({ "status": 1 });
videoProfileSchema.index({ "lastActive": 1 });
videoProfileSchema.index({ "email": 1 }, { unique: true });
videoProfileSchema.index({ "phone": 1 }, { unique: true });
const VideoProfile = (0, mongoose_1.model)('VideoProfile', videoProfileSchema);
exports.default = VideoProfile;
