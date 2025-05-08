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
import { MembershipRequest } from "../models/membershipRequest";
import { MembershipRequestStatus } from "../lib/types/memberdship.types";
import { membershipRequestQuerySchema, membershipRequestSchema } from "../lib/schema/membership.schema";

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


router.post('/membership-request' , async function (req: Request, res: Response): Promise<any> {
    try {
        const userId = req.authSession.value.userId;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                data: null
            });
        }

        const pendingRequest = await MembershipRequest.findOne({
            requesterID: userId,
            requestStatus: MembershipRequestStatus.PENDING
        });

        if (pendingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending membership request',
                data: null
            });
        }

        let db_user =await User.findById(userId , 'membership');

        if (!db_user ) {
            res.status(401).json({
                success: false,
                message: 'Could not find The User Account',
                data: null
            });
            return;
        }


        if (db_user.hasActiveMembership()) {
            res.status(400).json({
                success: false,
                message: 'User Already has an active membership, You can not request membership when User has a membership active',

                data: null
            });
            return;
        }



        // // Validate request body
        const validatedData = await membershipRequestSchema.parseAsync(req.body);
        const startDate = new Date(validatedData.startDate);

        // Create membership request
        const membershipRequest = new MembershipRequest({
            ...validatedData,
            startDate,
            requesterID: userId,
            requestStatus: MembershipRequestStatus.PENDING,
            requestDate: new Date(),
            endDate: new Date(startDate.getTime() + validatedData.duration * 30 * 24 * 60 * 60 * 1000)
        });

        await membershipRequest.save();

        return res.status(201).json({
            success: true,
            message: 'Membership request created successfully',
            data: membershipRequest
        });

    } catch (error) {
        console.error('[Membership Request API Error]', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });

        if (error instanceof z.ZodError) {
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

// // GET /membership-request - Get membership request history
router.get('/membership-request', validateUser, async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const userId = req.authSession.value.userId;
        
        // Validate query parameters
        const validationResult = membershipRequestQuerySchema.safeParse(req.query);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                error: validationResult.error.errors,
                data: null
            });
        }

        const { page, limit, status, count: shouldCount } = validationResult.data;

        // Build query
        const query: any = { requesterID: userId };
        if (status && status !== 'all') {
            query.requestStatus = status;
        }

        // Execute query with pagination
        const requests = await MembershipRequest.find(query)
            .sort({ requestDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean()
            .maxTimeMS(10000); // Set maximum execution time

        // Get total count if requested
        let totalCount: number | undefined;

        if (shouldCount === 'yes') {
            totalCount = await MembershipRequest.countDocuments(query)
                .maxTimeMS(5000);
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
                totalRequests: totalCount
            };
        }

        // Set cache headers
        res.set('Cache-Control', 'private, max-age=30'); // Cache for 30 seconds, private because it's user-specific

        return res.status(200).json({
            success: true,
            data: {
                requests,
                pagination,
                filterCriteria: {
                    status
                }
            }
        });

    } catch (error) {
        console.error('[Get Membership History API Error]', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
            userId: req.authSession?.value?.userId
        });

        if (error instanceof z.ZodError) {
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

// PUT /membership-request/cancel - Cancel pending membership request
router.put('/membership-request/cancel', validateUser, async function (req: Request, res: Response): Promise<any> {
    try {
        const userId = req.authSession.value.userId;

        const membershipRequest = await MembershipRequest.findOne({
            requesterID: userId,
            requestStatus: MembershipRequestStatus.PENDING
        });

        if (!membershipRequest) {
            return res.status(404).json({
                success: false,
                message: 'No pending membership request found',
                data: null
            });
        }

        membershipRequest.cancel();
        await membershipRequest.save();

        return res.status(200).json({
            success: true,
            message: 'Membership request cancelled successfully',
            data: membershipRequest
        });

    } catch (error) {
        console.error('[Cancel Membership Request API Error]', {
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

// DELETE /membership-request - Delete cancelled membership request
router.delete('/membership-request', validateUser, async function (req: Request, res: Response): Promise<any> {
    try {
        const userId = req.authSession.value.userId;

        const membershipRequest = await MembershipRequest.findOne({
            requesterID: userId,
            requestStatus: MembershipRequestStatus.CANCELLED
        });

        if (!membershipRequest) {
            return res.status(404).json({
                success: false,
                message: 'No cancelled membership request found',
                data: null
            });
        }

        await membershipRequest.deleteOne();

        return res.status(200).json({
            success: true,
            message: 'Membership request deleted successfully',
            data: null
        });

    } catch (error) {
        console.error('[Delete Membership Request API Error]', {
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




export default router;