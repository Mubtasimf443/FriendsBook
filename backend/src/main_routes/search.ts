/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Router, Request, Response, RequestHandler, NextFunction, } from "express";
import rateLimiter from "../config/rateRimiter";
import { validateBothProfiledUser, validateUser } from "../lib/middlewares/auth.middleware";
import { IAuthSession } from "../models/AuthSession";
import { CountryNamesEnum } from "../lib/types/country_names.enum";
import { findNearestDistricts, getBaseSearchQuery, getDistance, getUserDataFromRequest, getUserWithCountryFlagsEmoji, searchHeightGenerator, shuffleArray } from "../controllers/search.controller";
import { User } from "../models/user";
import { FilterUsersQueryParams, filterUsersSchema, getUserByMIDSchema, justJoinedSchema, preferredEducationSearchSchema, preferredLocationSearchSchema, preferredOccupationSearchSchema, paginationSchema, todaysMatchSchema, searchHistorySchema, exploreByCountrySchema, exploreByDivisionSchema } from "../lib/schema/search.schema";
import { IProfileView, ProfileView } from "../models/ProfileView";
import queryMiddleware from "../lib/middlewares/query.middleware";
import { EducationLevel } from "../lib/types/userEducation.types";
import { IUser, Occupation } from "../lib/types/user.types";
import { ShortList } from "../models/ShortListedProfiles";
import { SearchHistory } from "../models/SearchHistory";
import { _idValidator, limitValidation } from "../lib/schema/schemaComponents";
import { z, ZodError } from "zod";
import { SmsSendedProfile } from "../models/SmsSendedProfile";
import { SendMailedProfile } from "../models/SendMailedProfile";
import { LikedProfile } from "../models/LikedProfile";
import { RequestMobileNumberView } from "../models/RequestMobileNumberView";
import { ConnectionRequest } from "../models/ConnectionRequest";
import { log } from "console";
import { UserRecord } from "firebase-admin/lib/auth/user-record";
import { randomDataFromArray } from "../lib/core/randomInt";
import { calculateDistance, countryCoordinates, getCountriesNearby } from "../lib/data/countryWithLatLong";
import countryNames from "../lib/data/countryNames";
import VideoProfile, { IVideoProfile } from "../models/VideoProfile";
import '../lib/types/express.decratation';
import { Districts } from "../lib/data/districts";


const router: Router = Router();

router.use(rateLimiter(120 * 1000, 200));
router.use(queryMiddleware)
router.use(validateBothProfiledUser);



router.get('/users/explore/country',
    async function (req: Request, res: Response): Promise<any> {
        try {
           
            const getOnlineUsersSchema = z.object({
                country: z.nativeEnum(CountryNamesEnum).optional(),
                page: z.string().regex(/^\d+$/).transform(Number).pipe(
                    z.number().min(1).max(100)
                ).optional().default('1'),
                limit: z.string().regex(/^\d+$/).transform(Number).pipe(
                    z.number().min(1).max(50)
                ).optional().default('20'),
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
            const baseQuery: any = {
                
            };

            // Handle country filtering
            if (country && country.toLowerCase() !== 'any') {
                baseQuery['location.country'] = country;
            }

            // Get list of all unique countries where users have signed up
            let userCountries: any[] = [];
            if (!country || country.toLowerCase() === 'any') {
                userCountries = await VideoProfile.distinct('location.country');
            }

            // Fetch users with sorting by online status
            const aggregationPipeline: any = [
                { $match: baseQuery },
                {
                    $addFields: {
                        onlineSortOrder: {
                            $cond: [
                                { $eq: ["$status", "online"] },
                                0,  // Online users first
                                1   // Offline users second
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

            const [users, totalCount] = await Promise.all([
                VideoProfile.aggregate(aggregationPipeline),
                VideoProfile.countDocuments(baseQuery)
            ]);

            // Prepare response data
            const responseData: any = {
                success: true,
                data: {
                    users: getUserWithCountryFlagsEmoji(users),
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
                responseData.data.countries =shuffleArray( userCountries);
            } else {
                responseData.data.country = country;
            }

            // Set cache control headers
            res.set('Cache-Control', 'public, max-age=30'); // Cache for 30 seconds since this is real-time data

            return res.status(200).json(responseData);

        } catch (error) {
            console.error('[Online Users API Error]:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    }
);

router.get('/users/explore/country/near-by-me',async function (req: Request, res: Response): Promise<any> {
    try {
        const getOnlineUsersSchema = z.object({
            country_count: z.string()
                .regex(/^\d+$/)
                .transform(Number)
                .pipe(z.number().min(1).max(countryCoordinates.length - 1))
                .optional()
                .default('50'),
            page: z.string()
                .regex(/^\d+$/)
                .transform(Number)
                .pipe(z.number().min(1).max(100))
                .optional()
                .default('1'),
            limit: limitValidation,
            latitude: z.string()
            .transform(Number)
            .refine((val) => !isNaN(val), { // Add validation after transform
              message: "Latitude must be a valid number",
            })
            .refine((val) => val >= -90 && val <= 90, {
              message: "Latitude must be between -90 and 90",
            }),
          longitude: z.string()
            .transform(Number)
            .refine((val) => !isNaN(val), { // Add validation after transform
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
        const baseQuery: any = {};

        // Get coordinates - either from request or from user's country
         let  userLat = latitude;
         let  userLong = longitude;
       
        // Find nearby countries based on coordinates
        let nearbyCountries = countryCoordinates
            .map(({ name, latitude, longitude }) => ({
                name,
                distance: getDistance(userLat, userLong, latitude, longitude)
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, country_count)
            .map(el => el.name);

        baseQuery['location.country'] = { $in: nearbyCountries };

        // Build aggregation pipeline
        let aggregate: any = [];

        aggregate.push({ $match: baseQuery });
        aggregate.push(
            {
                $addFields: {
                    onlineSortOrder: {
                        $cond: [
                            { $eq: ["$status", "online"] },
                            0,  // Online users first
                            1   // Offline users second
                        ]
                    }
                }
            }
        );
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
        const [users, totalCount] = await Promise.all([
            VideoProfile.aggregate(aggregate),
            VideoProfile.countDocuments(baseQuery)
        ]);

        // Set cache control headers
        let responseUsers = getUserWithCountryFlagsEmoji(users);
        res.set('Cache-Control', 'public, max-age=60');

        return res.status(200).json({
            success: true,
            data: {
                users:responseUsers ,
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

    } catch (error) {
        console.error('[Nearby Users API Error]:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});


let userField = 'name _id email profileImage.url gender age onlineStatus';


router.get('/users/just-joined', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const validationResult = justJoinedSchema.safeParse(req.query);
        
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
        let userInfo = getUserDataFromRequest(req) ;
        // Calculate pagination
        const skip = (page - 1) * limit;

        // Base query for finding users
        const baseQuery = {
            createdAt: { $gte: startDate },
            gender : { $ne : userInfo.gender },
        };

        // Find users using aggregation
        let aggregate: any = [
            { $match: baseQuery },
            { $sort: { 
                'onlineStatus.isOnline': -1,
                'onlineStatus.lastActive': 1,
                createdAt: -1 
            }},
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
            }}
        ];

        let users = await User.aggregate(aggregate);

        // Get total count if requested
        let totalCount: number | undefined = undefined;
        if (shouldCount === 'yes') {
            totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
        }

        // Prepare pagination info
        let pagination: object = {
            currentPage: page,
            pageSize: limit,
        };

        if (totalCount !== undefined) {
            pagination = {
                ...pagination,
                totalPages: Math.ceil(totalCount / limit),
                totalUsers: totalCount
            };
        }

        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination,
                timeRange: `${timeRange} days`,
            }
        });

    } catch (error) {
        console.error(`recent profile listing api error:`, error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

router.get('/users/online', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        let userInfo = getUserDataFromRequest(req);
        
        // Validate query parameters
        const validationResult = paginationSchema.safeParse(req.query);

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
        let aggregate:any = [
            { $match: baseQuery },
            { $sort: { 'onlineStatus.lastActive': 1 }}, // Sort by most recently active
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
            }}
        ];

        let users = await User.aggregate(aggregate);

        // Get total count if requested
        let totalCount: number | undefined = undefined;
        if (shouldCount === 'yes') {
            totalCount = await User.countDocuments(baseQuery).maxTimeMS(8000);
        }

        // Prepare pagination info
        let pagination: object = {
            currentPage: page,
            pageSize: limit,
        };

        if (totalCount !== undefined) {
            pagination = {
                ...pagination,
                totalPages: Math.ceil(totalCount / limit),
                totalUsers: totalCount
            };
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

    } catch (error) {
        console.error('Online users API error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

router.get('/users/premium', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        let userInfo = getUserDataFromRequest(req);

        const validationResult = paginationSchema.safeParse(req.query);
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
        let aggregate:any = [
            { $match: baseQuery },
            { $sort: { 
                'onlineStatus.isOnline': -1,
                'onlineStatus.lastActive': 1
            }},
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
            }}
        ];

        let users = await User.aggregate(aggregate);

        let totalCount: number | undefined = undefined;
        if (shouldCount === 'yes') {
            totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
        }


        let pagination: object = {
            currentPage: page,
            pageSize: limit,
        };

        if (totalCount !== undefined) {
            pagination = {
                ...pagination,
                totalPages: Math.ceil(totalCount / limit),
                totalUsers: totalCount
            }
        }

        res.set('Cache-Control', 'private, max-age=60');

        res.status(200).json({
            success: true,
            data: {
                users
            },

            error: null,
            message: 'PREMIUM_USERS_FOUND'
        })
        return;

    } catch (error) {
        console.error('[Premium Users Search Api error]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

router.get('/users/preferred-education', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        let userInfo = getUserDataFromRequest(req);

        req.query.educationLevels && Array.isArray(req.query.educationLevels) === false && (req.query.educationLevels = [req.query.educationLevels]);
        const validationResult = preferredEducationSearchSchema.safeParse(req.query);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                error: validationResult.error.errors,
                data: null
            });
        }

        const {
            page,
            limit,
            count: shouldCount,
            educationLevels
        } = validationResult.data;

        // Calculate pagination
        const skip = (page - 1) * limit;
  
  
        let allEducationLevels =await User.distinct('education.level' , { isEducated: true });

        // Base query for finding users
        const baseQuery = {
            gender: { $ne: userInfo.gender },
            isEducated: true,
            "education.level": { $in: educationLevels ? educationLevels : allEducationLevels }
        };
      
        // Use aggregation to prioritize online users
        let aggregate: any = [
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

        let users = await User.aggregate(aggregate);

        // Get total count if requested
        let totalCount: number | undefined = undefined;

        if (shouldCount === 'yes') {
            totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
        }

        // Prepare pagination info
        let pagination: object = {
            currentPage: page,
            pageSize: limit,
        };

        if (totalCount !== undefined) {
            pagination = {
                ...pagination,
                totalPages: Math.ceil(totalCount / limit),
                totalUsers: totalCount
            };
        }

        res.set('Cache-Control', 'public, max-age=60'); // Cache for 1 minute

        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination,
                searchCriteria: {
                    educationLevels : educationLevels? educationLevels :  allEducationLevels 
                },
                allEducationLevels
            }
        });

    } catch (error) {
        console.error('Preferred education API error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

router.get('/users/preferred-location', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        let userInfo = getUserDataFromRequest(req);
        
        (typeof req.query.district_names === "string") && (req.query.district_names = [req.query.district_names]);
        const validationResult = preferredLocationSearchSchema.safeParse(req.query);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                error: validationResult.error.errors,
                data: null
            });
        }

        const {
            page,
            limit,
            count: shouldCount,
            district_names,
            latitude ,
            longitude
        } = validationResult.data;

        // Calculate pagination
        const skip = (page - 1) * limit;


        let existingDistrict = await User.distinct( 'address.district.name' , {})
        let nearestDistrictNames : any[] =[];

        if (district_names === undefined) {
            nearestDistrictNames = existingDistrict.map((eDistrict) => {
                return Districts.find(element => element.name === eDistrict)
            })
                .filter((district) => {
                    if (district) return district;
                })
                .map((district) => {
                    return ({
                        ...district,
                        distance: getDistance(latitude as number, longitude as number, district?.lat as number, district?.long as number),
                    })
                })
                .sort((a, b) => a.distance - b.distance)
                .map((district) => district?.name);

        }
     
        // Base query for finding users
        const baseQuery: any = {
            gender: { $ne: userInfo.gender },
            'address.district.name': { $in: district_names ? district_names : nearestDistrictNames }
        };

 
        
        // Use aggregation to prioritize online users
        let aggregate:any = [
            { 
                $match: baseQuery
            },
            { 
                $sort: { 
                'onlineStatus.isOnline': -1,
                'onlineStatus.lastActive': 1
            }},
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

        let users = await User.aggregate(aggregate);

        // Get total count if requested
        let totalCount: number | undefined = undefined;
        if (shouldCount === 'yes') {
            totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
        }

        // Prepare pagination info
        let pagination: object = {
            currentPage: page,
            pageSize: limit,
        };

        if (totalCount !== undefined) {
            pagination = {
                ...pagination,
                totalPages: Math.ceil(totalCount / limit),
                totalUsers: totalCount,
                
            };
        }

        res.set('Cache-Control', 'public, max-age=60'); // Cache for 1 minute

        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination,
                searchCriteria: {
                    district_names : district_names ? district_names : nearestDistrictNames
                }
            }
        });

    } catch (error) {
        console.error('Preferred location API error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

router.get('/users/matching/daily', async function (req: Request, res: Response): Promise<Response | any> {
    try {

        if (req.profileType !== 'matrimony_profile' || !req.authSession?.value ) {
            res.status(400).json({
                success: false,
                message: 'This Api is Only Availble for Matrimony Account Users',
        
                data: null
            });
            return;
        }
        
        const validationResult = todaysMatchSchema.safeParse(req.query);
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
        let nearestDistricts = findNearestDistricts(lat, long, 7);

        const baseQuery = {
            'address.country': CountryNamesEnum.BANGLADESH,
            'address.district.id': { $in: nearestDistricts.map(district => district.id) },
            ...getBaseSearchQuery(req.authSession.value),
        };

        let totalCount = await User.countDocuments(baseQuery).maxTimeMS(5000);

        let skip = Math.floor(Math.random() * ((totalCount || limit) - limit));

        // Use aggregation to prioritize online users
        let aggregate:any = [
            { $match: baseQuery },
            { $sort: { 
                'onlineStatus.isOnline': -1,
                'onlineStatus.lastActive': 1
            }},
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
            }}
        ];

        let users = await User.aggregate(aggregate);

        return res.status(200).json({
            success: true,
            data: { users }
        })

    } catch (error) {
        console.error(`daily match recommendation api error:`, error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

router.get('/users/matching/location', async function (req: Request, res: Response): Promise<Response | any> {
    try {

        if (!req.authSession || !req.authSession?.value) {
            res.status(401).json({
                success: false,
                message: 'Failed to authorize the user',
                
                data: null
            });
            return;
        }

        let userId = req.authSession.value.userId;
        let userData = req.authSession.value;
        const validationResult = paginationSchema.safeParse(req.query);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                error: validationResult.error.errors,
                data: null
            });
        }

        const { page, limit, count: shouldCount } = validationResult.data;


        if ( !userData.address.lat || !userData.address.long) {
            return res.status(400).json({
                success: false,
                message: "Matching Users are only available for Bangladeshi Users",
                data: null,
            });
        }

        let lat = userData.address.lat, long = userData.address.long;
        let nearestDistricts = findNearestDistricts(lat, long, 60);


        const skip = (page - 1) * limit;

        const baseQuery = {
            ...getBaseSearchQuery(userData),
            'address.country': CountryNamesEnum.BANGLADESH,
            'address.district.id': { $in: nearestDistricts.map(district => district.id) },
        };

        

        // Use aggregation to prioritize online users
        let aggregate:any = [
            { $match: baseQuery },
            { $sort: { 
                'onlineStatus.isOnline': -1,
                'onlineStatus.lastActive': 1
            }},
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
            }}
        ];

        let users = await User.aggregate(aggregate);

        let totalCount: number | undefined = undefined;
        if (shouldCount === 'yes') {
            totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
        }

        let pagination: object = {
            currentPage: page,
            pageSize: limit,
        };

        if (totalCount !== undefined) {
            pagination = {
                ...pagination,
                totalPages: Math.ceil(totalCount / limit),
                totalUsers: totalCount
            }
        }

        users = users.filter((user: IUser) => {
            if (!user.enhancedSettings.blocked.some((u) => u.userId === userId)) return user;
        });


        return res.status(200).json({
            success: false,
            data: {
                districts: nearestDistricts.map(({ name, bn_name }) => ({ name, bn_name })),
                pagination,
                users,
            }
        });

    } catch (error) {
        console.error(`match suggestion api error:`, error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null
        });
    }
});

router.get('/users/mutual', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        if (!req.authSession || !req.authSession?.value) {
            res.status(401).json({
                success: false,
                message: 'Failed to authorize the user',
                
                data: null
            });
            return;
        }
        // Validate query parameters
        const validationResult = paginationSchema.safeParse(req.query);
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
        const currentUser = await User.findById(userId, 'connections')
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
        let aggregate:any = [
            { $match: baseQuery },
            { $sort: { 
                'onlineStatus.isOnline': -1,
                'onlineStatus.lastActive': 1
            }},
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
            }}
        ];

        let users = await User.aggregate(aggregate);

        // Get total count if requested
        let totalCount: number | undefined = undefined;
        if (shouldCount === 'yes') {
            totalCount = await User.countDocuments(baseQuery)
                .maxTimeMS(10000);
        }

        // Prepare pagination info
        let pagination: object = {
            currentPage: page,
            pageSize: limit,
        };

        if (totalCount !== undefined) {
            pagination = {
                ...pagination,
                totalPages: Math.ceil(totalCount / limit),
                totalUsers: totalCount
            };
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

    } catch (error) {
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

router.get('/users/viewed-not-contact', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        if (!req.authSession || !req.authSession?.value) {
            res.status(401).json({
                success: false,
                message: 'Failed to authorize the user',
                
                data: null
            });
            return;
        }
        // Validate query parameters
        const validationResult = paginationSchema.safeParse(req.query);
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
        const viewerIds = await ProfileView.distinct('viewerId', {
            viewedId: userId
        });

        // Get IDs of users who sent connection requests
        const connectionRequestSenderIds = await ConnectionRequest.distinct('sender', {
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
        const viewerDetails = await ProfileView.find(
            {
                viewerId: { $in: viewerIds },
                viewedId: userId
            },
            'viewerId viewedAt'
        )
            .sort({ viewedAt: -1 })
            .lean();

        const viewerIdsWithTimestamps = viewerDetails.map(v => v.viewerId.toString());

        // Use aggregation to prioritize online users
        let aggregate:any = [
            { $match: baseQuery },
            { $sort: { 
                'onlineStatus.isOnline': -1,
                'onlineStatus.lastActive': 1
            }},
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
            }}
        ];

        let users = await User.aggregate(aggregate);

        // Get total count if requested
        let totalCount: number | undefined = undefined;
        if (shouldCount === 'yes') {
            totalCount = await User.countDocuments(baseQuery)
                .maxTimeMS(10000);
        }

        // Prepare pagination info
        let pagination: object = {
            currentPage: page,
            pageSize: limit,
        };

        if (totalCount !== undefined) {
            pagination = {
                ...pagination,
                totalPages: Math.ceil(totalCount / limit),
                totalUsers: totalCount
            };
        }

        // Enhance user objects with view timestamps
        let notContactedUsers = users.map(function (user) {
            const viewInfo = viewerDetails.find(v => v.viewerId.toString() === user._id.toString());
            if (viewInfo) {
                return {
                    ...user,
                    viewedAt: viewInfo.viewedAt
                };
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

    } catch (error) {
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


router.get('/users/filter', async function (req: Request, res: Response): Promise<Response | any> {
    try {

        if (!req.authSession || !req.authSession?.value) {
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

        const queryResult = filterUsersSchema.safeParse(req.query);
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
        const {
            page,
            limit,
            count: shouldCount,
            languages,
            division_ids,
            isEducated,
            minWeight,
            maxWeight,
            minHeight,
            maxHeight,
            minAge,
            maxAge,
            maritalStatuses,
            occupations,
            minAnnualIncome,
            maxAnnualIncome,
          
        } = validatedQuery;

        // Build the base query
        const baseQuery: any = getBaseSearchQuery(req.authSession.value);

      
        if (languages?.length > 0) baseQuery.languages = { $in: languages };
      
        if (division_ids.length > 0) {
            baseQuery['address.division.id'] = { $in: division_ids };
        }
        if (isEducated) baseQuery.isEducated = isEducated;

        // Add range-based filters
        if (minWeight || maxWeight) {
            baseQuery.weight = {};
            if (minWeight) baseQuery.weight.$gte = minWeight;
            if (maxWeight) baseQuery.weight.$lte = maxWeight;
        }

        if (minAge || maxAge) {
            baseQuery.age = {};
            if (minAge) baseQuery.age.$gte = minAge;
            if (maxAge) baseQuery.age.$lte = maxAge;
        }

        if (minHeight && maxHeight) {
            baseQuery.height = { $in: searchHeightGenerator(minHeight, maxHeight) };
        }

        // Add array-based filters
        if (maritalStatuses?.length > 0) {
            baseQuery.maritalStatus = { $in: maritalStatuses };
        }

        if (occupations?.length > 0) {
            baseQuery.occupation = { $in: occupations };
        }

        // Add income-based filters
        if (minAnnualIncome && maxAnnualIncome) {
          
            baseQuery['annualIncome.amount'] = {};
            if (minAnnualIncome) baseQuery['annualIncome.amount'].$gte = minAnnualIncome;
            if (maxAnnualIncome) baseQuery['annualIncome.amount'].$lte = maxAnnualIncome;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Execute the query with pagination
        const users = await User.find(baseQuery, userField)
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000); // Set maximum execution time

        // Get total count if requested
        let totalCount: number | undefined = undefined;
        if (shouldCount === 'yes') {
            totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
        }

        // Prepare pagination info
        let pagination: object = {
            currentPage: page,
            pageSize: limit,
        };

        if (totalCount !== undefined) {
            pagination = {
                ...pagination,
                totalPages: Math.ceil(totalCount / limit),
                totalUsers: totalCount
            };
        }

        // Set cache headers for better performance
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

    } catch (error) {
        console.error('Filter users API error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null
        });
    }
});


router.get('/search-history', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        if (!req.authSession || !req.authSession?.value) {
            res.status(401).json({
                success: false,
                message: 'Failed to authorize the user',

                data: null
            });
            return;
        }
        const userId = req.authSession.value.userId;


        // Get search history
        const searchHistory = await SearchHistory.find({ userId, }, 'title query savedAt userId')
            .sort({ savedAt: -1 })
            .lean()
            .maxTimeMS(10000);



        if (searchHistory.length > 50) {
            for (let i = 0; i < searchHistory.length; i++) {
                const { savedAt, _id } = searchHistory[i];
                if (savedAt.getTime() < (Date.now() - 7 * 24 * 3600 * 1000)) await SearchHistory.findByIdAndDelete(_id);
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

    } catch (error) {
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


router.post('/search-history', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        if (!req.authSession || !req.authSession?.value) {
            res.status(401).json({
                success: false,
                message: 'Failed to authorize the user',

                data: null
            });
            return;
        }
        // Validate request body
        const validationResult = searchHistorySchema.safeParse(req.body);

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
        const isHistoryExists = await SearchHistory.findOne(
            { userId, title },
            '_id'
        ).lean();

        if (isHistoryExists) {
            return res.status(409).json({
                success: false,
                message: 'A search history with this title already exists',
                error: 'DUPLICATE_TITLE',
                data: null
            });
        }

        // Create new search history
        const newSearchHistory = await SearchHistory.create({
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

    } catch (error) {
        console.error('[Save search history API error]', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
            userId: req.authSession?.value?.userId
        });

        return res.status(500).json({
            success: false,
            message: 'An error occurred while saving search history',
            error: 'INTERNAL_SERVER_ERROR',
            data: null
        });
    }
});


router.delete('/search-history/:id', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        if (!req.authSession || !req.authSession?.value) {
            res.status(401).json({
                success: false,
                message: 'Failed to authorize the user',

                data: null
            });
            return;
        }
        // Validate ID parameter
        const historyId = _idValidator.parse(req.params.id);
        const userId = req.authSession.value.userId;

        // Find and delete the search history
        const searchHistory = await SearchHistory.findById(historyId);

        if (!searchHistory) {
            return res.status(404).json({
                success: false,
                message: 'Search history not found or you do not have permission to delete it',
                error: 'NOT_FOUND',
                data: null
            });
        }

        await searchHistory.deleteOne();

        return res.status(200).json({
            success: true,
            data: {
                id: historyId,
                deletedAt: new Date()
            },
            error: null,
            message: 'Search history deleted successfully'
        });

    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
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
            userId: req.authSession?.value?.userId,
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



router.get('/users/suggested-for-you', async function (req: Request, res: Response): Promise<Response | any> {
    try {

        if (!req.authSession || !req.authSession?.value) {
            res.status(401).json({
                success: false,
                message: 'Failed to authorize the user',

                data: null
            });
            return;
        }

        const validationResult = paginationSchema.safeParse(req.query);
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
        const currentUser = await User.findById(userData.userId, 'partnerPreference gender').lean();


        if (!currentUser) throw new Error("currentUser is null");


        if (!currentUser?.partnerPreference) {
            // If no preferences exist, create them automatically
            const userForPrefs = await User.findById(userData.userId);
            if (userForPrefs) {
                userForPrefs.createPreference();
                await userForPrefs.save();
                currentUser.partnerPreference = userForPrefs.partnerPreference;
            } else {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                    data: null
                });
            }
        }

        // Build base query including base search criteria
        const baseQuery: any = {
            ...getBaseSearchQuery(userData), // Use existing helper for base query
           
        };

        const pref = currentUser.partnerPreference;

        // Add age preferences
        if (pref.ageRange?.min || pref.ageRange?.max) {
            baseQuery.age = {};
            if (pref.ageRange.min) baseQuery.age.$gte = pref.ageRange.min;
            if (pref.ageRange.max) baseQuery.age.$lte = pref.ageRange.max;
        }

        // Add height preferences with proper validation
        if (pref.heightRange?.min && pref.heightRange?.max) {
            baseQuery.height = {
                $in: searchHeightGenerator(
                    pref.heightRange.min,
                    pref.heightRange.max
                )
            };
        }

        // Add religion preferences
        if (pref.religion?.length > 0) {
            baseQuery.religion = { $in: pref.religion };
        }

        // Add marital status preferences
        if (pref.maritalStatus?.length > 0) {
            baseQuery.maritalStatus = { $in: pref.maritalStatus };
        }

        // Add education preferences with null handling
        if (pref.education?.minimumLevel) {
            const educationLevels = Object.values(EducationLevel);
            const minLevelIndex = educationLevels.indexOf(pref.education.minimumLevel);
            if (minLevelIndex !== -1) {
                const acceptableLevels = educationLevels.slice(minLevelIndex);
                baseQuery['education.level'] = { $in: acceptableLevels };
                baseQuery['isEducated'] =true;
            }
        }

         
        // Add occupation preferences
        if (!!pref.profession?.acceptedOccupations?.length && pref.profession?.acceptedOccupations?.length > 0) {
            baseQuery.occupation = { $in: pref.profession.acceptedOccupations };
        }

        // Add income preferences with currency matching
        if (pref.profession?.minimumAnnualIncome) {
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


        let users = await User.find(baseQuery, userField)
            .sort({
                createdAt: -1,
                "onlineStatus.isOnline": 1,
                "onlineStatus.lastActive": -1
            })
            .skip(skip)
            .limit(limit)
            .lean();

        // Get total count if requested
        let totalCount: number | undefined = undefined;
        if (shouldCount === 'yes') {
            totalCount = await User.countDocuments(baseQuery)
                .maxTimeMS(10000);
        }

        // Prepare pagination info
        let pagination: object = {
            currentPage: page,
            pageSize: limit,
        };

        if (totalCount !== undefined) {
            pagination = {
                ...pagination,
                totalPages: Math.ceil(totalCount / limit),
                totalUsers: totalCount
            };
        }

        // Cache control - short cache due to frequent updates
        res.set('Cache-Control', 'private, max-age=60');

        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination,
                searchCritiria : baseQuery
            },
            message: 'SUGGESTED_USERS_FOUND'
        });

    } catch (error) {
        console.error('[Suggested For You API error]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
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





export default router;