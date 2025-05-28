"use strict";
/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ InshaAllah
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePasswords = comparePasswords;
exports.generateSalt = generateSalt;
exports.GenerateOtp = GenerateOtp;
exports.giveAuthSessionId = giveAuthSessionId;
exports.giveAuthSession = giveAuthSession;
exports.sendRegistrationOTP = sendRegistrationOTP;
exports.generateAuthToken = generateAuthToken;
exports.giveAuthSessionValue = giveAuthSessionValue;
exports.validatePhoneNumber = validatePhoneNumber;
const crypto_1 = __importDefault(require("crypto"));
const user_types_1 = require("../lib/types/user.types");
const mongoose_1 = __importDefault(require("mongoose"));
const countryCodes_1 = require("../lib/data/countryCodes");
function hashPassword(password, salt) {
    return new Promise((resolve, reject) => {
        crypto_1.default.scrypt(password.normalize(), salt, 64, (error, hash) => {
            if (error)
                reject('Error in hassing the password');
            resolve(hash.toString("hex").normalize());
        });
    });
}
function comparePasswords(_a) {
    return __awaiter(this, arguments, void 0, function* ({ password, salt, hashedPassword, }) {
        const inputHashedPassword = yield hashPassword(password, salt);
        return crypto_1.default.timingSafeEqual(Buffer.from(inputHashedPassword, "hex"), Buffer.from(hashedPassword, "hex"));
    });
}
function generateSalt() {
    return crypto_1.default.randomBytes(16).toString("hex").normalize();
}
function GenerateOtp() {
    function giveOtp() {
        return Math.floor(Math.random() * 999999);
    }
    let otp = giveOtp();
    for (let i = 0; true; i++) {
        if (otp > 99999 && otp < 1000000) {
            return otp;
        }
        else
            otp = giveOtp();
    }
}
function giveAuthSessionId() {
    let token = crypto_1.default.randomBytes(512).toString("hex").normalize();
    return token;
}
function giveAuthSession() {
    return crypto_1.default.randomBytes(32).toString("hex").normalize();
}
function sendRegistrationOTP(email, otp) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // TODO: Implement email sending logic here
            // This should use your email service to send the OTP
            // Return true if email sent successfully, false otherwise
            return true;
        }
        catch (error) {
            console.error("Send registration OTP error:", error);
            return false;
        }
    });
}
function generateAuthToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
function giveAuthSessionValue(user) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7;
    return {
        // Basic Info
        email: user.email,
        userId: user._id,
        // Location Info
        address: {
            country: user.address.country,
            lat: (_a = user.address.district) === null || _a === void 0 ? void 0 : _a.lat,
            long: (_b = user.address.district) === null || _b === void 0 ? void 0 : _b.long,
            division: (_c = user.address.division) === null || _c === void 0 ? void 0 : _c.name,
            district: (_d = user.address.district) === null || _d === void 0 ? void 0 : _d.name,
            upazila: (_e = user.address.upazila) === null || _e === void 0 ? void 0 : _e.name,
            union: (_f = user.address.union) === null || _f === void 0 ? void 0 : _f.name
        },
        // Contact Info
        phone: {
            number: user.phoneInfo.number,
            code: user.phoneInfo.country.phone_code,
        },
        // Personal Attributes
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        religion: user.religion,
        languages: user.languages,
        maritalStatus: user.maritalStatus,
        // Education & Professional Info
        isEducated: user.isEducated,
        education: (_g = user.education) === null || _g === void 0 ? void 0 : _g.map(edu => ({
            level: edu.level
        })),
        occupation: user.occupation,
        // Partner Preferences (Optimized for Search)
        partnerPreferences: {
            ageRange: {
                min: ((_j = (_h = user.partnerPreference) === null || _h === void 0 ? void 0 : _h.ageRange) === null || _j === void 0 ? void 0 : _j.min) ||
                    (user.gender === user_types_1.Gender.MALE ? 18 : 21),
                max: ((_l = (_k = user.partnerPreference) === null || _k === void 0 ? void 0 : _k.ageRange) === null || _l === void 0 ? void 0 : _l.max) ||
                    (user.gender === user_types_1.Gender.MALE ? 35 : 45)
            },
            heightRange: {
                min: ((_o = (_m = user.partnerPreference) === null || _m === void 0 ? void 0 : _m.heightRange) === null || _o === void 0 ? void 0 : _o.min) || 4,
                max: ((_q = (_p = user.partnerPreference) === null || _p === void 0 ? void 0 : _p.heightRange) === null || _q === void 0 ? void 0 : _q.max) || 7
            },
            weightRange: {
                min: ((_s = (_r = user.partnerPreference) === null || _r === void 0 ? void 0 : _r.weightRange) === null || _s === void 0 ? void 0 : _s.min) ||
                    (user.gender === user_types_1.Gender.MALE ? 45 : 50),
                max: ((_u = (_t = user.partnerPreference) === null || _t === void 0 ? void 0 : _t.weightRange) === null || _u === void 0 ? void 0 : _u.max) ||
                    (user.gender === user_types_1.Gender.MALE ? 75 : 85)
            },
            maritalStatus: ((_v = user.partnerPreference) === null || _v === void 0 ? void 0 : _v.maritalStatus) || [user_types_1.MaritalStatus.NEVER_MARRIED],
            education: user.isEducated ? {
                minimumLevel: ((_x = (_w = user.partnerPreference) === null || _w === void 0 ? void 0 : _w.education) === null || _x === void 0 ? void 0 : _x.minimumLevel) ||
                    (((_z = (_y = user.education) === null || _y === void 0 ? void 0 : _y[0]) === null || _z === void 0 ? void 0 : _z.level) || user_types_1.EducationLevel.HSC),
                mustBeEducated: (_2 = (_1 = (_0 = user.partnerPreference) === null || _0 === void 0 ? void 0 : _0.education) === null || _1 === void 0 ? void 0 : _1.mustBeEducated) !== null && _2 !== void 0 ? _2 : true,
                preferredLevels: ((_4 = (_3 = user.partnerPreference) === null || _3 === void 0 ? void 0 : _3.education) === null || _4 === void 0 ? void 0 : _4.preferredLevels) ||
                    [user_types_1.EducationLevel.HSC, user_types_1.EducationLevel.BACHELORS_DEGREE]
            } : undefined,
            religion: ((_5 = user.partnerPreference) === null || _5 === void 0 ? void 0 : _5.religion) || [user.religion],
            occupation: (_7 = (_6 = user.partnerPreference) === null || _6 === void 0 ? void 0 : _6.profession) === null || _7 === void 0 ? void 0 : _7.acceptedOccupations,
            location: {
                prefferedDistrictIds: user.partnerPreference.locationPreference.preferredDistrictIds
            }
        },
        // Security & Privacy
        blockedProfiles: user.enhancedSettings.blocked.map(({ userId }) => new mongoose_1.default.Types.ObjectId(userId))
    };
}
;
function validatePhoneNumber(phoneNumber) {
    // Remove all spaces and special characters except + and digits
    const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
    // Check if number starts with +
    if (!cleanedNumber.startsWith('+')) {
        return { isValid: false };
    }
    // Find matching country code
    const matchingCountry = countryCodes_1.countryCodes.find(country => {
        const code = country.code.replace(/\s/g, ''); // Remove any spaces in country code
        return cleanedNumber.startsWith(code);
    });
    if (!matchingCountry) {
        return { isValid: false };
    }
    const nationalNumber = cleanedNumber.slice(matchingCountry.code.length);
    // Validate number length based on country
    const isValidLength = validateNumberLength(nationalNumber, matchingCountry.country);
    if (!isValidLength) {
        return { isValid: false };
    }
    return {
        isValid: true,
        countryCode: matchingCountry.code,
        nationalNumber,
        country: matchingCountry
    };
}
function validateNumberLength(number, country) {
    // Define country-specific validation rules
    const countryRules = {
        'Bangladesh': { min: 10, max: 10 },
        'India': { min: 10, max: 10 },
        'United States': { min: 10, max: 10 },
        'United Kingdom': { min: 9, max: 10 },
    };
    // Default rule if country specific rule not found
    const defaultRule = { min: 6, max: 15 };
    const rule = countryRules[country] || defaultRule;
    return number.length >= rule.min && number.length <= rule.max;
}
