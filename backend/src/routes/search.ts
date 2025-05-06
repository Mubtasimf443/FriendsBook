/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Router, Request, Response, } from "express";
import rateLimiter from "../config/rateRimiter";
import { validateUser } from "../lib/middlewares/auth.middleware";
import { IAuthSession } from "../models/AuthSession";
import { CountryNamesEnum } from "../lib/types/country_names.enum";
import { findNearestDistricts } from "../controllers/search.controller";
import { User } from "../models/user";
import { limitValidation, searchQuertSchema, todaysMatchSchema } from "../lib/schema/search.schema";

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

let userField = 'name _id address email age isEducated education address religion languages ';



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
            .maxTimeMS(20000)
            ;

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

        return res.status(400).json({
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
        
    } catch (error) {
        console.error(`recent profile listing api error:`, error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});


router.get('/users/premioum', async function (req: Request, res: Response): Promise<Response | any> {
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


router.get('/users/not-viewed', async function (req: Request, res: Response): Promise<Response | any> {
    try {

    } catch (error) {
        console.error(`unviewed profile listing api error:`, error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});



export default router;