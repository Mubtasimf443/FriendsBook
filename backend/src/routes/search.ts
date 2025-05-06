/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Router, Request, Response, } from "express";
import rateLimiter from "../config/rateRimiter";
import { validateUser } from "../lib/middlewares/auth.middleware";
import { IAuthSession } from "../models/AuthSession";
import { CountryNamesEnum } from "../lib/types/country_names.enum";
import { findNearestDistricts } from "../controllers/search.controller";
import { User } from "../models/user";
import { justJoinedSchema, limitValidation, notViewedSchema, onlineUsersSchema, searchQuertSchema, todaysMatchSchema } from "../lib/schema/search.schema";
import { ProfileView } from "../models/ProfileView";

const router: Router = Router();

router.use(rateLimiter(120 * 1000, 200));
router.use(validateUser);

declare global {
    namespace Express {
        interface Request {
            authSession: IAuthSession;
            bearerAccessToken?: string;
        }
    }
}

let userField = 'name _id address email age isEducated education address religion languages';

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
            'gender': { $ne: userData.gender }, // Basic preference matching
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
            'onlineStatus.isOnline': true
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







export default router;