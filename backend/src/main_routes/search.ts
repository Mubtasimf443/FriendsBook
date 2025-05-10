/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Router, Request, Response, } from "express";
import rateLimiter from "../config/rateRimiter";
import { validateUser } from "../lib/middlewares/auth.middleware";
import { IAuthSession } from "../models/AuthSession";
import { CountryNamesEnum } from "../lib/types/country_names.enum";
import { findNearestDistricts, getBaseSearchQuery, searchHeightGenerator } from "../controllers/search.controller";
import { User } from "../models/user";
import { FilterUsersQueryParams, filterUsersSchema, getUserByMIDSchema, justJoinedSchema, preferredEducationSearchSchema, preferredLocationSearchSchema, preferredOccupationSearchSchema, paginationSchema, todaysMatchSchema, searchHistorySchema } from "../lib/schema/search.schema";
import { IProfileView, ProfileView } from "../models/ProfileView";
import queryMiddleware from "../lib/middlewares/query.middleware";
import { EducationLevel } from "../lib/types/userEducation.types";
import { IUser, Occupation } from "../lib/types/user.types";
import { ShortList } from "../models/ShortListedProfiles";
import { SearchHistory } from "../models/SearchHistory";
import { _idValidator } from "../lib/schema/schemaComponents";
import { z } from "zod";
import { SmsSendedProfile } from "../models/SmsSendedProfile";
import { SendMailedProfile } from "../models/SendMailedProfile";
import { LikedProfile } from "../models/LikedProfile";
import { RequestMobileNumberView } from "../models/RequestMobileNumberView";
import { ConnectionRequest } from "../models/ConnectionRequest";

const router: Router = Router();

router.use(rateLimiter(120 * 1000, 200));
router.use(validateUser);
router.use(queryMiddleware)

declare global {
    namespace Express {
        interface Request {
            authSession: IAuthSession;
            bearerAccessToken?: string;
        }
    }
}

let userField = 'name _id address email age isEducated education address religion languages maritalStatus occupation annualIncome enhancedSettings.blocked profileImage coverImage';


router.get('/users/matching/location', async function (req: Request, res: Response): Promise<Response | any> {
    try {
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


        if (userData.address.country !== CountryNamesEnum.BANGLADESH || !userData.address.lat || !userData.address.long) {
            return res.status(400).json({
                success: false,
                message: "Matching Users are only available for Bangladeshi Users",
                data: null,
            });
        }

        let lat = userData.address.lat, long = userData.address.long;
        let nearestDistricts = findNearestDistricts(lat, long, 7);


        const skip = (page - 1) * limit;

        const baseQuery = {
             ...getBaseSearchQuery(userData), 
            'address.country': CountryNamesEnum.BANGLADESH,
            'address.district.id': { $in: nearestDistricts.map(district => district.id) },
        };


        let users = await User.find(baseQuery, userField)
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

        let totalCount: number | undefined = undefined;
        if (shouldCount === 'yes') {
            totalCount = await User.find(baseQuery).countDocuments().maxTimeMS(10000)
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
            if (!user.enhancedSettings.blocked.some((u) => u.userId === req.authSession.value.userId)) return user;
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




router.get('/users/matching/daily', async function (req: Request, res: Response): Promise<Response | any> {
    try {
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
        if (userData.address.country !== CountryNamesEnum.BANGLADESH || !userData.address.lat || !userData.address.long) {
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

        let totalCount = await User.find(baseQuery).countDocuments().maxTimeMS(5000);

        let skip = Math.floor(Math.random() * (totalCount - limit));



        let users = await User.find(baseQuery, userField)
            .skip(skip)
            .limit(limit)
            .lean();

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
        const userData = req.authSession.value;

        // Calculate the date range

        const daysAgo = parseInt(timeRange);
        const startDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Base query for finding users
        const baseQuery = {
            'address.country': userData.address.country,
            createdAt: { $gte: startDate },
            ...getBaseSearchQuery(req.authSession.value),
        };

        // Find users
        let users = await User.find(baseQuery, userField)
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

        // Get total count if requested
        let totalCount: number | undefined = undefined;
        if (shouldCount === 'yes') {
            totalCount = await User.find(baseQuery)
                .countDocuments()
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

router.get('/users/not-viewed', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const validationResult = paginationSchema.safeParse(req.query);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                error: validationResult.error.errors,
                data: null
            });
        }

        const { page, limit, count: shouldCount, } = validationResult.data;
        const userData = req.authSession.value;

        // Get IDs of profiles already viewed by the user
        const viewedProfileIds = await ProfileView.distinct('viewedId', {
            viewerId: userData.userId
        });
        const baseQuery: any = {
               ...getBaseSearchQuery(req.authSession.value),
            'address.country': userData.address.country,
            _id: {
                $nin: [...viewedProfileIds , userData.userId ] 
            },
            
        };

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Find users with pagination
        let users = await User.find(baseQuery, userField)
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

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
        res.set("cache-control", "max-age=60, public");
        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination,

            }
        });



    } catch (error) {
        console.error(`unviewed profile listing api error:`, error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

router.get('/users/online', async function (req: Request, res: Response): Promise<Response | any> {
    try {
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
        const userData = req.authSession.value;

        // Calculate the active time threshold


        // Base query for finding online users
        const baseQuery = {
            'address.country': userData.address.country,
          
            'onlineStatus.isOnline': true,
            ...getBaseSearchQuery(req.authSession.value),
        };

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Find online users with pagination
        let users = await User.find(baseQuery, userField)
            .sort({ 'onlineStatus.lastActive': -1 }) // Sort by most recently active
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

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
router.get('/users/others-viewed-my-profile', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const userData = req.authSession.value;

        // Get IDs of profiles already viewed by the user
        const viewedMyProfileIds = (
            await ProfileView.find({}, 'viewerId')
                .where('viewedId').equals(userData.userId)
                .where('viewerId').ne(userData.userId)
                .lean()
        )
            .map(el => el.viewerId);


        const baseQuery: any = {
            _id: {
                $in: viewedMyProfileIds // Exclude viewed profiles
            },
            'suspension.isSuspended': false,
        };



        // Find users with pagination
        let users = await User.find(baseQuery, userField)
            .lean()
            .maxTimeMS(20000);


        res.set("cache-control", "max-age=60, public");
        return res.status(200).json({
            success: true,
            data: {
                users,

            }
        });
    } catch (error) {
        console.error(`others viewed Your Profile api error:`, error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});
// Complete the shortlist APIs in search.ts
router.get('/users/my-shortlist', async function (req: Request, res: Response): Promise<Response | any> {
    try {
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

        // Get shortlisted user IDs
        let shortlistedIds = await ShortList.distinct('shortListedId', {
            shortListerId: userId
        });

        // Base query
        const baseQuery = {
            _id: {
                $in: shortlistedIds,
            },
            'suspension.isSuspended': false,
        };

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Find users with pagination
        let users = await User.find(baseQuery, userField)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

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

        // Set cache headers
        res.set('Cache-Control', 'public, max-age=60'); // Cache for 1 minute

        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination
            }
        });

    } catch (error) {
        console.error('[Shortlist search api error]', {
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
router.get('/users/others-shortlisted-me', async function (req: Request, res: Response): Promise<Response | any> {
    try {
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

        // Get IDs of users who shortlisted the current user
        let shortlistedByIds = await ShortList.distinct('shortListerId', {
            shortListedId: userId
        });

        // Base query for finding users
        const baseQuery = {
            _id: {
                $in: shortlistedByIds,
            },
            'suspension.isSuspended': false,
        };

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Find users with pagination
        let users = await User.find(baseQuery, userField)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

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

        // Set cache headers
        res.set('Cache-Control', 'public, max-age=60'); // Cache for 1 minute

        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination
            }
        });

    } catch (error) {
        console.error('[Others shortlisted me api error]', {
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
router.get('/users/preferred-occupation', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        Array.isArray(req.query.occupations) === false && (req.query.occupations = [req.query.occupations || Occupation.DOCTOR]);

        // Validate query parameters
        const validationResult = preferredOccupationSearchSchema.safeParse(req.query);
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
            occupations
        } = validationResult.data;

        const userData = req.authSession.value;

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Construct base query with occupation filter
        const baseQuery = {
             ...getBaseSearchQuery(req.authSession.value),
            occupation: { $in: occupations }
        };



        // Find matching users with occupation details
        const users = await User.find(baseQuery, userField)
            .skip(skip)
            .limit(limit)
            .lean();


        // Get total count if requested
        let totalCount: number | undefined = undefined;
        if (shouldCount === 'yes') {
            totalCount = await User.countDocuments(baseQuery).maxTimeMS(10000);
        }

        // Get occupation distribution for analytics
        const occupationDistribution = await User.find(baseQuery, userField);

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

        // Set cache control header for 1 minute
        // Short cache time because occupation data might change frequently
        res.set('Cache-Control', 'public, max-age=60');

        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination,

            }
        });

    } catch (error) {
        // Log the error with request details for debugging
        console.error('Preferred occupation API error:', {
            error,
            query: req.query,
            userId: req.authSession?.value?.userId
        });

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});


router.get('/users/preferred-education', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        Array.isArray(req.query.educationLevels) === false && (req.query.educationLevels = [req.query.educationLevels || EducationLevel.BACHELORS_DEGREE]);
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

        const userData = req.authSession.value;

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Base query for finding users
        const baseQuery = {
              ...getBaseSearchQuery(req.authSession.value),
            isEducated: true,
            "education.level": { $in: educationLevels }
        };

        // Find users with aggregation to get highest matching education level
        const users = await User.find(baseQuery, userField)
            .skip(skip)
            .limit(limit)
            .lean();

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
                    educationLevels
                }
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
        (typeof req.query.countries === "string") && (req.query.countries = [req.query.countries]);
        (typeof req.query.division_ids === "string") && (req.query.division_ids = [req.query.division_ids]);
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
            countries,
            division_ids
        } = validationResult.data;

        const userData = req.authSession.value;

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Base query for finding users
        const baseQuery: any = {
             ...getBaseSearchQuery(req.authSession.value),
            'address.country': { $in: countries }
        };

        // Add division filter if country includes Bangladesh
        if (countries.includes(CountryNamesEnum.BANGLADESH) && division_ids.length > 0) {
            baseQuery['address.division.id'] = { $in: division_ids };
        }

        // Find users
        let users = await User.find(baseQuery, userField)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

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
                    countries,
                    divisions_ids: division_ids || []
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


router.get('/user', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const validationResult = getUserByMIDSchema.safeParse(req.query);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                error: validationResult.error.errors,
                data: null
            });
        }

        const { mid } = validationResult.data;

        const user = await User.findOne(
            { mid, 'suspension.isSuspended': false },
            userField
        ).lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                data: null
            });
        }

        // Cache response for 5 minutes
        res.set('Cache-Control', 'public, max-age=300');

        return res.status(200).json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Get user by MID error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null
        });
    }
});

router.get('/user/:id', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        let _id = await _idValidator.parseAsync(req.params.id);
        
        const user = await User.findById(
            _id,
            userField
        ).lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                data: null
            });
        }

        // Cache response for 5 minutes
        res.set('Cache-Control', 'public, max-age=600');

        return res.status(200).json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Get user by MID error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null
        });
    }
});



router.get('/users/filter', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        // Handle array parameters that might come as strings
        (typeof req.query.languages === "string") && (req.query.languages = [req.query.languages]);
        (typeof req.query.countries === "string") && (req.query.countries = [req.query.countries]);
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
            religion,
            languages,
            countries,
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
            incomeCurrency,
        } = validatedQuery;

        // Build the base query
        const baseQuery: any = getBaseSearchQuery(req.authSession.value);

        // Add optional filters
        if (religion) baseQuery.religion = religion;
        if (languages?.length > 0) baseQuery.languages = { $all: languages };
        if (countries?.length > 0) baseQuery['address.country'] = { $in: countries };
        if (countries?.includes(CountryNamesEnum.BANGLADESH) && division_ids?.length > 0) {
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
            baseQuery['annualIncome.currency'] = incomeCurrency;
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
                    religion,
                    languages,
                    countries,
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
                        currency: incomeCurrency
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
        const validationResult = paginationSchema.safeParse(req.query);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                error: validationResult.error.errors,
                data: null
            });
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


router.get('/users/premium', async function (req: Request, res: Response): Promise<Response | any> {
    try {
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

        const baseQuery = {
              ...getBaseSearchQuery(req.authSession.value),
            'membership.currentMembership.requestId': { $exists: true },
            'membership.currentMembership.membership_exipation_date': { $exists: true }
        };

        const skip = (page - 1) * limit;
        let users: any[] = await User.find(baseQuery, userField + ' membership')
            .skip(skip)
            .limit(limit)
            .lean();


        let totalCount: number | undefined = undefined;
        if (shouldCount === 'yes') {
            totalCount = await User.find(baseQuery).countDocuments().maxTimeMS(10000)
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


// Get mutual connections - users who have accepted connection requests with current user
router.get('/users/mutual', async function (req: Request, res: Response): Promise<Response | any> {
    try {
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

        // Find connected users with pagination
        let users = await User.find(baseQuery, userField)
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

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


// Get users who viewed profile but haven't sent connection requests
router.get('/users/viewed-not-contact', async function (req: Request, res: Response): Promise<Response | any> {
    try {
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

        // Find users with pagination
        let users = await User.find(baseQuery, userField)
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

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

        // Add viewer details with timestamps
        let viewerDetails: IProfileView[] = await ProfileView.find(
            {
                viewerId: { $in: users.map(u => u._id) },
                viewedId: userId
            },
            'viewerId viewedAt'
        )
            .sort({ viewedAt: -1 })
            .lean();

        // Enhance user objects with view timestamps

        let notContactedUsers = viewerDetails.map(function (element) {
            let viewInfo: any = users.find(user => user._id.toString() === element.viewerId.toString())
            if (viewInfo) {
                viewInfo = {
                    ...viewInfo,
                    viewedAt: viewInfo.viewedAt[0]
                }
                return viewInfo;
            }
            else return undefined;
        }).filter(user => !!user && user);



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


router.get('/users/viewed-profiles', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const validationResult = paginationSchema.safeParse(req.query);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                error: validationResult.error.errors,
                data: null
            });
        }

        const { page, limit, count: shouldCount, } = validationResult.data;
        const userData = req.authSession.value;

        // Get IDs of profiles already viewed by the user
        const viewedProfileIds = await ProfileView.distinct('viewedId', {
            viewerId: userData.userId
        });


        const baseQuery: any = {

            _id: {
                $ne: userData.userId,  // Exclude current user
                $in: viewedProfileIds // Exclude viewed profiles
            },
            'suspension.isSuspended': false,

        };

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Find users with pagination
        let users = await User.find(baseQuery, userField)
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

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
        res.set("cache-control", "max-age=60, public");
        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination,

            }
        });

    } catch (error) {
        console.error('[Viewed Profile search api error]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

router.get('/users/viewed-my-profile', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const validationResult = paginationSchema.safeParse(req.query);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                error: validationResult.error.errors,
                data: null
            });
        }

        const { page, limit, count: shouldCount, } = validationResult.data;
        const userData = req.authSession.value;

        // Get IDs of profiles already viewed by the user
        const viewedProfileIds = await ProfileView.distinct('viewerId', {
            viewedId: userData.userId
        });
        const baseQuery: any = {
               ...getBaseSearchQuery(req.authSession.value),
            'address.country': userData.address.country,
            _id: {
                $ne: userData.userId,  // Exclude current user
                $in: viewedProfileIds // Exclude viewed profiles
            },
           
        };

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Find users with pagination
        let users = await User.find(baseQuery, userField)
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

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
        res.set("cache-control", "max-age=60, public");
        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination,

            }
        });

    } catch (error) {
        console.error('[Viewed My Profiles]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

// Implement /users/liked-by-me - Get profiles that the current user has liked
router.get('/users/liked-by-me', async function (req: Request, res: Response): Promise<Response | any> {
    try {
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

        // Get IDs of profiles liked by the current user
        const likedProfileIds = await LikedProfile.distinct('likedId', {
            likerId: userData.userId
        });

        const baseQuery = {
            _id: {
                $in: likedProfileIds
            },
            'suspension.isSuspended': false,
        };

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Find users with pagination
        let users = await User.find(baseQuery, userField)
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

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
        res.set("cache-control", "max-age=60, public");
        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination,
            }
        });

    } catch (error) {
        console.error('[Liked by me profiles API error]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

// Implement /users/liked-me - Get profiles that have liked the current user
router.get('/users/liked-me', async function (req: Request, res: Response): Promise<Response | any> {
    try {
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

        // Get IDs of users who liked the current user
        const likedByIds = await LikedProfile.distinct('likerId', {
            likedId: userData.userId
        });

        const baseQuery = {
            _id: {
                $in: likedByIds
            },
            'suspension.isSuspended': false,
        };

        const skip = (page - 1) * limit;

        let users = await User.find(baseQuery, userField)
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

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
            };
        }

        res.set("cache-control", "max-age=60, public");
        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination,
            }
        });

    } catch (error) {
        console.error('[Liked me profiles API error]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

// Implement /users/send-mails-by-me - Get profiles to whom current user has sent emails
router.get('/users/send-mails-by-me', async function (req: Request, res: Response): Promise<Response | any> {
    try {
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

        // Get IDs of users who received emails from current user
        const emailedProfileIds = await SendMailedProfile.distinct('receiverId', {
            senderId: userData.userId,
            emailStatus: 'SENT'
        });

        const baseQuery = {
            _id: {
                $in: emailedProfileIds
            },
            'suspension.isSuspended': false,
        };

        const skip = (page - 1) * limit;

        let users = await User.find(baseQuery, userField)
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

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
            };
        }

        res.set("cache-control", "max-age=60, public");
        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination,
            }
        });

    } catch (error) {
        console.error('[Emails sent by me API error]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

// Implement /users/send-mails-to-me - Get profiles who have sent emails to current user
router.get('/users/send-mails-to-me', async function (req: Request, res: Response): Promise<Response | any> {
    try {
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

        // Get IDs of users who sent emails to current user
        const emailSenderIds = await SendMailedProfile.distinct('senderId', {
            receiverId: userData.userId,
            emailStatus: 'SENT'
        });

        const baseQuery = {
            _id: {
                $in: emailSenderIds
            },
            'suspension.isSuspended': false,
        };

        const skip = (page - 1) * limit;

        let users = await User.find(baseQuery, userField)
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

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
            };
        }

        res.set("cache-control", "max-age=60, public");
        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination,
            }
        });

    } catch (error) {
        console.error('[Emails sent to me API error]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

// Implement /users/send-sms-by-me - Get profiles to whom current user has sent SMS
router.get('/users/send-sms-by-me', async function (req: Request, res: Response): Promise<Response | any> {
    try {
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

        // Get IDs of users who received SMS from current user
        const smsReceiverIds = await SmsSendedProfile.distinct('receiverId', {
            senderId: userData.userId,
            smsStatus: 'SENT'
        });

        const baseQuery = {
            _id: {
                $in: smsReceiverIds
            },
            'suspension.isSuspended': false,
        };

        const skip = (page - 1) * limit;

        let users = await User.find(baseQuery, userField)
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

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
            };
        }

        res.set("cache-control", "max-age=60, public");
        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination,
            }
        });

    } catch (error) {
        console.error('[SMS sent by me API error]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

// Implement /users/send-sms-to-me - Get profiles who have sent SMS to current user
router.get('/users/send-sms-to-me', async function (req: Request, res: Response): Promise<Response | any> {
    try {
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

        // Get IDs of users who sent SMS to current user
        const smsSenderIds = await SmsSendedProfile.distinct('senderId', {
            receiverId: userData.userId,
            smsStatus: 'SENT'
        });

        const baseQuery = {
            _id: {
                $in: smsSenderIds
            },
            'suspension.isSuspended': false,
        };

        const skip = (page - 1) * limit;

        let users = await User.find(baseQuery, userField)
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

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
            };
        }

        res.set("cache-control", "max-age=60, public");
        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination,
            }
        });

    } catch (error) {
        console.error('[SMS sent to me API error]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

// Implement /users/send-sms-to-me - Get profiles who have sent SMS to current user
router.get('/users/seen-phobe-details', async function (req: Request, res: Response): Promise<Response | any> {
    try {
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

        // Get IDs of users who sent SMS to current user
        const requestedIds = await RequestMobileNumberView.distinct('requestedId', {
            requesterId: userData.userId,
        });

        const baseQuery = {
            _id: {
                $in: requestedIds
            },
            'suspension.isSuspended': false,
        };

        const skip = (page - 1) * limit;

        let users = await User.find(baseQuery, userField)
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

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
            };
        }

        res.set("cache-control", "max-age=60, public");
        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination,
            }
        });

    } catch (error) {
        console.error('[SMS sent to me API error]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});


router.get('/users/seen-my-phobe-details', async function (req: Request, res: Response): Promise<Response | any> {
    try {
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

        const skip = (page - 1) * limit;

        // Get IDs of users who sent SMS to current user
        let requesters = await RequestMobileNumberView.find({
            requestedId: req.authSession.value.userId,
        }, 'requesterId')
            .skip(skip)
            .limit(limit)
            .lean();

        let requestersIds = requesters.map(element => element.requesterId);

        const baseQuery = {
            _id: {
                $in: requestersIds
            },
            'suspension.isSuspended': false,
        };


        let users = await User.find(baseQuery, userField)

            .lean()
            .maxTimeMS(20000);

        let totalCount: number | undefined = undefined;
        if (shouldCount === 'yes') {
            totalCount = await RequestMobileNumberView.find({
                requestedId: req.authSession.value.userId,
            }, '')
                .countDocuments(baseQuery)
                .maxTimeMS(10000);
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
            };
        }

        res.set("cache-control", "max-age=60, public");
        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination,
            }
        });

    } catch (error) {
        console.error('[SMS sent to me API error]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

router.get('/users/suggested-for-you', async function (req: Request, res: Response): Promise<Response | any> {
    try {

    } catch (error) {

    }
});






export default router;