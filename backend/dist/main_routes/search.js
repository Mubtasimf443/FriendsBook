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
const rateRimiter_1 = __importDefault(require("../config/rateRimiter"));
const auth_middleware_1 = require("../lib/middlewares/auth.middleware");
const country_names_enum_1 = require("../lib/types/country_names.enum");
const search_controller_1 = require("../controllers/search.controller");
const user_1 = require("../models/user");
const search_schema_1 = require("../lib/schema/search.schema");
const ProfileView_1 = require("../models/ProfileView");
const query_middleware_1 = __importDefault(require("../lib/middlewares/query.middleware"));
const userEducation_types_1 = require("../lib/types/userEducation.types");
const SearchHistory_1 = require("../models/SearchHistory");
const schemaComponents_1 = require("../lib/schema/schemaComponents");
const zod_1 = require("zod");
const ConnectionRequest_1 = require("../models/ConnectionRequest");
const countryWithLatLong_1 = require("../lib/data/countryWithLatLong");
const VideoProfile_1 = __importDefault(require("../models/VideoProfile"));
require("../lib/types/express.decratation");
const districts_1 = require("../lib/data/districts");
const router = (0, express_1.Router)();
router.use((0, rateRimiter_1.default)(120 * 1000, 200));
router.use(query_middleware_1.default);
router.use(auth_middleware_1.validateBothProfiledUser);
router.get('/users/explore/country', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const getOnlineUsersSchema = zod_1.z.object({
                country: zod_1.z.nativeEnum(country_names_enum_1.CountryNamesEnum).optional(),
                page: zod_1.z.string().regex(/^\d+$/).transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('1'),
                limit: zod_1.z.string().regex(/^\d+$/).transform(Number).pipe(zod_1.z.number().min(1).max(50)).optional().default('20'),
            });
            // Validate query parameters
            const validation = getOnlineUsersSchema.safeParse(req.query);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid query parameters",
                    errors: validation.error.errors,
                    data: null
                });
            }
            const { country, page, limit } = validation.data;
            const skip = (page - 1) * limit;
            // Base query using your existing helper
            const baseQuery = {};
            // Handle country filtering
            if (country && country.toLowerCase() !== 'any') {
                baseQuery['location.country'] = country;
            }
            // Get list of all unique countries where users have signed up
            let userCountries = [];
            if (!country || country.toLowerCase() === 'any') {
                userCountries = yield VideoProfile_1.default.distinct('location.country');
            }
            // Fetch users with sorting by online status
            const aggregationPipeline = [
                { $match: baseQuery },
                {
                    $addFields: {
                        onlineSortOrder: {
                            $cond: [
                                { $eq: ["$status", "online"] },
                                0, // Online users first
                                1 // Offline users second
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        onlineSortOrder: 1,
                        "lastActive": -1
                    }
                },
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        name: 1,
                        email: 1,
                        'profileImage.url': 1,
                        status: 1,
                        lastActive: 1,
                        age: 1,
                        gender: 1,
                        "location.country": 1
                    }
                }
            ];
            const [users, totalCount] = yield Promise.all([
                VideoProfile_1.default.aggregate(aggregationPipeline),
                VideoProfile_1.default.countDocuments(baseQuery)
            ]);
            // Prepare response data
            const responseData = {
                success: true,
                data: {
                    users: (0, search_controller_1.getUserWithCountryFlagsEmoji)(users),
                    pagination: {
                        currentPage: page,
                        pageSize: limit,
                        totalPages: Math.ceil(totalCount / limit),
                        totalUsers: totalCount
                    }
                }
            };
            // Add countries list if 'any' was requested
            if (!country || country.toLowerCase() === 'any') {
                responseData.data.countries = (0, search_controller_1.shuffleArray)(userCountries);
            }
            else {
                responseData.data.country = country;
            }
            // Set cache control headers
            res.set('Cache-Control', 'public, max-age=30'); // Cache for 30 seconds since this is real-time data
            return res.status(200).json(responseData);
        }
        catch (error) {
            console.error('[Online Users API Error]:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.get('/users/explore/country/near-by-me', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const getOnlineUsersSchema = zod_1.z.object({
                country_count: zod_1.z.string()
                    .regex(/^\d+$/)
                    .transform(Number)
                    .pipe(zod_1.z.number().min(1).max(countryWithLatLong_1.countryCoordinates.length - 1))
                    .optional()
                    .default('50'),
                page: zod_1.z.string()
                    .regex(/^\d+$/)
                    .transform(Number)
                    .pipe(zod_1.z.number().min(1).max(100))
                    .optional()
                    .default('1'),
                limit: schemaComponents_1.limitValidation,
                latitude: zod_1.z.string()
                    .transform(Number)
                    .refine((val) => !isNaN(val), {
                    message: "Latitude must be a valid number",
                })
                    .refine((val) => val >= -90 && val <= 90, {
                    message: "Latitude must be between -90 and 90",
                }),
                longitude: zod_1.z.string()
                    .transform(Number)
                    .refine((val) => !isNaN(val), {
                    message: "Longitude must be a valid number",
                })
                    .refine((val) => val >= -180 && val <= 180, {
                    message: "Longitude must be between -180 and 180",
                }),
            });
            // Validate query parameters
            const validation = getOnlineUsersSchema.safeParse(req.query);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid query parameters",
                    errors: validation.error.errors,
                    data: null
                });
            }
            const { page, limit, country_count, latitude, longitude } = validation.data;
            const skip = (page - 1) * limit;
            // Base query using your existing helper
            const baseQuery = {};
            // Get coordinates - either from request or from user's country
            let userLat = latitude;
            let userLong = longitude;
            // Find nearby countries based on coordinates
            let nearbyCountries = countryWithLatLong_1.countryCoordinates
                .map(({ name, latitude, longitude }) => ({
                name,
                distance: (0, search_controller_1.getDistance)(userLat, userLong, latitude, longitude)
            }))
                .sort((a, b) => a.distance - b.distance)
                .slice(0, country_count)
                .map(el => el.name);
            baseQuery['location.country'] = { $in: nearbyCountries };
            // Build aggregation pipeline
            let aggregate = [];
            aggregate.push({ $match: baseQuery });
            aggregate.push({
                $addFields: {
                    onlineSortOrder: {
                        $cond: [
                            { $eq: ["$status", "online"] },
                            0, // Online users first
                            1 // Offline users second
                        ]
                    }
                }
            });
            aggregate.push({
                $sort: {
                    onlineSortOrder: 1,
                    "lastActive": -1
                }
            });
            aggregate.push({ $skip: skip });
            aggregate.push({ $limit: limit });
            aggregate.push({
                $project: {
                    name: 1,
                    email: 1,
                    'profileImage.url': 1,
                    status: 1,
                    lastActive: 1,
                    age: 1,
                    gender: 1,
                    "location.country": 1
                }
            });
            const [users, totalCount] = yield Promise.all([
                VideoProfile_1.default.aggregate(aggregate),
                VideoProfile_1.default.countDocuments(baseQuery)
            ]);
            // Set cache control headers
            let responseUsers = (0, search_controller_1.getUserWithCountryFlagsEmoji)(users);
            res.set('Cache-Control', 'public, max-age=60');
            return res.status(200).json({
                success: true,
                data: {
                    users: responseUsers,
                    pagination: {
                        currentPage: page,
                        pageSize: limit,
                        totalPages: Math.ceil(totalCount / limit),
                        totalUsers: totalCount
                    },
                    nearbyCountries: nearbyCountries,
                    coordinates: {
                        latitude: userLat,
                        longitude: userLong
                    }
                }
            });
        }
        catch (error) {
            console.error('[Nearby Users API Error]:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
let userField = 'name _id email profileImage.url gender age onlineStatus';
router.get('/users/just-joined', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const validationResult = search_schema_1.justJoinedSchema.safeParse(req.query);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid query parameters",
                    error: validationResult.error.errors,
                    data: null
                });
            }
            const { timeRange, limit, page, count: shouldCount } = validationResult.data;
            // Calculate the date range
            const daysAgo = parseInt(timeRange);
            const startDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
            let userInfo = (0, search_controller_1.getUserDataFromRequest)(req);
            // Calculate pagination
            const skip = (page - 1) * limit;
            // Base query for finding users
            const baseQuery = {
                createdAt: { $gte: startDate },
                gender: { $ne: userInfo.gender },
            };
            // Find users using aggregation
            let aggregate = [
                { $match: baseQuery },
                { $sort: {
                        'onlineStatus.isOnline': -1,
                        'onlineStatus.lastActive': 1,
                        createdAt: -1
                    } },
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        name: 1,
                        _id: 1,
                        email: 1,
                        'profileImage.url': 1,
                        gender: 1,
                        age: 1,
                        onlineStatus: 1
                    }
                }
            ];
            let users = yield user_1.User.aggregate(aggregate);
            // Get total count if requested
            let totalCount = undefined;
            if (shouldCount === 'yes') {
                totalCount = yield user_1.User.countDocuments(baseQuery).maxTimeMS(10000);
            }
            // Prepare pagination info
            let pagination = {
                currentPage: page,
                pageSize: limit,
            };
            if (totalCount !== undefined) {
                pagination = Object.assign(Object.assign({}, pagination), { totalPages: Math.ceil(totalCount / limit), totalUsers: totalCount });
            }
            return res.status(200).json({
                success: true,
                data: {
                    users,
                    pagination,
                    timeRange: `${timeRange} days`,
                }
            });
        }
        catch (error) {
            console.error(`recent profile listing api error:`, error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.get('/users/online', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let userInfo = (0, search_controller_1.getUserDataFromRequest)(req);
            // Validate query parameters
            const validationResult = search_schema_1.paginationSchema.safeParse(req.query);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid query parameters",
                    error: validationResult.error.errors,
                    data: null
                });
            }
            const { page, limit, count: shouldCount } = validationResult.data;
            // Base query for finding online users
            const baseQuery = {
                'onlineStatus.isOnline': true,
                gender: { $ne: userInfo.gender }
            };
            // Calculate pagination
            const skip = (page - 1) * limit;
            // Find online users with aggregation
            let aggregate = [
                { $match: baseQuery },
                { $sort: { 'onlineStatus.lastActive': 1 } }, // Sort by most recently active
                { $skip: skip },
                { $limit: limit },
                { $project: {
                        name: 1,
                        _id: 1,
                        email: 1,
                        'profileImage.url': 1,
                        gender: 1,
                        age: 1,
                        onlineStatus: 1
                    } }
            ];
            let users = yield user_1.User.aggregate(aggregate);
            // Get total count if requested
            let totalCount = undefined;
            if (shouldCount === 'yes') {
                totalCount = yield user_1.User.countDocuments(baseQuery).maxTimeMS(8000);
            }
            // Prepare pagination info
            let pagination = {
                currentPage: page,
                pageSize: limit,
            };
            if (totalCount !== undefined) {
                pagination = Object.assign(Object.assign({}, pagination), { totalPages: Math.ceil(totalCount / limit), totalUsers: totalCount });
            }
            // Add cache control headers
            res.set('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
            return res.status(200).json({
                success: true,
                data: {
                    users,
                    pagination,
                }
            });
        }
        catch (error) {
            console.error('Online users API error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.get('/users/premium', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let userInfo = (0, search_controller_1.getUserDataFromRequest)(req);
            const validationResult = search_schema_1.paginationSchema.safeParse(req.query);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid query parameters",
                    error: validationResult.error.errors,
                    data: null
                });
            }
            const { page, limit, count: shouldCount } = validationResult.data;
            const baseQuery = {
                gender: { $ne: userInfo.gender },
                'membership.currentMembership.requestId': { $exists: true },
                'membership.currentMembership.membership_exipation_date': { $gt: new Date() }
            };
            const skip = (page - 1) * limit;
            // Use aggregation to prioritize online users
            let aggregate = [
                { $match: baseQuery },
                { $sort: {
                        'onlineStatus.isOnline': -1,
                        'onlineStatus.lastActive': 1
                    } },
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        name: 1,
                        _id: 1,
                        email: 1,
                        'profileImage.url': 1,
                        gender: 1,
                        age: 1,
                        onlineStatus: 1,
                        membership: 1
                    }
                }
            ];
            let users = yield user_1.User.aggregate(aggregate);
            let totalCount = undefined;
            if (shouldCount === 'yes') {
                totalCount = yield user_1.User.countDocuments(baseQuery).maxTimeMS(10000);
            }
            let pagination = {
                currentPage: page,
                pageSize: limit,
            };
            if (totalCount !== undefined) {
                pagination = Object.assign(Object.assign({}, pagination), { totalPages: Math.ceil(totalCount / limit), totalUsers: totalCount });
            }
            res.set('Cache-Control', 'private, max-age=60');
            res.status(200).json({
                success: true,
                data: {
                    users
                },
                error: null,
                message: 'PREMIUM_USERS_FOUND'
            });
            return;
        }
        catch (error) {
            console.error('[Premium Users Search Api error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.get('/users/preferred-education', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let userInfo = (0, search_controller_1.getUserDataFromRequest)(req);
            req.query.educationLevels && Array.isArray(req.query.educationLevels) === false && (req.query.educationLevels = [req.query.educationLevels]);
            const validationResult = search_schema_1.preferredEducationSearchSchema.safeParse(req.query);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid query parameters",
                    error: validationResult.error.errors,
                    data: null
                });
            }
            const { page, limit, count: shouldCount, educationLevels } = validationResult.data;
            // Calculate pagination
            const skip = (page - 1) * limit;
            let allEducationLevels = yield user_1.User.distinct('education.level', { isEducated: true });
            // Base query for finding users
            const baseQuery = {
                gender: { $ne: userInfo.gender },
                isEducated: true,
                "education.level": { $in: educationLevels ? educationLevels : allEducationLevels }
            };
            // Use aggregation to prioritize online users
            let aggregate = [
                {
                    $match: baseQuery
                },
                {
                    $sort: {
                        'onlineStatus.isOnline': -1,
                        'onlineStatus.lastActive': 1
                    }
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                },
                {
                    $project: {
                        name: 1,
                        _id: 1,
                        email: 1,
                        'profileImage.url': 1,
                        gender: 1,
                        age: 1,
                        onlineStatus: 1
                    }
                }
            ];
            let users = yield user_1.User.aggregate(aggregate);
            // Get total count if requested
            let totalCount = undefined;
            if (shouldCount === 'yes') {
                totalCount = yield user_1.User.countDocuments(baseQuery).maxTimeMS(10000);
            }
            // Prepare pagination info
            let pagination = {
                currentPage: page,
                pageSize: limit,
            };
            if (totalCount !== undefined) {
                pagination = Object.assign(Object.assign({}, pagination), { totalPages: Math.ceil(totalCount / limit), totalUsers: totalCount });
            }
            res.set('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
            return res.status(200).json({
                success: true,
                data: {
                    users,
                    pagination,
                    searchCriteria: {
                        educationLevels: educationLevels ? educationLevels : allEducationLevels
                    },
                    allEducationLevels
                }
            });
        }
        catch (error) {
            console.error('Preferred education API error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.get('/users/preferred-location', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let userInfo = (0, search_controller_1.getUserDataFromRequest)(req);
            (typeof req.query.district_names === "string") && (req.query.district_names = [req.query.district_names]);
            const validationResult = search_schema_1.preferredLocationSearchSchema.safeParse(req.query);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid query parameters",
                    error: validationResult.error.errors,
                    data: null
                });
            }
            const { page, limit, count: shouldCount, district_names, latitude, longitude } = validationResult.data;
            // Calculate pagination
            const skip = (page - 1) * limit;
            let existingDistrict = yield user_1.User.distinct('address.district.name', {});
            let nearestDistrictNames = [];
            if (district_names === undefined) {
                nearestDistrictNames = existingDistrict.map((eDistrict) => {
                    return districts_1.Districts.find(element => element.name === eDistrict);
                })
                    .filter((district) => {
                    if (district)
                        return district;
                })
                    .map((district) => {
                    return (Object.assign(Object.assign({}, district), { distance: (0, search_controller_1.getDistance)(latitude, longitude, district === null || district === void 0 ? void 0 : district.lat, district === null || district === void 0 ? void 0 : district.long) }));
                })
                    .sort((a, b) => a.distance - b.distance)
                    .map((district) => district === null || district === void 0 ? void 0 : district.name);
            }
            // Base query for finding users
            const baseQuery = {
                gender: { $ne: userInfo.gender },
                'address.district.name': { $in: district_names ? district_names : nearestDistrictNames }
            };
            // Use aggregation to prioritize online users
            let aggregate = [
                {
                    $match: baseQuery
                },
                {
                    $sort: {
                        'onlineStatus.isOnline': -1,
                        'onlineStatus.lastActive': 1
                    }
                },
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        name: 1,
                        _id: 1,
                        email: 1,
                        'profileImage.url': 1,
                        gender: 1,
                        age: 1,
                        onlineStatus: 1
                    }
                }
            ];
            let users = yield user_1.User.aggregate(aggregate);
            // Get total count if requested
            let totalCount = undefined;
            if (shouldCount === 'yes') {
                totalCount = yield user_1.User.countDocuments(baseQuery).maxTimeMS(10000);
            }
            // Prepare pagination info
            let pagination = {
                currentPage: page,
                pageSize: limit,
            };
            if (totalCount !== undefined) {
                pagination = Object.assign(Object.assign({}, pagination), { totalPages: Math.ceil(totalCount / limit), totalUsers: totalCount });
            }
            res.set('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
            return res.status(200).json({
                success: true,
                data: {
                    users,
                    pagination,
                    searchCriteria: {
                        district_names: district_names ? district_names : nearestDistrictNames
                    }
                }
            });
        }
        catch (error) {
            console.error('Preferred location API error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.get('/users/matching/daily', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (req.profileType !== 'matrimony_profile' || !((_a = req.authSession) === null || _a === void 0 ? void 0 : _a.value)) {
                res.status(400).json({
                    success: false,
                    message: 'This Api is Only Availble for Matrimony Account Users',
                    data: null
                });
                return;
            }
            const validationResult = search_schema_1.todaysMatchSchema.safeParse(req.query);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid query parameters",
                    error: validationResult.error.errors,
                    data: null
                });
            }
            const { limit } = validationResult.data;
            let userData = req.authSession.value;
            if (!userData.address.lat || !userData.address.long) {
                return res.status(400).json({
                    success: false,
                    message: "Todays Match are only available for Bangladeshi Users",
                    data: null,
                });
            }
            let lat = userData.address.lat, long = userData.address.long;
            let nearestDistricts = (0, search_controller_1.findNearestDistricts)(lat, long, 7);
            const baseQuery = Object.assign({ 'address.country': country_names_enum_1.CountryNamesEnum.BANGLADESH, 'address.district.id': { $in: nearestDistricts.map(district => district.id) } }, (0, search_controller_1.getBaseSearchQuery)(req.authSession.value));
            let totalCount = yield user_1.User.countDocuments(baseQuery).maxTimeMS(5000);
            let skip = Math.floor(Math.random() * ((totalCount || limit) - limit));
            // Use aggregation to prioritize online users
            let aggregate = [
                { $match: baseQuery },
                { $sort: {
                        'onlineStatus.isOnline': -1,
                        'onlineStatus.lastActive': 1
                    } },
                { $skip: skip },
                { $limit: limit },
                { $project: {
                        name: 1,
                        _id: 1,
                        email: 1,
                        'profileImage.url': 1,
                        gender: 1,
                        age: 1,
                        onlineStatus: 1
                    } }
            ];
            let users = yield user_1.User.aggregate(aggregate);
            return res.status(200).json({
                success: true,
                data: { users }
            });
        }
        catch (error) {
            console.error(`daily match recommendation api error:`, error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.get('/users/matching/location', function (req, res) {
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
            let userId = req.authSession.value.userId;
            let userData = req.authSession.value;
            const validationResult = search_schema_1.paginationSchema.safeParse(req.query);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid query parameters",
                    error: validationResult.error.errors,
                    data: null
                });
            }
            const { page, limit, count: shouldCount } = validationResult.data;
            if (!userData.address.lat || !userData.address.long) {
                return res.status(400).json({
                    success: false,
                    message: "Matching Users are only available for Bangladeshi Users",
                    data: null,
                });
            }
            let lat = userData.address.lat, long = userData.address.long;
            let nearestDistricts = (0, search_controller_1.findNearestDistricts)(lat, long, 60);
            const skip = (page - 1) * limit;
            const baseQuery = Object.assign(Object.assign({}, (0, search_controller_1.getBaseSearchQuery)(userData)), { 'address.country': country_names_enum_1.CountryNamesEnum.BANGLADESH, 'address.district.id': { $in: nearestDistricts.map(district => district.id) } });
            // Use aggregation to prioritize online users
            let aggregate = [
                { $match: baseQuery },
                { $sort: {
                        'onlineStatus.isOnline': -1,
                        'onlineStatus.lastActive': 1
                    } },
                { $skip: skip },
                { $limit: limit },
                { $project: {
                        name: 1,
                        _id: 1,
                        email: 1,
                        'profileImage.url': 1,
                        gender: 1,
                        age: 1,
                        onlineStatus: 1,
                        enhancedSettings: 1
                    } }
            ];
            let users = yield user_1.User.aggregate(aggregate);
            let totalCount = undefined;
            if (shouldCount === 'yes') {
                totalCount = yield user_1.User.countDocuments(baseQuery).maxTimeMS(10000);
            }
            let pagination = {
                currentPage: page,
                pageSize: limit,
            };
            if (totalCount !== undefined) {
                pagination = Object.assign(Object.assign({}, pagination), { totalPages: Math.ceil(totalCount / limit), totalUsers: totalCount });
            }
            users = users.filter((user) => {
                if (!user.enhancedSettings.blocked.some((u) => u.userId === userId))
                    return user;
            });
            return res.status(200).json({
                success: false,
                data: {
                    districts: nearestDistricts.map(({ name, bn_name }) => ({ name, bn_name })),
                    pagination,
                    users,
                }
            });
        }
        catch (error) {
            console.error(`match suggestion api error:`, error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                data: null
            });
        }
    });
});
router.get('/users/mutual', function (req, res) {
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
            // Validate query parameters
            const validationResult = search_schema_1.paginationSchema.safeParse(req.query);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid query parameters",
                    error: validationResult.error.errors,
                    data: null
                });
            }
            const { page, limit, count: shouldCount } = validationResult.data;
            const userId = req.authSession.value.userId;
            // Get the current user's connections
            const currentUser = yield user_1.User.findById(userId, 'connections')
                .lean();
            if (!currentUser) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                    error: { code: 'USER_NOT_FOUND' },
                    data: null
                });
            }
            const baseQuery = {
                _id: {
                    $in: currentUser.connections
                },
                'suspension.isSuspended': false
            };
            // Calculate pagination
            const skip = (page - 1) * limit;
            // Use aggregation to prioritize online users
            let aggregate = [
                { $match: baseQuery },
                { $sort: {
                        'onlineStatus.isOnline': -1,
                        'onlineStatus.lastActive': 1
                    } },
                { $skip: skip },
                { $limit: limit },
                { $project: {
                        name: 1,
                        _id: 1,
                        email: 1,
                        'profileImage.url': 1,
                        gender: 1,
                        age: 1,
                        onlineStatus: 1
                    } }
            ];
            let users = yield user_1.User.aggregate(aggregate);
            // Get total count if requested
            let totalCount = undefined;
            if (shouldCount === 'yes') {
                totalCount = yield user_1.User.countDocuments(baseQuery)
                    .maxTimeMS(10000);
            }
            // Prepare pagination info
            let pagination = {
                currentPage: page,
                pageSize: limit,
            };
            if (totalCount !== undefined) {
                pagination = Object.assign(Object.assign({}, pagination), { totalPages: Math.ceil(totalCount / limit), totalUsers: totalCount });
            }
            // Set cache control headers
            res.set('Cache-Control', 'private, max-age=60'); // Cache for 1 minute, private because it's user-specific
            return res.status(200).json({
                success: true,
                data: {
                    users,
                    pagination
                }
            });
        }
        catch (error) {
            console.error('[Mutual Connections API Error]', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString()
            });
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: { code: 'INTERNAL_SERVER_ERROR' },
                data: null
            });
        }
    });
});
router.get('/users/viewed-not-contact', function (req, res) {
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
            // Validate query parameters
            const validationResult = search_schema_1.paginationSchema.safeParse(req.query);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid query parameters",
                    error: validationResult.error.errors,
                    data: null
                });
            }
            const { page, limit, count: shouldCount } = validationResult.data;
            const userId = req.authSession.value.userId;
            // Get IDs of users who viewed the profile
            const viewerIds = yield ProfileView_1.ProfileView.distinct('viewerId', {
                viewedId: userId
            });
            // Get IDs of users who sent connection requests
            const connectionRequestSenderIds = yield ConnectionRequest_1.ConnectionRequest.distinct('sender', {
                recipient: userId,
            });
            // Find viewers who haven't sent connection requests
            const baseQuery = {
                _id: {
                    $in: viewerIds,
                    $nin: [...connectionRequestSenderIds, userId] // Exclude users who sent requests and self
                },
                'suspension.isSuspended': false
            };
            // Calculate pagination
            const skip = (page - 1) * limit;
            // Use aggregation to prioritize online users and get view timestamps
            const viewerDetails = yield ProfileView_1.ProfileView.find({
                viewerId: { $in: viewerIds },
                viewedId: userId
            }, 'viewerId viewedAt')
                .sort({ viewedAt: -1 })
                .lean();
            const viewerIdsWithTimestamps = viewerDetails.map(v => v.viewerId.toString());
            // Use aggregation to prioritize online users
            let aggregate = [
                { $match: baseQuery },
                { $sort: {
                        'onlineStatus.isOnline': -1,
                        'onlineStatus.lastActive': 1
                    } },
                { $skip: skip },
                { $limit: limit },
                { $project: {
                        name: 1,
                        _id: 1,
                        email: 1,
                        'profileImage.url': 1,
                        gender: 1,
                        age: 1,
                        onlineStatus: 1
                    } }
            ];
            let users = yield user_1.User.aggregate(aggregate);
            // Get total count if requested
            let totalCount = undefined;
            if (shouldCount === 'yes') {
                totalCount = yield user_1.User.countDocuments(baseQuery)
                    .maxTimeMS(10000);
            }
            // Prepare pagination info
            let pagination = {
                currentPage: page,
                pageSize: limit,
            };
            if (totalCount !== undefined) {
                pagination = Object.assign(Object.assign({}, pagination), { totalPages: Math.ceil(totalCount / limit), totalUsers: totalCount });
            }
            // Enhance user objects with view timestamps
            let notContactedUsers = users.map(function (user) {
                const viewInfo = viewerDetails.find(v => v.viewerId.toString() === user._id.toString());
                if (viewInfo) {
                    return Object.assign(Object.assign({}, user), { viewedAt: viewInfo.viewedAt });
                }
                return user;
            });
            // Set cache headers
            res.set('Cache-Control', 'private, max-age=60'); // Cache for 1 minute, private because it's user-specific
            return res.status(200).json({
                success: true,
                data: {
                    users: notContactedUsers,
                    pagination
                }
            });
        }
        catch (error) {
            console.error('[Viewed Not Connected API Error]', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString()
            });
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: { code: 'INTERNAL_SERVER_ERROR' },
                data: null
            });
        }
    });
});
// ... (other imports remain unchanged)
router.get('/users/filter', function (req, res) {
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
            // Handle array parameters that might come as strings
            (typeof req.query.languages === "string") && (req.query.languages = [req.query.languages]);
            (typeof req.query.division_ids === "string") && (req.query.division_ids = [req.query.division_ids]);
            (typeof req.query.maritalStatuses === "string") && (req.query.maritalStatuses = [req.query.maritalStatuses]);
            (typeof req.query.occupations === "string") && (req.query.occupations = [req.query.occupations]);
            const queryResult = search_schema_1.filterUsersSchema.safeParse(req.query);
            if (!queryResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid query parameters",
                    errors: queryResult.error.errors,
                    data: null
                });
            }
            const validatedQuery = queryResult.data;
            const userData = req.authSession.value;
            // Destructure all query parameters
            const { page, limit, count: shouldCount, languages, division_ids, isEducated, minWeight, maxWeight, minHeight, maxHeight, minAge, maxAge, maritalStatuses, occupations, minAnnualIncome, maxAnnualIncome, } = validatedQuery;
            // 1. Build hard filters (must-match)
            const baseQuery = (0, search_controller_1.getBaseSearchQuery)(req.authSession.value);
            // Always hard-filter suspended users and self
            baseQuery["suspension.isSuspended"] = false;
            baseQuery["_id"] = { $ne: userData.userId };
            // 2. Build dynamic scoring formula for soft-matching
            let scoreAdd = [];
            if ((languages === null || languages === void 0 ? void 0 : languages.length) > 0) {
                scoreAdd.push({
                    $cond: [
                        { $gt: [{ $size: { $setIntersection: ["$languages", languages] } }, 0] },
                        1, 0
                    ]
                });
            }
            if ((division_ids === null || division_ids === void 0 ? void 0 : division_ids.length) > 0) {
                scoreAdd.push({
                    $cond: [
                        { $in: ["$address.division.id", division_ids] },
                        1, 0
                    ]
                });
            }
            if (isEducated !== undefined) {
                scoreAdd.push({
                    $cond: [
                        { $eq: ["$isEducated", isEducated] },
                        1, 0
                    ]
                });
            }
            if ((maritalStatuses === null || maritalStatuses === void 0 ? void 0 : maritalStatuses.length) > 0) {
                scoreAdd.push({
                    $cond: [
                        { $in: ["$maritalStatus", maritalStatuses] },
                        1, 0
                    ]
                });
            }
            if ((occupations === null || occupations === void 0 ? void 0 : occupations.length) > 0) {
                scoreAdd.push({
                    $cond: [
                        { $in: ["$occupation", occupations] },
                        1, 0
                    ]
                });
            }
            if (minWeight || maxWeight) {
                let min = minWeight || 30, max = maxWeight || 200;
                scoreAdd.push({
                    $cond: [
                        { $and: [
                                { $gte: ["$weight", min] },
                                { $lte: ["$weight", max] }
                            ] },
                        1, 0
                    ]
                });
            }
            if (minAge || maxAge) {
                let min = minAge || 18, max = maxAge || 70;
                scoreAdd.push({
                    $cond: [
                        { $and: [
                                { $gte: ["$age", min] },
                                { $lte: ["$age", max] }
                            ] },
                        1, 0
                    ]
                });
            }
            if (minHeight && maxHeight) {
                let heights = (0, search_controller_1.searchHeightGenerator)(minHeight, maxHeight);
                scoreAdd.push({
                    $cond: [
                        { $in: ["$height", heights] },
                        1, 0
                    ]
                });
            }
            if (minAnnualIncome || maxAnnualIncome) {
                let min = minAnnualIncome || 0, max = maxAnnualIncome || 1000000000;
                scoreAdd.push({
                    $cond: [
                        { $and: [
                                { $gte: ["$annualIncome.amount", min] },
                                { $lte: ["$annualIncome.amount", max] }
                            ] },
                        1, 0
                    ]
                });
            }
            // 3. Pagination
            const skip = (page - 1) * limit;
            // 4. Aggregation pipeline
            const aggregatePipeline = [
                { $match: baseQuery },
                {
                    $addFields: {
                        matchScore: { $add: scoreAdd }
                    }
                },
                {
                    $sort: {
                        matchScore: -1, // Most matched criteria first
                        "onlineStatus.isOnline": -1,
                        "onlineStatus.lastActive": 1
                    }
                },
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        name: 1,
                        _id: 1,
                        email: 1,
                        'profileImage.url': 1,
                        gender: 1,
                        age: 1,
                        onlineStatus: 1,
                        matchScore: 1
                    }
                }
            ];
            // 5. Query execution
            const users = yield user_1.User.aggregate(aggregatePipeline);
            // 6. Total count if needed
            let totalCount = undefined;
            if (shouldCount === 'yes') {
                totalCount = yield user_1.User.countDocuments(baseQuery).maxTimeMS(10000);
            }
            // 7. Prepare pagination info
            let pagination = {
                currentPage: page,
                pageSize: limit,
            };
            if (totalCount !== undefined) {
                pagination = Object.assign(Object.assign({}, pagination), { totalPages: Math.ceil(totalCount / limit), totalUsers: totalCount });
            }
            // 8. Set cache headers for better performance
            res.set('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
            return res.status(200).json({
                success: true,
                data: {
                    users,
                    pagination,
                    filterCriteria: {
                        languages,
                        division_ids,
                        isEducated,
                        weightRange: minWeight || maxWeight ? { min: minWeight, max: maxWeight } : undefined,
                        ageRange: minAge || maxAge ? { min: minAge, max: maxAge } : undefined,
                        heightRange: minHeight || maxHeight ? { min: minHeight, max: maxHeight } : undefined,
                        maritalStatuses,
                        occupations,
                        incomeRange: minAnnualIncome || maxAnnualIncome ? {
                            min: minAnnualIncome,
                            max: maxAnnualIncome,
                        } : undefined
                    }
                }
            });
        }
        catch (error) {
            console.error('Filter users API error:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                data: null
            });
        }
    });
});
router.get('/search-history', function (req, res) {
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
            const userId = req.authSession.value.userId;
            // Get search history
            const searchHistory = yield SearchHistory_1.SearchHistory.find({ userId, }, 'title query savedAt userId')
                .sort({ savedAt: -1 })
                .lean()
                .maxTimeMS(10000);
            if (searchHistory.length > 50) {
                for (let i = 0; i < searchHistory.length; i++) {
                    const { savedAt, _id } = searchHistory[i];
                    if (savedAt.getTime() < (Date.now() - 7 * 24 * 3600 * 1000))
                        yield SearchHistory_1.SearchHistory.findByIdAndDelete(_id);
                }
            }
            // Set cache headers
            res.set('Cache-Control', 'private, max-age=60'); // Cache for 1 minute, private because it's user-specific
            return res.status(200).json({
                success: true,
                data: {
                    searchHistory,
                }
            });
        }
        catch (error) {
            console.error('[Get Search History API Error]', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
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
router.post('/search-history', function (req, res) {
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
            // Validate request body
            const validationResult = search_schema_1.searchHistorySchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid request parameters",
                    error: 'VALIDATION_ERROR',
                    errors: validationResult.error.errors,
                    data: null
                });
            }
            const { searchQuery, title } = validationResult.data;
            const userId = req.authSession.value.userId;
            // Check if title already exists for this user
            const isHistoryExists = yield SearchHistory_1.SearchHistory.findOne({ userId, title }, '_id').lean();
            if (isHistoryExists) {
                return res.status(409).json({
                    success: false,
                    message: 'A search history with this title already exists',
                    error: 'DUPLICATE_TITLE',
                    data: null
                });
            }
            // Create new search history
            const newSearchHistory = yield SearchHistory_1.SearchHistory.create({
                title,
                userId,
                searchQuery,
                savedAt: new Date()
            });
            // Return success response
            return res.status(201).json({
                success: true,
                data: {
                    id: newSearchHistory._id,
                    title: newSearchHistory.title,
                    createdAt: newSearchHistory.savedAt
                },
                error: null,
                message: 'Search history saved successfully'
            });
        }
        catch (error) {
            console.error('[Save search history API error]', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString(),
                userId: (_c = (_b = req.authSession) === null || _b === void 0 ? void 0 : _b.value) === null || _c === void 0 ? void 0 : _c.userId
            });
            return res.status(500).json({
                success: false,
                message: 'An error occurred while saving search history',
                error: 'INTERNAL_SERVER_ERROR',
                data: null
            });
        }
    });
});
router.delete('/search-history/:id', function (req, res) {
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
            // Validate ID parameter
            const historyId = schemaComponents_1._idValidator.parse(req.params.id);
            const userId = req.authSession.value.userId;
            // Find and delete the search history
            const searchHistory = yield SearchHistory_1.SearchHistory.findById(historyId);
            if (!searchHistory) {
                return res.status(404).json({
                    success: false,
                    message: 'Search history not found or you do not have permission to delete it',
                    error: 'NOT_FOUND',
                    data: null
                });
            }
            yield searchHistory.deleteOne();
            return res.status(200).json({
                success: true,
                data: {
                    id: historyId,
                    deletedAt: new Date()
                },
                error: null,
                message: 'Search history deleted successfully'
            });
        }
        catch (error) {
            // Handle validation errors
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid search history ID',
                    error: 'INVALID_ID',
                    errors: error.errors,
                    data: null
                });
            }
            console.error('[Delete search history API error]', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString(),
                userId: (_c = (_b = req.authSession) === null || _b === void 0 ? void 0 : _b.value) === null || _c === void 0 ? void 0 : _c.userId,
                historyId: req.params.id
            });
            return res.status(500).json({
                success: false,
                message: 'An error occurred while deleting search history',
                error: 'INTERNAL_SERVER_ERROR',
                data: null
            });
        }
    });
});
router.get('/users/suggested-for-you', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        try {
            if (!req.authSession || !((_a = req.authSession) === null || _a === void 0 ? void 0 : _a.value)) {
                res.status(401).json({
                    success: false,
                    message: 'Failed to authorize the user',
                    data: null
                });
                return;
            }
            const validationResult = search_schema_1.paginationSchema.safeParse(req.query);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid query parameters",
                    error: validationResult.error.errors,
                    data: null
                });
            }
            const { page, limit, count: shouldCount } = validationResult.data;
            const userData = req.authSession.value;
            // Get current user's partner preferences and gender
            const currentUser = yield user_1.User.findById(userData.userId, 'partnerPreference gender').lean();
            if (!currentUser)
                throw new Error("currentUser is null");
            if (!(currentUser === null || currentUser === void 0 ? void 0 : currentUser.partnerPreference)) {
                // If no preferences exist, create them automatically
                const userForPrefs = yield user_1.User.findById(userData.userId);
                if (userForPrefs) {
                    userForPrefs.createPreference();
                    yield userForPrefs.save();
                    currentUser.partnerPreference = userForPrefs.partnerPreference;
                }
                else {
                    return res.status(404).json({
                        success: false,
                        message: "User not found",
                        data: null
                    });
                }
            }
            // Build base query including base search criteria
            const baseQuery = Object.assign({}, (0, search_controller_1.getBaseSearchQuery)(userData));
            const pref = currentUser.partnerPreference;
            // Add age preferences
            if (((_b = pref.ageRange) === null || _b === void 0 ? void 0 : _b.min) || ((_c = pref.ageRange) === null || _c === void 0 ? void 0 : _c.max)) {
                baseQuery.age = {};
                if (pref.ageRange.min)
                    baseQuery.age.$gte = pref.ageRange.min;
                if (pref.ageRange.max)
                    baseQuery.age.$lte = pref.ageRange.max;
            }
            // Add height preferences with proper validation
            if (((_d = pref.heightRange) === null || _d === void 0 ? void 0 : _d.min) && ((_e = pref.heightRange) === null || _e === void 0 ? void 0 : _e.max)) {
                baseQuery.height = {
                    $in: (0, search_controller_1.searchHeightGenerator)(pref.heightRange.min, pref.heightRange.max)
                };
            }
            // Add religion preferences
            if (((_f = pref.religion) === null || _f === void 0 ? void 0 : _f.length) > 0) {
                baseQuery.religion = { $in: pref.religion };
            }
            // Add marital status preferences
            if (((_g = pref.maritalStatus) === null || _g === void 0 ? void 0 : _g.length) > 0) {
                baseQuery.maritalStatus = { $in: pref.maritalStatus };
            }
            // Add education preferences with null handling
            if ((_h = pref.education) === null || _h === void 0 ? void 0 : _h.minimumLevel) {
                const educationLevels = Object.values(userEducation_types_1.EducationLevel);
                const minLevelIndex = educationLevels.indexOf(pref.education.minimumLevel);
                if (minLevelIndex !== -1) {
                    const acceptableLevels = educationLevels.slice(minLevelIndex);
                    baseQuery['education.level'] = { $in: acceptableLevels };
                    baseQuery['isEducated'] = true;
                }
            }
            // Add occupation preferences
            if (!!((_k = (_j = pref.profession) === null || _j === void 0 ? void 0 : _j.acceptedOccupations) === null || _k === void 0 ? void 0 : _k.length) && ((_m = (_l = pref.profession) === null || _l === void 0 ? void 0 : _l.acceptedOccupations) === null || _m === void 0 ? void 0 : _m.length) > 0) {
                baseQuery.occupation = { $in: pref.profession.acceptedOccupations };
            }
            // Add income preferences with currency matching
            if ((_o = pref.profession) === null || _o === void 0 ? void 0 : _o.minimumAnnualIncome) {
                baseQuery['annualIncome.amount'] = {
                    $gte: pref.profession.minimumAnnualIncome.min
                };
            }
            // Calculate pagination
            const skip = (page - 1) * limit;
            // let users = await User.aggregate([
            //     {
            //         $match : baseQuery,
            //     },
            //     {
            //         $sort : {
            //              createdAt : -1 ,
            //             "onlineStatus.isOnline" : 1,
            //             "onlineStatus.lastActive" : -1 
            //         }
            //     },
            //     {
            //         $skip :skip
            //     }, 
            //     {
            //         $limit : limit
            //     }, 
            //     {
            //         $project: {
            //             name: 1,
            //             _id: 1,
            //             email: 1,
            //             'profileImage.url': 1,
            //             gender: 1,
            //             age: 1,
            //             onlineStatus: 1
            //         }
            //     }
            // ]);
            let users = yield user_1.User.find(baseQuery, userField)
                .sort({
                createdAt: -1,
                "onlineStatus.isOnline": 1,
                "onlineStatus.lastActive": -1
            })
                .skip(skip)
                .limit(limit)
                .lean();
            // Get total count if requested
            let totalCount = undefined;
            if (shouldCount === 'yes') {
                totalCount = yield user_1.User.countDocuments(baseQuery)
                    .maxTimeMS(10000);
            }
            // Prepare pagination info
            let pagination = {
                currentPage: page,
                pageSize: limit,
            };
            if (totalCount !== undefined) {
                pagination = Object.assign(Object.assign({}, pagination), { totalPages: Math.ceil(totalCount / limit), totalUsers: totalCount });
            }
            // Cache control - short cache due to frequent updates
            res.set('Cache-Control', 'private, max-age=60');
            return res.status(200).json({
                success: true,
                data: {
                    users,
                    pagination,
                    searchCritiria: baseQuery
                },
                message: 'SUGGESTED_USERS_FOUND'
            });
        }
        catch (error) {
            console.error('[Suggested For You API error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
// router.get('/users/not-viewed', 
// async function (req: Request, res: Response): Promise<Response | any> {
//  try {
//         const validationResult = paginationSchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const { page, limit, count: shouldCount, } = validationResult.data;
//         const userData = req.authSession.value;
//         // Get IDs of profiles already viewed by the user
//         const viewedProfileIds = await ProfileView.distinct('viewedId', {
//             viewerId: userData.userId
//         });
//         const baseQuery: any = {
//             ...getBaseSearchQuery(req.authSession.value),
//             'address.country': userData.address.country,
//             _id: {
//                 $nin: [...viewedProfileIds, userData.userId]
//             },
//         };
//         // Calculate pagination
//         const skip = (page - 1) * limit;
//         // Find users with pagination
//         let users = await User.find(baseQuery, userField)
//             .skip(skip)
//             .limit(limit)
//             .lean()
//             .maxTimeMS(20000);
//         // Get total count if requested
//         let totalCount: number | undefined = undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
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
//                 totalUsers: totalCount
//             };
//         }
//         res.set("cache-control", "max-age=60, public");
//         return res.status(200).json({
//             success: true,
//             data: {
//                 users,
//                 pagination,
//             }
//         });
//     } catch (error) {
//         console.error(`unviewed profile listing api error:`, error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
// router.get('/users/others-viewed-my-profile', async function (req: Request, res: Response): Promise<Response | any> {
//     try {
//         const userData = req.authSession.value;
//         // Get IDs of profiles already viewed by the user
//         const viewedMyProfileIds = (
//             await ProfileView.find({}, 'viewerId')
//                 .where('viewedId').equals(userData.userId)
//                 .where('viewerId').ne(userData.userId)
//                 .lean()
//         )
//             .map(el => el.viewerId);
//         const baseQuery: any = {
//             _id: {
//                 $in: viewedMyProfileIds // Exclude viewed profiles
//             },
//             'suspension.isSuspended': false,
//         };
//         // Find users with pagination
//         let users = await User.find(baseQuery, userField)
//             .lean()
//             .maxTimeMS(20000);
//         res.set("cache-control", "max-age=60, public");
//         return res.status(200).json({
//             success: true,
//             data: {
//                 users,
//             }
//         });
//     } catch (error) {
//         console.error(`others viewed Your Profile api error:`, error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
// // Complete the shortlist APIs in search.ts
// router.get('/users/my-shortlist', async function (req: Request, res: Response): Promise<Response | any> {
//     try {
//         // Validate query parameters
//         const validationResult = paginationSchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const { page, limit, count: shouldCount } = validationResult.data;
//         const userId = req.authSession.value.userId;
//         // Get shortlisted user IDs
//         let shortlistedIds = await ShortList.distinct('shortListedId', {
//             shortListerId: userId
//         });
//         // Base query
//         const baseQuery = {
//             _id: {
//                 $in: shortlistedIds,
//             },
//             'suspension.isSuspended': false,
//         };
//         // Calculate pagination
//         const skip = (page - 1) * limit;
//         // Find users with pagination
//         let users = await User.find(baseQuery, userField)
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(limit)
//             .lean()
//             .maxTimeMS(20000);
//         // Get total count if requested
//         let totalCount: number | undefined = undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
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
//                 totalUsers: totalCount
//             };
//         }
//         // Set cache headers
//         res.set('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
//         return res.status(200).json({
//             success: true,
//             data: {
//                 users,
//                 pagination
//             }
//         });
//     } catch (error) {
//         console.error('[Shortlist search api error]', {
//             error: error instanceof Error ? error.message : 'Unknown error',
//             stack: error instanceof Error ? error.stack : undefined,
//             timestamp: new Date().toISOString()
//         });
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
// router.get('/users/others-shortlisted-me', async function (req: Request, res: Response): Promise<Response | any> {
//     try {
//         // Validate query parameters
//         const validationResult = paginationSchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const { page, limit, count: shouldCount } = validationResult.data;
//         const userId = req.authSession.value.userId;
//         // Get IDs of users who shortlisted the current user
//         let shortlistedByIds = await ShortList.distinct('shortListerId', {
//             shortListedId: userId
//         });
//         // Base query for finding users
//         const baseQuery = {
//             _id: {
//                 $in: shortlistedByIds,
//             },
//             'suspension.isSuspended': false,
//         };
//         // Calculate pagination
//         const skip = (page - 1) * limit;
//         // Find users with pagination
//         let users = await User.find(baseQuery, userField)
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(limit)
//             .lean()
//             .maxTimeMS(20000);
//         // Get total count if requested
//         let totalCount: number | undefined = undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
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
//                 totalUsers: totalCount
//             };
//         }
//         // Set cache headers
//         res.set('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
//         return res.status(200).json({
//             success: true,
//             data: {
//                 users,
//                 pagination
//             }
//         });
//     } catch (error) {
//         console.error('[Others shortlisted me api error]', {
//             error: error instanceof Error ? error.message : 'Unknown error',
//             stack: error instanceof Error ? error.stack : undefined,
//             timestamp: new Date().toISOString()
//         });
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
// router.get('/users/preferred-occupation', async function (req: Request, res: Response): Promise<Response | any> {
//     try {
//         Array.isArray(req.query.occupations) === false && (req.query.occupations = [req.query.occupations || Occupation.DOCTOR]);
//         // Validate query parameters
//         const validationResult = preferredOccupationSearchSchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const {
//             page,
//             limit,
//             count: shouldCount,
//             occupations
//         } = validationResult.data;
//         const userData = req.authSession.value;
//         // Calculate pagination
//         const skip = (page - 1) * limit;
//         // Construct base query with occupation filter
//         const baseQuery = {
//             ...getBaseSearchQuery(req.authSession.value),
//             occupation: { $in: occupations }
//         };
//         // Find matching users with occupation details
//         const users = await User.find(baseQuery, userField)
//             .skip(skip)
//             .limit(limit)
//             .lean();
//         // Get total count if requested
//         let totalCount: number | undefined = undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
//         }
//         // Get occupation distribution for analytics
//         const occupationDistribution = await User.find(baseQuery, userField);
//         // Prepare pagination info
//         let pagination: object = {
//             currentPage: page,
//             pageSize: limit,
//         };
//         if (totalCount !== undefined) {
//             pagination = {
//                 ...pagination,
//                 totalPages: Math.ceil(totalCount / limit),
//                 totalUsers: totalCount
//             };
//         }
//         // Set cache control header for 1 minute
//         // Short cache time because occupation data might change frequently
//         res.set('Cache-Control', 'public, max-age=60');
//         return res.status(200).json({
//             success: true,
//             data: {
//                 users,
//                 pagination,
//             }
//         });
//     } catch (error) {
//         // Log the error with request details for debugging
//         console.error('Preferred occupation API error:', {
//             error,
//             query: req.query,
//             userId: req.authSession?.value?.userId
//         });
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
// router.get('/users/viewed-profiles', async function (req: Request, res: Response): Promise<Response | any> {
//     try {
//         const validationResult = paginationSchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const { page, limit, count: shouldCount, } = validationResult.data;
//         const userData = req.authSession.value;
//         // Get IDs of profiles already viewed by the user
//         const viewedProfileIds = await ProfileView.distinct('viewedId', {
//             viewerId: userData.userId
//         });
//         const baseQuery: any = {
//             _id: {
//                 $ne: userData.userId,  // Exclude current user
//                 $in: viewedProfileIds // Exclude viewed profiles
//             },
//             'suspension.isSuspended': false,
//         };
//         // Calculate pagination
//         const skip = (page - 1) * limit;
//         // Find users with pagination
//         let users = await User.find(baseQuery, userField)
//             .skip(skip)
//             .limit(limit)
//             .lean()
//             .maxTimeMS(20000);
//         // Get total count if requested
//         let totalCount: number | undefined = undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
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
//                 totalUsers: totalCount
//             };
//         }
//         res.set("cache-control", "max-age=60, public");
//         return res.status(200).json({
//             success: true,
//             data: {
//                 users,
//                 pagination,
//             }
//         });
//     } catch (error) {
//         console.error('[Viewed Profile search api error]', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
// router.get('/users/viewed-my-profile', async function (req: Request, res: Response): Promise<Response | any> {
//     try {
//         const validationResult = paginationSchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const { page, limit, count: shouldCount, } = validationResult.data;
//         const userData = req.authSession.value;
//         // Get IDs of profiles already viewed by the user
//         const viewedProfileIds = await ProfileView.distinct('viewerId', {
//             viewedId: userData.userId
//         });
//         const baseQuery: any = {
//             ...getBaseSearchQuery(req.authSession.value),
//             'address.country': userData.address.country,
//             _id: {
//                 $ne: userData.userId,  // Exclude current user
//                 $in: viewedProfileIds // Exclude viewed profiles
//             },
//         };
//         // Calculate pagination
//         const skip = (page - 1) * limit;
//         // Find users with pagination
//         let users = await User.find(baseQuery, userField)
//             .skip(skip)
//             .limit(limit)
//             .lean()
//             .maxTimeMS(20000);
//         // Get total count if requested
//         let totalCount: number | undefined = undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
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
//                 totalUsers: totalCount
//             };
//         }
//         res.set("cache-control", "max-age=60, public");
//         return res.status(200).json({
//             success: true,
//             data: {
//                 users,
//                 pagination,
//             }
//         });
//     } catch (error) {
//         console.error('[Viewed My Profiles]', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
// // Implement /users/liked-by-me - Get profiles that the current user has liked
// router.get('/users/liked-by-me', async function (req: Request, res: Response): Promise<Response | any> {
//     try {
//         const validationResult = paginationSchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const { page, limit, count: shouldCount } = validationResult.data;
//         const userData = req.authSession.value;
//         // Get IDs of profiles liked by the current user
//         const likedProfileIds = await LikedProfile.distinct('likedId', {
//             likerId: userData.userId
//         });
//         const baseQuery = {
//             _id: {
//                 $in: likedProfileIds
//             },
//             'suspension.isSuspended': false,
//         };
//         // Calculate pagination
//         const skip = (page - 1) * limit;
//         // Find users with pagination
//         let users = await User.find(baseQuery, userField)
//             .skip(skip)
//             .limit(limit)
//             .lean()
//             .maxTimeMS(20000);
//         // Get total count if requested
//         let totalCount: number | undefined = undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
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
//                 totalUsers: totalCount
//             };
//         }
//         res.set("cache-control", "max-age=60, public");
//         return res.status(200).json({
//             success: true,
//             data: {
//                 users,
//                 pagination,
//             }
//         });
//     } catch (error) {
//         console.error('[Liked by me profiles API error]', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
// // Implement /users/liked-me - Get profiles that have liked the current user
// router.get('/users/liked-me', async function (req: Request, res: Response): Promise<Response | any> {
//     try {
//         const validationResult = paginationSchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const { page, limit, count: shouldCount } = validationResult.data;
//         const userData = req.authSession.value;
//         // Get IDs of users who liked the current user
//         const likedByIds = await LikedProfile.distinct('likerId', {
//             likedId: userData.userId
//         });
//         const baseQuery = {
//             _id: {
//                 $in: likedByIds
//             },
//             'suspension.isSuspended': false,
//         };
//         const skip = (page - 1) * limit;
//         let users = await User.find(baseQuery, userField)
//             .skip(skip)
//             .limit(limit)
//             .lean()
//             .maxTimeMS(20000);
//         let totalCount: number | undefined = undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
//         }
//         let pagination: object = {
//             currentPage: page,
//             pageSize: limit,
//         };
//         if (totalCount !== undefined) {
//             pagination = {
//                 ...pagination,
//                 totalPages: Math.ceil(totalCount / limit),
//                 totalUsers: totalCount
//             };
//         }
//         res.set("cache-control", "max-age=60, public");
//         return res.status(200).json({
//             success: true,
//             data: {
//                 users,
//                 pagination,
//             }
//         });
//     } catch (error) {
//         console.error('[Liked me profiles API error]', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
// // Implement /users/send-mails-by-me - Get profiles to whom current user has sent emails
// router.get('/users/send-mails-by-me', async function (req: Request, res: Response): Promise<Response | any> {
//     try {
//         const validationResult = paginationSchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const { page, limit, count: shouldCount } = validationResult.data;
//         const userData = req.authSession.value;
//         // Get IDs of users who received emails from current user
//         const emailedProfileIds = await SendMailedProfile.distinct('receiverId', {
//             senderId: userData.userId,
//             emailStatus: 'SENT'
//         });
//         const baseQuery = {
//             _id: {
//                 $in: emailedProfileIds
//             },
//             'suspension.isSuspended': false,
//         };
//         const skip = (page - 1) * limit;
//         let users = await User.find(baseQuery, userField)
//             .skip(skip)
//             .limit(limit)
//             .lean()
//             .maxTimeMS(20000);
//         let totalCount: number | undefined = undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
//         }
//         let pagination: object = {
//             currentPage: page,
//             pageSize: limit,
//         };
//         if (totalCount !== undefined) {
//             pagination = {
//                 ...pagination,
//                 totalPages: Math.ceil(totalCount / limit),
//                 totalUsers: totalCount
//             };
//         }
//         res.set("cache-control", "max-age=60, public");
//         return res.status(200).json({
//             success: true,
//             data: {
//                 users,
//                 pagination,
//             }
//         });
//     } catch (error) {
//         console.error('[Emails sent by me API error]', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
// // Implement /users/send-mails-to-me - Get profiles who have sent emails to current user
// router.get('/users/send-mails-to-me', async function (req: Request, res: Response): Promise<Response | any> {
//     try {
//         const validationResult = paginationSchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const { page, limit, count: shouldCount } = validationResult.data;
//         const userData = req.authSession.value;
//         // Get IDs of users who sent emails to current user
//         const emailSenderIds = await SendMailedProfile.distinct('senderId', {
//             receiverId: userData.userId,
//             emailStatus: 'SENT'
//         });
//         const baseQuery = {
//             _id: {
//                 $in: emailSenderIds
//             },
//             'suspension.isSuspended': false,
//         };
//         const skip = (page - 1) * limit;
//         let users = await User.find(baseQuery, userField)
//             .skip(skip)
//             .limit(limit)
//             .lean()
//             .maxTimeMS(20000);
//         let totalCount: number | undefined = undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
//         }
//         let pagination: object = {
//             currentPage: page,
//             pageSize: limit,
//         };
//         if (totalCount !== undefined) {
//             pagination = {
//                 ...pagination,
//                 totalPages: Math.ceil(totalCount / limit),
//                 totalUsers: totalCount
//             };
//         }
//         res.set("cache-control", "max-age=60, public");
//         return res.status(200).json({
//             success: true,
//             data: {
//                 users,
//                 pagination,
//             }
//         });
//     } catch (error) {
//         console.error('[Emails sent to me API error]', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
// // Implement /users/send-sms-by-me - Get profiles to whom current user has sent SMS
// router.get('/users/send-sms-by-me', async function (req: Request, res: Response): Promise<Response | any> {
//     try {
//         const validationResult = paginationSchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const { page, limit, count: shouldCount } = validationResult.data;
//         const userData = req.authSession.value;
//         // Get IDs of users who received SMS from current user
//         const smsReceiverIds = await SmsSendedProfile.distinct('receiverId', {
//             senderId: userData.userId,
//             smsStatus: 'SENT'
//         });
//         const baseQuery = {
//             _id: {
//                 $in: smsReceiverIds
//             },
//             'suspension.isSuspended': false,
//         };
//         const skip = (page - 1) * limit;
//         let users = await User.find(baseQuery, userField)
//             .skip(skip)
//             .limit(limit)
//             .lean()
//             .maxTimeMS(20000);
//         let totalCount: number | undefined = undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
//         }
//         let pagination: object = {
//             currentPage: page,
//             pageSize: limit,
//         };
//         if (totalCount !== undefined) {
//             pagination = {
//                 ...pagination,
//                 totalPages: Math.ceil(totalCount / limit),
//                 totalUsers: totalCount
//             };
//         }
//         res.set("cache-control", "max-age=60, public");
//         return res.status(200).json({
//             success: true,
//             data: {
//                 users,
//                 pagination,
//             }
//         });
//     } catch (error) {
//         console.error('[SMS sent by me API error]', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
// // Implement /users/send-sms-to-me - Get profiles who have sent SMS to current user
// router.get('/users/send-sms-to-me', async function (req: Request, res: Response): Promise<Response | any> {
//     try {
//         const validationResult = paginationSchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const { page, limit, count: shouldCount } = validationResult.data;
//         const userData = req.authSession.value;
//         // Get IDs of users who sent SMS to current user
//         const smsSenderIds = await SmsSendedProfile.distinct('senderId', {
//             receiverId: userData.userId,
//             smsStatus: 'SENT'
//         });
//         const baseQuery = {
//             _id: {
//                 $in: smsSenderIds
//             },
//             'suspension.isSuspended': false,
//         };
//         const skip = (page - 1) * limit;
//         let users = await User.find(baseQuery, userField)
//             .skip(skip)
//             .limit(limit)
//             .lean()
//             .maxTimeMS(20000);
//         let totalCount: number | undefined = undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
//         }
//         let pagination: object = {
//             currentPage: page,
//             pageSize: limit,
//         };
//         if (totalCount !== undefined) {
//             pagination = {
//                 ...pagination,
//                 totalPages: Math.ceil(totalCount / limit),
//                 totalUsers: totalCount
//             };
//         }
//         res.set("cache-control", "max-age=60, public");
//         return res.status(200).json({
//             success: true,
//             data: {
//                 users,
//                 pagination,
//             }
//         });
//     } catch (error) {
//         console.error('[SMS sent to me API error]', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
// // Implement /users/send-sms-to-me - Get profiles who have sent SMS to current user
// router.get('/users/seen-phone-details', async function (req: Request, res: Response): Promise<Response | any> {
//     try {
//         const validationResult = paginationSchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const { page, limit, count: shouldCount } = validationResult.data;
//         const userData = req.authSession.value;
//         // Get IDs of users who sent SMS to current user
//         const requestedIds = await RequestMobileNumberView.distinct('requestedId', {
//             requesterId: userData.userId,
//         });
//         const baseQuery = {
//             _id: {
//                 $in: requestedIds
//             },
//             'suspension.isSuspended': false,
//         };
//         const skip = (page - 1) * limit;
//         let users = await User.find(baseQuery, userField)
//             .skip(skip)
//             .limit(limit)
//             .lean()
//             .maxTimeMS(20000);
//         let totalCount: number | undefined = undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
//         }
//         let pagination: object = {
//             currentPage: page,
//             pageSize: limit,
//         };
//         if (totalCount !== undefined) {
//             pagination = {
//                 ...pagination,
//                 totalPages: Math.ceil(totalCount / limit),
//                 totalUsers: totalCount
//             };
//         }
//         res.set("cache-control", "max-age=60, public");
//         return res.status(200).json({
//             success: true,
//             data: {
//                 users,
//                 pagination,
//             }
//         });
//     } catch (error) {
//         console.error('[SMS sent to me API error]', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
// router.get('/users/seen-my-phone-details', async function (req: Request, res: Response): Promise<Response | any> {
//     try {
//         const validationResult = paginationSchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const { page, limit, count: shouldCount } = validationResult.data;
//         const skip = (page - 1) * limit;
//         // Get IDs of users who sent SMS to current user
//         let requesters = await RequestMobileNumberView.find({
//             requestedId: req.authSession.value.userId,
//         }, 'requesterId')
//             .skip(skip)
//             .limit(limit)
//             .lean();
//         let requestersIds = requesters.map(element => element.requesterId);
//         const baseQuery = {
//             _id: {
//                 $in: requestersIds
//             },
//             'suspension.isSuspended': false,
//         };
//         let users = await User.find(baseQuery, userField)
//             .lean()
//             .maxTimeMS(20000);
//         let totalCount: number | undefined = undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await RequestMobileNumberView.find({
//                 requestedId: req.authSession.value.userId,
//             }, '')
//                 .countDocuments(baseQuery)
//                 .maxTimeMS(10000);
//         }
//         let pagination: object = {
//             currentPage: page,
//             pageSize: limit,
//         };
//         if (totalCount !== undefined) {
//             pagination = {
//                 ...pagination,
//                 totalPages: Math.ceil(totalCount / limit),
//                 totalUsers: totalCount
//             };
//         }
//         res.set("cache-control", "max-age=60, public");
//         return res.status(200).json({
//             success: true,
//             data: {
//                 users,
//                 pagination,
//             }
//         });
//     } catch (error) {
//         console.error('[SMS sent to me API error]', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             data: null
//         });
//     }
// });
exports.default = router;
