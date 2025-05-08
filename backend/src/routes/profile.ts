/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Router, Response, Request } from "express";
import { validateUser } from "../lib/middlewares/auth.middleware";
import rateLimiter from "../config/rateRimiter";
import { IAuthSession } from "../models/AuthSession";
import { User } from "../models/user";
import { _idValidator } from "../lib/schema/schemaComponents";
import { formatDistanceToNow } from 'date-fns';
import { array, object, z } from 'zod';
import queryMiddleware from "../lib/middlewares/query.middleware";
import { userDetailsQuerySchema } from "../lib/schema/profile.schema";
import { updateUserSchema, UpdateUserInput } from '../lib/schema/updateUser.schema';

const router: Router = Router();

// Constants
const RATE_LIMIT_WINDOW_MS = 120 * 1000; // 2 minutes
const RATE_LIMIT_MAX_REQUESTS = 150;

// Apply rate limiter
router.use(rateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS));
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

router.get('/user-details', async function (req: Request, res: Response): Promise<Response | any> {
    try {
       
        if (typeof req.query.fields === 'string') req.query.fields = [req.query.fields];

        const { fields } = await userDetailsQuerySchema.parseAsync(req.body);
        
        // Parse and validate user ID
        const userId = await _idValidator.parseAsync(req.authSession.value.userId);

        // Default fields if none specified
        const selectedFields = fields 

        // Fetch user details
        const user = await User.findById(userId).select(selectedFields).lean();

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User details not found',
                data: null
            });
            return;
        }

        // Format user details
        const userDetails :any= user;

        return res.status(200).json({
            success: true,
            data: {
                userDetails
            },
            error: null,
            message: 'User details retrieved successfully'
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request parameters',
                error: error.errors,
                data: null
            });
        }

        console.error("[Profile Details API Error]", {
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: 'InternalServerError',
            data: null
        });
    }
});

router.put('/user-details', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        // 1. Parse and validate request body
        const updateData = await updateUserSchema.parseAsync(req.body);
        
        // 2. Get user ID from auth session
        const userId = req.authSession.value.userId;

        let updatesData: any = {};
      
        // Basic Information
        if (updateData.name) updatesData['name'] = updateData.name;
        if (updateData.gender) updatesData['gender'] = updateData.gender;
        if (updateData.dateOfBirth) updatesData['dateOfBirth'] = updateData.dateOfBirth;
        if (updateData.age) updatesData['age'] = updateData.age;
        if (updateData.weight) updatesData['weight'] = updateData.weight;
        if (updateData.height) updatesData['height'] = updateData.height;
        if (updateData.maritalStatus) updatesData['maritalStatus'] = updateData.maritalStatus;
        

        if (updateData.phoneInfo) updatesData['phoneInfo'] = updateData.phoneInfo;
        if (updateData.address) updatesData['address'] = updateData.address;
        
        // Background Information
        if (updateData.religion) updatesData['religion'] = updateData.religion;
        if (updateData.languages) updatesData['languages'] = updateData.languages;
        
        // Education & Career
        if (updateData.isEducated !== undefined) updatesData['isEducated'] = updateData.isEducated;
        if (updateData.education) updatesData['education'] = updateData.education;
        if (updateData.occupation) updatesData['occupation'] = updateData.occupation;
        if (updateData.annualIncome) updatesData['annualIncome'] = updateData.annualIncome;
        
        // Profile Media
        if (updateData.profileImage) updatesData['profileImage'] = updateData.profileImage;
        if (updateData.coverImage) updatesData['coverImage'] = updateData.coverImage;
        // if (updateData.userImages) updatesData['userImages'] = updateData.userImages;
        
        // Additional Information
        if (updateData.aboutMe) updatesData['aboutMe'] = updateData.aboutMe;
        if (updateData.familyInfo) updatesData['familyInfo'] = updateData.familyInfo;
        
        // Preferences
        if (updateData.preferences) updatesData['preferences'] = updateData.preferences;
        
        // Settings
        if (updateData.enhancedSettings) updatesData['enhancedSettings'] = updateData.enhancedSettings;

        // Filter out undefined values
        updatesData = Object.fromEntries(
            Object.entries(updatesData).filter(([_, value]) => value !== undefined)
        );

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
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updatesData },
            { 
                new: true, // Return the updated document
                runValidators: true // Run model validators
            }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                data: null
            });
        }


        return res.status(200).json({
            success: true,
            message: 'User details updated successfully',
            data: updatedUser
        });

    } catch (error: any) {
        console.error('[User Details Update api error]', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });
        
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                data: null,
                errors: error.errors
            });
        }

        if (error?.code === 11000) { 
            return res.status(409).json({
                success: false,
                message: 'MongoDB duplicate key error',
                data: null,
                error: Object.keys(error.keyPattern).join(', ') + ' already exists'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});



router.get('/membership-request' , async function (req : Request , res : Response) :Promise<any>{ 
    try {
        
    } catch (error) {
        console.error('[get Membership request api]', error);
        return res.status(500).json({
           success: false,
           message: 'Internal server error',
           data: null
        });
    }
})





router.post('/membership-request' , async function (req : Request , res : Response) :Promise<any>{ 
    try {
        
    } catch (error) {
        console.error('[post Membership request api error]', error);
        return res.status(500).json({
           success: false,
           message: 'Internal server error',
           data: null
        });
    }
})


router.delete('/membership-request' , async function (req : Request , res : Response) :Promise<any>{ 
    try {
        
    } catch (error) {
        console.error('[delete Membership request api error]', error);
        return res.status(500).json({
           success: false,
           message: 'Internal server error',
           data: null
        });
    }
});



export default router;