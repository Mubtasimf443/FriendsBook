/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Router, Request, Response, } from "express";
import rateLimiter from "../config/rateRimiter";
import { validateUser } from "../lib/middlewares/auth.middleware";
import { IAuthSession } from "../models/AuthSession";
import { CountryNamesEnum } from "../lib/types/country_names.enum";
import { findNearestDistricts, searchHeightGenerator } from "../controllers/search.controller";
import { User } from "../models/user";
import { FilterUsersQueryParams, filterUsersSchema, getUserByMIDSchema, justJoinedSchema, limitValidation, notViewedSchema, onlineUsersSchema, searchQuertSchema, todaysMatchSchema } from "../lib/schema/search.schema";
import { ProfileView } from "../models/ProfileView";
import queryMiddleware from "../lib/middlewares/query.middleware";

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

let userField = 'name _id address email age isEducated education address religion languages maritalStatus occupation annualIncome';

router.get('/users/matching/location', async function (req: Request, res: Response): Promise<Response | any> {
    try {
      
        let userData = req.authSession.value;

        const validationResult = searchQuertSchema.safeParse(req.query);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                error: validationResult.error.errors,
                data: null
            });
        }
  
        const { page, limit, count :shouldCount } = validationResult.data;
        

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
            'address.country': CountryNamesEnum.BANGLADESH,
            'address.district.id': { $in: nearestDistricts.map(district => district.id) },
            'isSuspended': false,
            '_id': { $ne: userData.userId }, // Exclude current user
            'gender': { $ne: userData.gender },
            religion: userData.religion
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

        let pagination:object = {
            currentPage : page,
            pageSize: limit,
        };

        if (totalCount !== undefined) {
            pagination = {
                ...pagination,
                totalPages: Math.ceil(totalCount / limit),
                totalUsers: totalCount
            }
        } 

        return res.status(200).json({
            success : false ,
            data : {
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
            'isSuspended': false,
            '_id': { $ne: userData.userId }, // Exclude current user
            religion: userData.religion,
            'gender': { $ne: userData.gender }, // Basic preference matching
        };

        let totalCount = await User.find(baseQuery ).countDocuments().maxTimeMS(5000);
        
        let skip = Math.floor(Math.random() * (totalCount - limit));
    
       

        let users = await User.find(baseQuery,userField)
            .skip(skip)
            .limit(limit)
            .lean();

        return res.status(200).json({
            success : true ,
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
            'address.country':userData.address.country,
            createdAt: { $gte: startDate },
            'isSuspended': false,
            '_id': { $ne: userData.userId }, // Exclude current user
            'gender': { $ne: userData.gender }, // Basic preference matching
            religion: userData.religion
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

    }catch (error) {
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
        const validationResult = notViewedSchema.safeParse(req.query);

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
        const baseQuery :any= {
            'address.country':userData.address.country,
            _id: { 
                $ne: userData.userId,  // Exclude current user
                $nin: viewedProfileIds // Exclude viewed profiles
            },
            isSuspended: false,
            gender: { $ne: userData.gender }, // Match opposite gender
            religion: userData.religion
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

router.get('/users/online' ,async function (req: Request, res: Response): Promise<Response | any> {
    try {
        // Validate query parameters
        const validationResult = onlineUsersSchema.safeParse(req.query);

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
            isSuspended: false,
            '_id': { $ne: userData.userId },
            'gender': { $ne: userData.gender },
            'onlineStatus.isOnline': true,
            religion: userData.religion
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

router.get('/users/mutual', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        
    } catch (error) {
        
    }
})

router.get('/users/shortlist', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        
    } catch (error) {
        
    }
});


router.get('/users/premium', async function (req: Request, res: Response): Promise<Response | any> {
    try {

    } catch (error) {
        console.error(`premium profile listing api error:`, error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});



router.get('/users/viewed-not-contact', async function (req: Request, res: Response): Promise<Response | any> {
    try {

    } catch (error) {
        console.error(`premium profile listing api error:`, error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});


router.get('/users/preferred-occupation', async function (req: Request, res: Response): Promise<Response | any> {
    try {

    } catch (error) {
        console.error(`premium profile listing api error:`, error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

router.get('/users/preferred-education', async function (req: Request, res: Response): Promise<Response | any> {
    try {

    } catch (error) {
        console.error(`premium profile listing api error:`, error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

router.get('/users/preferred-location', async function (req: Request, res: Response): Promise<Response | any> {
    try {

    } catch (error) {
        console.error(`premium profile listing api error:`, error);
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


        const baseQuery :any= {
            'address.country':userData.address.country,
            _id: { 
                $ne: userData.userId,  // Exclude current user
                $in: viewedMyProfileIds // Exclude viewed profiles
            },
            isSuspended: false,
            gender: { $ne: userData.gender }, // Match opposite gender
            religion: userData.religion
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
})


/* Add these new routes to your existing search.ts */


router.get('/user', async function(req: Request, res: Response): Promise<Response | any> {
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
            { mid, isSuspended: false },
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


router.get('/users/filter', async function(req: Request, res: Response): Promise<Response | any> {
    try {
        // Example usage in route handler
        console.log(req.query);
        
        const queryResult = filterUsersSchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                errors: queryResult.error.format()
            });
        }

        const validatedQuery: FilterUsersQueryParams = queryResult.data;
        // Use validatedQuery safely with proper types

        const {
            page,
            limit,
            count: shouldCount,
            religion,
            languages,
            country,
            division,
            isEducated,
            minWeight,
            maxWeight,
            minHeight , 
            maxHeight,
            minAge,
            maxAge,
            maritalStatus,
            occupation,
            minAnnualIncome,
            maxAnnualIncome,
            incomeCurrency,
        } = validatedQuery;



        // Build query object
        const query: any = { isSuspended: false };

        // Add filters if they exist
        if (religion) query.religion = religion;
        if (languages?.length !== 0) query.languages = { $all: languages };
        if (country) query['address.country'] = country;
        if (division) query['address.division.id'] = division;
        if (isEducated ) query.isEducated = true;
        if (minWeight || maxWeight) {
            query.weight = {};
            if (minWeight) query.weight.$gte = minWeight;
            if (maxWeight) query.weight.$lte = maxWeight;
        }
        if (minAge || maxAge) {
            query.age = {};
            if (minAge) query.age.$gte = minAge;
            if (maxAge) query.age.$lte = maxAge;
        }
        if (minHeight && maxHeight) {
            query.height.$in = searchHeightGenerator(minHeight , maxHeight);
        }

        if (maritalStatus?.length && maritalStatus?.length > 0) {
            query.maritalStatus = { $in: maritalStatus };
        }

        // Add occupation filter
        if (occupation?.length  && occupation?.length > 0) {
            query.occupation = { $in: occupation };
        }

        // Add annual income filter
        if (minAnnualIncome || maxAnnualIncome) {
            query['annualIncome.currency'] = incomeCurrency;
            query['annualIncome.amount'] = {};
            
            if (minAnnualIncome) {
                query['annualIncome.amount'].$gte = minAnnualIncome;
            }
            if (maxAnnualIncome) {
                query['annualIncome.amount'].$lte = maxAnnualIncome;
            }
        }

        const skip = (page - 1) * limit;

        // Execute query with pagination
        const users = await User.find(query, userField)
            .sort({ 'createdAt': -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(20000);

        // Get total count if requested
        let totalCount: number | undefined = undefined;
        if (shouldCount === 'yes') {
            totalCount = await User.countDocuments(query).maxTimeMS(10000);
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

        // Cache response for 1 minute
        res.set('Cache-Control', 'public, max-age=60');

        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination,
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





export default router;