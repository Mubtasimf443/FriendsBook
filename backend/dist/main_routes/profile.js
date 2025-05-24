"use strict";
/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
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
const express_1 = require("express");
const auth_middleware_1 = require("../lib/middlewares/auth.middleware");
const rateRimiter_1 = __importDefault(require("../config/rateRimiter"));
const user_1 = require("../models/user");
const schemaComponents_1 = require("../lib/schema/schemaComponents");
const zod_1 = require("zod");
const query_middleware_1 = __importDefault(require("../lib/middlewares/query.middleware"));
const updateUser_schema_1 = require("../lib/schema/updateUser.schema");
const asset_1 = require("../models/asset");
const partnerPreference_schema_1 = require("../lib/schema/partnerPreference.schema");
require("../lib/types/express.decratation");
const VideoProfile_1 = __importDefault(require("../models/VideoProfile"));
const router = (0, express_1.Router)();
// Constants
const RATE_LIMIT_WINDOW_MS = 120 * 1000; // 2 minutes
const RATE_LIMIT_MAX_REQUESTS = 150;
// Apply rate limiter
router.use((0, rateRimiter_1.default)(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS));
router.use(query_middleware_1.default);
router.get('/user-details/video-profile', auth_middleware_1.validateVideoProfile, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            return res.status(200).json({
                success: true,
                data: {
                    name: req.videoProfile.name,
                    gender: req.videoProfile.gender,
                    email: req.videoProfile.email,
                    age: req.videoProfile.age,
                    status: req.videoProfile.status,
                    country: (_a = req.videoProfile.location) === null || _a === void 0 ? void 0 : _a.country,
                    _id: req.videoProfile._id,
                    languages: req.videoProfile.languages,
                    phone: req.videoProfile.phone,
                    lastActive: req.videoProfile.lastActive,
                    profileImage: req.videoProfile.profileImage,
                    coverImage: req.videoProfile.coverImage,
                    coins: req.videoProfile.video_calling_coins
                }
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: 'InternalServerError',
                data: null
            });
        }
    });
});
router.put('/user-details/video-profile', auth_middleware_1.validateVideoProfile, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Define validation schema with all fields as optional
            const updateSchema = zod_1.z.object({
                name: zod_1.z.string().optional(),
                gender: zod_1.z.enum(['male', 'female',]).optional(),
                status: zod_1.z.enum(['online', 'offline']).optional(),
                dateOfBirth: zod_1.z.string().transform(val => new Date(val)).optional(),
                age: zod_1.z.number().optional(),
                languages: zod_1.z.array(zod_1.z.string()).optional(),
                location: zod_1.z.object({
                    country: zod_1.z.string().optional(),
                    lat: zod_1.z.number().optional(),
                    long: zod_1.z.number().optional()
                }).optional(),
                coverImage: zod_1.z.object({ url: zod_1.z.string().url(), id: zod_1.z.string().uuid() }).optional(),
                profileImage: zod_1.z.object({ url: zod_1.z.string().url(), id: zod_1.z.string().uuid() }).optional(),
            });
            // Validate request body
            const validatedData = updateSchema.parse(req.body);
            // Find fields to update
            const updateData = {};
            // Map validated fields to updateData
            if (validatedData.name)
                updateData.name = validatedData.name;
            if (validatedData.gender)
                updateData.gender = validatedData.gender;
            if (validatedData.status)
                updateData.status = validatedData.status;
            if (validatedData.dateOfBirth)
                updateData.dateOfBirth = validatedData.dateOfBirth;
            if (validatedData.age)
                updateData.age = validatedData.age;
            if (validatedData.languages)
                updateData.languages = validatedData.languages;
            if (validatedData.profileImage)
                updateData.profileImage = validatedData.profileImage;
            if (validatedData.coverImage)
                updateData.coverImage = validatedData.coverImage;
            // Handle nested location object
            if (validatedData.location) {
                if (!updateData.location)
                    updateData.location = {};
                if (validatedData.location.country !== undefined)
                    updateData.location.country = validatedData.location.country;
                if (validatedData.location.lat !== undefined)
                    updateData.location.lat = validatedData.location.lat;
                if (validatedData.location.long !== undefined)
                    updateData.location.long = validatedData.location.long;
            }
            // Update lastActive timestamp
            updateData.lastActive = new Date();
            // Update user profile
            const updatedProfile = yield VideoProfile_1.default.findByIdAndUpdate(req.videoProfile._id, { $set: updateData }, { new: true });
            if (!updatedProfile) {
                return res.status(404).json({
                    success: false,
                    message: 'User profile not found',
                    error: 'NotFound',
                    data: null
                });
            }
            // Return updated profile with selected fields
            return res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    name: updateData.name && updatedProfile.name,
                    gender: updateData.gender && updatedProfile.gender,
                    age: updateData.age && updatedProfile.age,
                    status: updateData.status && updatedProfile.status,
                    country: (_a = updatedProfile.location) === null || _a === void 0 ? void 0 : _a.country,
                    _id: updatedProfile._id,
                    languages: updateData.languages && updatedProfile.languages,
                    lastActive: updateData.lastActive && updatedProfile.lastActive,
                    profileImage: updateData.profileImage && updatedProfile.profileImage,
                    coverImage: updateData.coverImage && updatedProfile.coverImage,
                }
            });
        }
        catch (error) {
            console.error('Error updating profile:', error);
            // Handle zod validation errors
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid request data',
                    error: 'ValidationError',
                    details: error.errors
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: 'InternalServerError',
                data: null
            });
        }
    });
});
router.get('/user-details/matrimony', auth_middleware_1.validateUser, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            let _id = (_b = (_a = req.authSession) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.userId;
            if (!_id)
                return res.sendStatus(401);
            let user = yield user_1.User.findById(_id, 'name email phoneInfo profileImage coverImage occupation maritalStatus languages address education height age weight dateOfBirth gender profileCreatedBy mid onlineStatus aboutMe familyInfo membership')
                .populate('membership.currentMembership.requestId', 'tier duration endDate startDate')
                .lean();
            if (!user)
                return res.sendStatus(204);
            let membership = (_d = (_c = user.membership) === null || _c === void 0 ? void 0 : _c.currentMembership) === null || _d === void 0 ? void 0 : _d.requestId;
            delete user.membership;
            res.status(200).json({
                success: true,
                data: Object.assign(Object.assign({}, user), { membership }),
                error: null,
                message: 'OK'
            });
            return;
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid request parameters',
                    error: error.errors,
                    data: null
                });
                return;
            }
            console.error('[matrimony User Details Api Error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.get('/user-details/matrimony/:id', auth_middleware_1.validateUser, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            let _id = schemaComponents_1._idValidator.parse(req.params.id);
            let user = yield user_1.User.findById(_id, 'name email phoneInfo profileImage coverImage occupation maritalStatus languages address education height age weight dateOfBirth gender profileCreatedBy mid onlineStatus aboutMe familyInfo membership')
                .populate('membership.currentMembership.requestId', 'tier duration endDate startDate')
                .lean();
            if (!user)
                return res.sendStatus(204);
            let membership = (_b = (_a = user.membership) === null || _a === void 0 ? void 0 : _a.currentMembership) === null || _b === void 0 ? void 0 : _b.requestId;
            delete user.membership;
            res.status(200).json({
                success: true,
                data: Object.assign(Object.assign({}, user), { membership }),
                error: null,
                message: 'OK'
            });
            return;
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid request parameters',
                    error: error.errors,
                    data: null
                });
                return;
            }
            console.error('[matrimony User Details Api Error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.put('/user-details/matrimony', auth_middleware_1.validateUser, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            // 1. Parse and validate request body
            const updateData = yield updateUser_schema_1.updateUserSchema.parseAsync(req.body);
            if (!req.authSession || !((_a = req.authSession) === null || _a === void 0 ? void 0 : _a.value)) {
                res.status(401).json({
                    success: false,
                    message: 'Failed to authorize the user',
                    data: null
                });
                return;
            }
            // 2. Get user ID from auth session
            const userId = req.authSession.value.userId;
            let updatesData = {};
            // Basic Information
            if (updateData.name)
                updatesData['name'] = updateData.name;
            if (updateData.gender)
                updatesData['gender'] = updateData.gender;
            if (updateData.dateOfBirth)
                updatesData['dateOfBirth'] = updateData.dateOfBirth;
            if (updateData.age)
                updatesData['age'] = updateData.age;
            if (updateData.weight)
                updatesData['weight'] = updateData.weight;
            if (updateData.height)
                updatesData['height'] = updateData.height;
            if (updateData.maritalStatus)
                updatesData['maritalStatus'] = updateData.maritalStatus;
            if ((_b = updateData.phoneInfo) === null || _b === void 0 ? void 0 : _b.number)
                updatesData['phoneInfo.number'] = updateData.phoneInfo.number;
            if (updateData.address)
                updatesData['address'] = updateData.address;
            // Background Information
            if (updateData.religion)
                updatesData['religion'] = updateData.religion;
            if (updateData.languages)
                updatesData['languages'] = updateData.languages;
            // Education & Career
            if (updateData.occupation)
                updatesData['occupation'] = updateData.occupation;
            if (updateData.annualIncome)
                updatesData['annualIncome'] = updateData.annualIncome;
            // Additional Information
            if (updateData.aboutMe)
                updatesData['aboutMe'] = updateData.aboutMe;
            if (updateData.familyInfo)
                updatesData['familyInfo'] = updateData.familyInfo;
            // Settings
            if ((_c = updateData.enhancedSettings) === null || _c === void 0 ? void 0 : _c.privacy)
                updatesData['enhancedSettings.privacy'] = updateData.enhancedSettings.privacy;
            if ((_d = updateData.enhancedSettings) === null || _d === void 0 ? void 0 : _d.notifications)
                updatesData['enhancedSettings.notifications'] = updateData.enhancedSettings.notifications;
            // Filter out undefined values
            updatesData = Object.fromEntries(Object.entries(updatesData).filter(([_, value]) => value !== undefined));
            if (Object.keys(updatesData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No parameters found to update the user',
                    data: null
                });
            }
            // Add last update timestamp
            updatesData['lastUpdated'] = new Date();
            // Update the user and return the new document
            let updatedUser = yield user_1.User.findByIdAndUpdate(userId, { $set: updatesData, }, {
                runValidators: true // Run model validators
            });
            if (!updatedUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    data: null
                });
            }
            updatedUser = updatedUser.toObject();
            let updatedFields = {};
            for (const [key, value] of Object.entries(updateData)) {
                updatedFields[key] = updatedUser[key];
            }
            return res.status(200).json({
                success: true,
                message: 'User details updated successfully',
                data: { updatedFields }
            });
        }
        catch (error) {
            console.error('[User Details Update api error]', { timestamp: new Date() });
            console.error(error);
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    data: null,
                    errors: error.errors
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.put('/user-details/education/matrimony', auth_middleware_1.validateUser, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            // Get user ID from auth session
            if (!req.authSession || !((_a = req.authSession) === null || _a === void 0 ? void 0 : _a.value)) {
                res.status(401).json({
                    success: false,
                    message: 'Failed to authorize the user',
                    data: null
                });
                return;
            }
            const userId = req.authSession.value.userId;
            // Validate the request body using the schema
            const updateData = yield updateUser_schema_1.updateUserEducationSchema.parseAsync(req.body);
            // Get current user data
            const user = yield user_1.User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    data: null
                });
            }
            // Update education related fields
            const updatesData = {
                isEducated: updateData.isEducated
            };
            // Only include education array if it's provided and user is educated
            if (updateData.isEducated && updateData.education) {
                updatesData.education = updateData.education.map(edu => ({
                    level: edu.level,
                    certificate: edu.certificate,
                    institution: edu.institution,
                    yearOfCompletion: edu.yearOfCompletion,
                    grade: edu.grade,
                    additionalInfo: edu.additionalInfo
                }));
            }
            // If user is marked as not educated, clear the education array
            if (!updateData.isEducated) {
                updatesData.education = [];
            }
            // Update user's education details
            const updatedUser = yield user_1.User.findByIdAndUpdate(userId, { $set: updatesData }, {
                new: true, // Return the updated document
                runValidators: true // Run model validators
            }).select('isEducated education'); // Only select relevant fields
            if (!updatedUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    data: null
                });
            }
            // Set cache control header to prevent caching of sensitive data
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            return res.status(200).json({
                success: true,
                message: 'Education details updated successfully',
                data: {
                    isEducated: updatedUser.isEducated,
                    education: updatedUser.education
                }
            });
        }
        catch (error) {
            console.error('[Education Update API Error]', {
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                userId: (_c = (_b = req.authSession) === null || _b === void 0 ? void 0 : _b.value) === null || _c === void 0 ? void 0 : _c.userId
            });
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    error: error.errors,
                    data: null
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.put('/user-details/partner-preference/matrimony', auth_middleware_1.validateUser, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // 1. Parse and validate request body against the partnerPreferenceSchema
            const updateData = yield partnerPreference_schema_1.partnerPreferenceSchema.parseAsync(req.body);
            if (!req.authSession || !((_a = req.authSession) === null || _a === void 0 ? void 0 : _a.value)) {
                res.status(401).json({
                    success: false,
                    message: 'Failed to authorize the user',
                    data: null
                });
                return;
            }
            // 2. Get user ID from auth session
            const userId = req.authSession.value.userId;
            // Check if any update parameters were provided
            let updatesData = {};
            // Conditionally add fields to updatesData
            if (updateData.ageRange)
                updatesData['partnerPreference.ageRange'] = updateData.ageRange;
            if (updateData.heightRange)
                updatesData['partnerPreference.heightRange'] = updateData.heightRange;
            if (updateData.weightRange)
                updatesData['partnerPreference.weightRange'] = updateData.weightRange;
            if (updateData.maritalStatus)
                updatesData['partnerPreference.maritalStatus'] = updateData.maritalStatus;
            if (updateData.complexion)
                updatesData['partnerPreference.complexion'] = updateData.complexion;
            if (updateData.physicalStatus)
                updatesData['partnerPreference.physicalStatus'] = updateData.physicalStatus;
            if (updateData.religiousBranch)
                updatesData['partnerPreference.religiousBranch'] = updateData.religiousBranch;
            if (updateData.dealBreakers)
                updatesData['partnerPreference.dealBreakers'] = updateData.dealBreakers;
            if (updateData.locationPreference)
                updatesData['partnerPreference.locationPreference'] = updateData.locationPreference;
            if (updateData.education)
                updatesData['partnerPreference.education'] = updateData.education;
            if (updateData.profession)
                updatesData['partnerPreference.profession'] = updateData.profession;
            if (updateData.religion)
                updatesData['partnerPreference.religion'] = updateData.religion;
            if (updateData.motherTongue)
                updatesData['partnerPreference.motherTongue'] = updateData.motherTongue;
            if (updateData.familyValues)
                updatesData['partnerPreference.familyValues'] = updateData.familyValues;
            if (updateData.familyBackground)
                updatesData['partnerPreference.familyBackground'] = updateData.familyBackground;
            // Filter out undefined values (though Zod should handle this implicitly)
            updatesData = Object.fromEntries(Object.entries(updatesData).filter(([_, value]) => value !== undefined));
            if (Object.keys(updatesData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No partner preference parameters found to update',
                    data: null
                });
            }
            // Add last update timestamp to the partnerPreference sub-document
            updatesData['partnerPreference.lastUpdated'] = new Date();
            // Update the user's partner preferences
            const updatedUser = yield user_1.User.findByIdAndUpdate(userId, { $set: updatesData }, { new: true, runValidators: true } // 'new: true' returns the modified document, 'runValidators' ensures schema validation
            );
            if (!updatedUser) {
                res.status(400).json({
                    success: false,
                    message: 'Failed to Update the User',
                    data: null
                });
                return;
            }
            return res.status(200).json({
                success: true,
                message: 'Partner preference updated successfully',
                data: { updatedPreference: updatedUser.partnerPreference }
            });
        }
        catch (error) {
            console.error('[Partner Preference Update api error]', { timestamp: new Date() });
            console.error(error);
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    data: null,
                    errors: error.errors
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.post('/user-details/update-photo/matrimony', auth_middleware_1.validateUser, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            if (!req.authSession || !((_a = req.authSession) === null || _a === void 0 ? void 0 : _a.value)) {
                res.status(401).json({
                    success: false,
                    message: 'Failed to authorize the user',
                    data: null
                });
                return;
            }
            let PhotoType;
            (function (PhotoType) {
                PhotoType["Profile"] = "profileImage";
                PhotoType["Cover"] = "coverImage";
                PhotoType["userImages"] = "userImages";
            })(PhotoType || (PhotoType = {}));
            let updatePhotoSchema = zod_1.z.object({
                photoType: zod_1.z.nativeEnum(PhotoType),
                asset_id: zod_1.z.string().uuid({
                    message: "Invalid asset ID format. Must be a valid UUID."
                })
            });
            let validationResult = yield updatePhotoSchema.safeParseAsync(req.body);
            if (!validationResult.success) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid request parameters',
                    error: validationResult.error.errors,
                    data: null
                });
                return;
            }
            let { photoType, asset_id } = validationResult.data;
            let asset = yield asset_1.Asset.findOne({ id: asset_id });
            if (!asset) {
                res.status(404).json({
                    success: false,
                    message: 'Asset not found. Please ensure you are using a valid asset ID.',
                    error: 'ASSET_NOT_FOUND',
                    data: null
                });
                return;
            }
            let url = asset.url;
            if (photoType === PhotoType.userImages) {
                let db_user = yield user_1.User.findById(req.authSession.value.userId);
                if (!db_user) {
                    res.status(404).json({
                        success: false,
                        message: 'User not found. Please ensure you are logged in.',
                        error: 'USER_NOT_FOUND',
                        data: null
                    });
                    return;
                }
                // Initialize userImages array if it doesn't exist
                if (!db_user.userImages) {
                    db_user.userImages = [];
                }
                if (db_user.userImages.length >= 10) {
                    res.status(400).json({
                        success: false,
                        message: 'Maximum photo limit reached. You can upload up to 10 photos.',
                        error: 'MAX_PHOTOS_LIMIT_REACHED',
                        data: null
                    });
                    return;
                }
                // Check if image is already added
                const isDuplicate = db_user.userImages.some(img => img.id === asset_id);
                if (isDuplicate) {
                    res.status(400).json({
                        success: false,
                        message: 'This photo has already been added to your gallery.',
                        error: 'DUPLICATE_PHOTO',
                        data: null
                    });
                    return;
                }
                db_user.userImages.push({ url, id: asset.id });
                yield db_user.save();
                res.status(200).json({
                    success: true,
                    data: {
                        photoData: {
                            photoType,
                            totalPhotos: db_user.userImages.length,
                            remainingSlots: 10 - db_user.userImages.length
                        },
                        userData: {
                            userImages: db_user.userImages
                        }
                    },
                    error: null,
                    message: 'Photo successfully added to your gallery'
                });
                return;
            }
            // For profile and cover photos
            let updateQuery = {
                $set: {}
            };
            updateQuery.$set[photoType] = { url, id: asset_id };
            const updatedUser = yield user_1.User.findByIdAndUpdate(req.authSession.value.userId, updateQuery);
            if (!updatedUser) {
                res.status(404).json({
                    success: false,
                    message: 'User not found. Please ensure you are logged in.',
                    error: 'USER_NOT_FOUND',
                    data: null
                });
                return;
            }
            const photoTypeMessages = {
                [PhotoType.Profile]: 'Profile photo',
                [PhotoType.Cover]: 'Cover photo',
                [PhotoType.userImages]: 'Photo'
            };
            res.status(200).json({
                success: true,
                data: {
                    photoData: {
                        photoType,
                        url: url
                    },
                    user: Object.assign({}, (photoType === 'coverImage' ? ({ 'coverImage': updatedUser.coverImage }) : ({ 'profileImage': updatedUser.profileImage })))
                },
                error: null,
                message: `${photoTypeMessages[photoType]} updated successfully`
            });
            return;
        }
        catch (error) {
            console.error('[Update photo api error]', {
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                userId: (_c = (_b = req.authSession) === null || _b === void 0 ? void 0 : _b.value) === null || _c === void 0 ? void 0 : _c.userId
            });
            return res.status(500).json({
                success: false,
                message: 'An error occurred while updating your photo. Please try again later.',
                error: 'INTERNAL_SERVER_ERROR',
                data: null
            });
        }
    });
});
router.delete('/user-details/user-photo/matrimony', auth_middleware_1.validateUser, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!req.authSession || !((_a = req.authSession) === null || _a === void 0 ? void 0 : _a.value)) {
                res.status(401).json({
                    success: false,
                    message: 'Failed to authorize the user',
                    data: null
                });
                return;
            }
            // Define photo types enum
            let PhotoType;
            (function (PhotoType) {
                PhotoType["Profile"] = "profileImage";
                PhotoType["Cover"] = "coverImage";
                PhotoType["UserImages"] = "userImages";
            })(PhotoType || (PhotoType = {}));
            // Validation schema
            const deletePhotoSchema = zod_1.z.object({
                photoType: zod_1.z.nativeEnum(PhotoType),
                imageId: zod_1.z.string().uuid({
                    message: "Invalid image ID format"
                })
            });
            // Validate request body
            const validationResult = yield deletePhotoSchema.safeParseAsync(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid request parameters',
                    error: validationResult.error.errors,
                    data: null
                });
            }
            const { photoType, imageId } = validationResult.data;
            const userId = req.authSession.value.userId;
            // Get user
            const user = yield user_1.User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    data: null
                });
            }
            // Handle different photo types
            if (photoType === PhotoType.UserImages) {
                // Remove image from userImages array
                const imageIndex = user.userImages.findIndex(img => img.id === imageId);
                if (imageIndex === -1) {
                    return res.status(404).json({
                        success: false,
                        message: 'Image not found in user images',
                        data: null
                    });
                }
                // Remove the image
                user.userImages.splice(imageIndex, 1);
                yield user.save();
            }
            else {
                // Handle profile or cover image
                const currentImage = user[photoType];
                if (!currentImage || currentImage.id !== imageId) {
                    return res.status(404).json({
                        success: false,
                        message: `Image not found in ${photoType}`,
                        data: null
                    });
                }
                // Create update query
                const updateQuery = {
                    $unset: {
                        [photoType]: 1
                    }
                };
                // Update user
                yield user_1.User.findByIdAndUpdate(userId, updateQuery);
            }
            // Delete the asset
            yield asset_1.Asset.findOneAndDelete({ id: imageId });
            // Set cache control
            res.set('Cache-Control', 'no-cache');
            return res.status(200).json({
                success: true,
                message: 'Image deleted successfully',
                data: null
            });
        }
        catch (error) {
            console.error('[Delete user image API Error]', {
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
// router.post('/user-details/membership-request',validateUser , async function (req: Request, res: Response): Promise<any> {
//     try {
//         if (!req.authSession || !req.authSession?.value) {
//             res.status(401).json({
//                 success: false,
//                 message: 'Failed to authorize the user',
//                 data: null
//             });
//             return;
//         }
//         const userId = req.authSession.value.userId;
//         // Check if user exists
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found',
//                 data: null
//             });
//         }
//         const pendingRequest = await MembershipRequest.findOne({
//             requesterID: userId,
//             requestStatus: MembershipRequestStatus.PENDING
//         });
//         if (pendingRequest) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'You already have a pending membership request',
//                 data: null
//             });
//         }
//         let db_user = await User.findById(userId, 'membership');
//         if (!db_user) {
//             res.status(401).json({
//                 success: false,
//                 message: 'Could not find The User Account',
//                 data: null
//             });
//             return;
//         }
//         if (db_user.hasActiveMembership()) {
//             res.status(400).json({
//                 success: false,
//                 message: 'User Already has an active membership, You can not request membership when User has a membership active',
//                 data: null
//             });
//             return;
//         }
//         // // Validate request body
//         const validatedData = await membershipRequestSchema.parseAsync(req.body);
//         const startDate = new Date(validatedData.startDate);
//         // Create membership request
//         const membershipRequest = new MembershipRequest({
//             ...validatedData,
//             startDate,
//             requesterID: userId,
//             requestStatus: MembershipRequestStatus.PENDING,
//             requestDate: new Date(),
//             endDate: new Date(startDate.getTime() + validatedData.duration * 30 * 24 * 60 * 60 * 1000)
//         });
//         await membershipRequest.save();
//         return res.status(201).json({
//             success: true,
//             message: 'Membership request created successfully',
//             data: membershipRequest
//         });
//     } catch (error) {
//         console.error('[Membership Request API Error]', {
//             error: error instanceof Error ? error.message : 'Unknown error',
//             timestamp: new Date().toISOString()
//         });
//         if (error instanceof z.ZodError) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Validation error',
//                 error: error.errors,
//                 data: null
//             });
//         }
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
// router.get('/membership-request', validateUser, async function (req: Request, res: Response): Promise<Response | any> {
//     try {
//         if (!req.authSession || !req.authSession?.value) {
//             res.status(401).json({
//                 success: false,
//                 message: 'Failed to authorize the user',
//                 data: null
//             });
//             return;
//         }
//         const userId = req.authSession.value.userId;
//         // Validate query parameters
//         const validationResult = membershipRequestQuerySchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const { page, limit, status, count: shouldCount } = validationResult.data;
//         // Build query
//         const query: any = { requesterID: userId };
//         if (status && status !== 'all') {
//             query.requestStatus = status;
//         }
//         // Execute query with pagination
//         const requests = await MembershipRequest.find(query)
//             .sort({ requestDate: -1 })
//             .skip((page - 1) * limit)
//             .limit(limit)
//             .lean()
//             .maxTimeMS(10000); // Set maximum execution time
//         // Get total count if requested
//         let totalCount: number | undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await MembershipRequest.countDocuments(query)
//                 .maxTimeMS(5000);
//         }
//         // Prepare pagination info
//         let pagination: object = {
//             currentPage: page,
//             pageSize: limit,
//         };
//         if (totalCount !== undefined) {
//             pagination = {
//                 ...pagination,
//                 totalPages: Math.ceil(totalCount / limit),
//                 totalRequests: totalCount
//             };
//         }
//         // Set cache headers
//         res.set('Cache-Control', 'private, max-age=30'); // Cache for 30 seconds, private because it's user-specific
//         return res.status(200).json({
//             success: true,
//             data: {
//                 requests,
//                 pagination,
//                 filterCriteria: {
//                     status
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('[Get Membership History API Error]', {
//             error: error instanceof Error ? error.message : 'Unknown error',
//             timestamp: new Date().toISOString(),
//             userId: req.authSession?.value?.userId
//         });
//         if (error instanceof z.ZodError) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Validation error',
//                 error: error.errors,
//                 data: null
//             });
//         }
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
// router.put('/membership-request/cancel', validateUser, async function (req: Request, res: Response): Promise<any> {
//     try {
//         if (!req.authSession || !req.authSession?.value) {
//             res.status(401).json({
//                 success: false,
//                 message: 'Failed to authorize the user',
//                 data: null
//             });
//             return;
//         }
//         const userId = req.authSession.value.userId;
//         const membershipRequest = await MembershipRequest.findOne({
//             requesterID: userId,
//             requestStatus: MembershipRequestStatus.PENDING
//         });
//         if (!membershipRequest) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'No pending membership request found',
//                 data: null
//             });
//         }
//         membershipRequest.cancel();
//         await membershipRequest.save();
//         return res.status(200).json({
//             success: true,
//             message: 'Membership request cancelled successfully',
//             data: membershipRequest
//         });
//     } catch (error) {
//         console.error('[Cancel Membership Request API Error]', {
//             error: error instanceof Error ? error.message : 'Unknown error',
//             timestamp: new Date().toISOString()
//         });
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
// router.delete('/membership-request', validateUser, async function (req: Request, res: Response): Promise<any> {
//     try {
//         if (!req.authSession || !req.authSession?.value) {
//             res.status(401).json({
//                 success: false,
//                 message: 'Failed to authorize the user',
//                 data: null
//             });
//             return;
//         }
//         const userId = req.authSession.value.userId;
//         const membershipRequest = await MembershipRequest.findOne({
//             requesterID: userId,
//             requestStatus: MembershipRequestStatus.CANCELLED
//         });
//         if (!membershipRequest) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'No cancelled membership request found',
//                 data: null
//             });
//         }
//         await membershipRequest.deleteOne();
//         return res.status(200).json({
//             success: true,
//             message: 'Membership request deleted successfully',
//             data: null
//         });
//     } catch (error) {
//         console.error('[Delete Membership Request API Error]', {
//             error: error instanceof Error ? error.message : 'Unknown error',
//             timestamp: new Date().toISOString()
//         });
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
exports.default = router;
