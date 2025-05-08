/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import express, { Router, Request, Response } from "express";
import { User } from "../models/user";
import { ShortList } from "../models/ShortListedProfiles";
import { ProfileView } from "../models/ProfileView";
import { z } from "zod";
import { _idValidator } from "../lib/schema/schemaComponents";
import { 
    shortListSchema ,
    likeProfileSchema ,
    sendMailSchema,
    sendSmsSchema,
    activityHistorySchema
} from "../lib/schema/activity.schema";
import { LikedProfile } from "../models/LikedProfile";
import { SmsSendedProfile } from "../models/SmsSendedProfile";
import { SendMailedProfile } from "../models/SendMailedProfile";


const router: Router = express.Router();




// Add to shortlist
router.post('/users/short-list/add', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const validation = shortListSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid input",
                errors: validation.error.errors
            });
        }

        const userId = req.authSession.value.userId;
        const { shortListedId } = validation.data;

        // Check if shortListedId exists and is not suspended
        const shortListedUser = await User.findOne({
            _id: shortListedId,
            isSuspended: false
        });

        if (!shortListedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found or is suspended"
            });
        }

        // Prevent self-shortlisting
        if (userId === shortListedId) {
            return res.status(400).json({
                success: false,
                message: "You cannot shortlist yourself"
            });
        }

        // Create or update shortlist entry
        await ShortList.findOneAndUpdate(
            { shortListerId : userId, shortListedId },
            { shortListedAt: new Date() },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Profile added to shortlist"
        });

    } catch (error) {
        console.error("Shortlist error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

router.delete('/users/short-list/remove', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const validation = shortListSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid input",
                errors: validation.error.errors
            });
        }

        const userId = req.authSession.value.userId;
        const { shortListedId } = validation.data;

        // Find and delete the shortlist entry
        const deletedEntry = await ShortList.findOneAndDelete({
            userId,
            shortListedId
        });

        if (!deletedEntry) {
            return res.status(404).json({
                success: false,
                message: "Profile was not in your shortlist"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile removed from shortlist"
        });

    } catch (error) {
        console.error("Remove from shortlist error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Mark user as online
router.put('/users/online/active', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const userId = req.authSession.value.userId;

        await User.findByIdAndUpdate(userId, {
            'onlineStatus.isOnline': true,
            'onlineStatus.lastActive': new Date(),
        });

        return res.status(200).json({
            success: true,
            message: "User marked as online"
        });

    } catch (error) {
        console.error("Online status update error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});
// Mark user as offline
router.put('/users/online/in-active', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const userId = req.authSession.value.userId;

        await User.findByIdAndUpdate(userId, {
            'onlineStatus.isOnline': false,
            'onlineStatus.lastSeen': new Date()
        });

        return res.status(200).json({
            success: true,
            message: "User marked as offline"
        });

    } catch (error) {
        console.error("Offline status update error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});
// Record profile visit
router.post('/users/visit-profile', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const visitProfileSchema = z.object({
            visitedId: _idValidator,
        });
        const validation = visitProfileSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid input",
                errors: validation.error.errors
            });
        }

        const viewerId = req.authSession.value.userId;
        const { visitedId } = validation.data;


        // Check if visited profile exists and is not suspended
        const visitedUser = await User.findOne({
            _id: visitedId,
            isSuspended: false
        });

        if (!visitedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found or is suspended"
            });
        }

        // Prevent self-view recording
        if (viewerId === visitedId) {
            return res.status(400).json({
                success: false,
                message: "Self-view not recorded"
            });
        }

        // Find existing profile view or create new one
        const existingView = await ProfileView.findOne({ viewerId, viewedId: visitedId });

        if (existingView) {
            // Add new timestamp to existing viewedAt array
            existingView.viewedAt.push(new Date());
            await existingView.save();
        } else {
            // Create new profile view record
            await ProfileView.create({
                viewerId,
                viewedId: visitedId,
                viewedAt: [new Date()]
            });
        };

        return res.status(200).json({
            success: true,
            message: "Profile visit recorded"
       });

    } catch (error) {
        console.error("Profile visit error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});


router.post('/users/like-profile', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const validation = likeProfileSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid input",
                errors: validation.error.errors
            });
        }

        const likerId = req.authSession.value.userId;
        const { likedId } = validation.data;

        // Check if liked profile exists and is not suspended
        const likedUser = await User.findOne({
            _id: likedId,
            'suspension.isSuspended': false
        });

        if (!likedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found or is suspended"
            });
        }

        // Prevent self-like recording
        if (likerId === likedId) {
            return res.status(400).json({
                success: false,
                message: "Self-like not allowed"
            });
        }

        // Find existing like or create new one
        const existingLike = await LikedProfile.findOne({ likerId, likedId });

        if (existingLike) {
            // Add new timestamp to existing likedAt array
            existingLike.likedAt.push(new Date());
            await existingLike.save();
        } else {
            // Create new like record
            await LikedProfile.create({
                likerId,
                likedId,
                likedAt: [new Date()]
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile like recorded"
        });

    } catch (error) {
        console.error("[Profile like error]:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Record email sent to profile
router.post('/users/send-mail', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const validation = sendMailSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid input",
                errors: validation.error.errors
            });
        }

        const senderId = req.authSession.value.userId;
        const { receiverId, message } = validation.data;

        // Check if receiver exists and is not suspended
        const receiverUser = await User.findOne({
            _id: receiverId,
            'suspension.isSuspended': false
        });

        if (!receiverUser) {
            return res.status(404).json({
                success: false,
                message: "User not found or is suspended"
            });
        }

        // Prevent sending mail to self
        if (senderId === receiverId) {
            return res.status(400).json({
                success: false,
                message: "Cannot send mail to yourself"
            });
        }

        // Find existing mail record or create new one
        const existingMail = await SendMailedProfile.findOne({ senderId, receiverId });

        if (existingMail) {
            // Add new timestamp to existing emailedAt array
            existingMail.emailedAt.push(new Date());
            await existingMail.save();
        } else {
            // Create new mail record
            await SendMailedProfile.create({
                senderId,
                receiverId,
                emailType: 'INTEREST',
                emailStatus: 'PENDING',
                emailedAt: [new Date()]
            });
        }

        // TODO: Implement actual email sending logic here
        // This would typically involve a messaging queue and separate worker

        return res.status(200).json({
            success: true,
            message: "Email queued for sending"
        });

    } catch (error) {
        console.error("[Send mail error]:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Record SMS sent to profile
router.post('/users/send-sms', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const validation = sendSmsSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid input",
                errors: validation.error.errors
            });
        }

        const senderId = req.authSession.value.userId;
        const { receiverId, message } = validation.data;

        // Check if receiver exists and is not suspended
        const receiverUser = await User.findOne({
            _id: receiverId,
            'suspension.isSuspended': false
        });

        if (!receiverUser) {
            return res.status(404).json({
                success: false,
                message: "User not found or is suspended"
            });
        }

        // Prevent sending SMS to self
        if (senderId === receiverId) {
            return res.status(400).json({
                success: false,
                message: "Cannot send SMS to yourself"
            });
        }

        // Find existing SMS record or create new one
        const existingSms = await SmsSendedProfile.findOne({ senderId, receiverId });

        if (existingSms) {
            // Add new timestamp to existing sentAt array
            existingSms.sentAt.push(new Date());
            await existingSms.save();
        } else {
            // Create new SMS record
            await SmsSendedProfile.create({
                senderId,
                receiverId,
                smsType: 'INTEREST',
                smsStatus: 'PENDING',
                sentAt: [new Date()]
            });
        }

        // TODO: Implement actual SMS sending logic here
        // This would typically involve an SMS gateway service

        return res.status(200).json({
            success: true,
            message: "SMS queued for sending"
        });

    } catch (error) {
        console.error("[Send SMS error]:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Activity history endpoint
router.get('/users/activity-history', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        // Validate query parameters using the schema
        const validationResult = activityHistorySchema.safeParse(req.query);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                errors: validationResult.error.errors,
                data: null
            });
        }

        const { page, limit, count: shouldCount, type } = validationResult.data;
        const userId = req.authSession.value.userId;

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Define query configuration based on activity type
        const queryConfig :any = {
            likes: {
                model: LikedProfile,
                query: { likerId: userId },
                sort: { 'likedAt': -1 },
                populate: { path: 'likedId', select: 'name profileImage' },
                timestamp: 'likedAt'
            },
            emails: {
                model: SendMailedProfile,
                query: { senderId: userId },
                sort: { 'emailedAt': -1 },
                populate: { path: 'receiverId', select: 'name profileImage' },
                timestamp: 'emailedAt'
            },
            sms: {
                model: SmsSendedProfile,
                query: { senderId: userId },
                sort: { 'sentAt': -1 },
                populate: { path: 'receiverId', select: 'name profileImage' },
                timestamp: 'sentAt'
            }
        };

        const config :any= queryConfig[type];

        // Execute queries with error handling and timeouts
        const [activities, total] = await Promise.all([
            config.model.find(config.query)
                .sort(config.sort)
                .skip(skip)
                .limit(limit)
                .populate(config.populate)
                .lean()
                .maxTimeMS(5000), // 5 second timeout

            shouldCount === 'yes'
                ? config.model.countDocuments(config.query).maxTimeMS(3000)
                : Promise.resolve(undefined)
        ])
            .catch(error => {
                console.error(`[Activity history query error] type: ${type}`, error);
                throw new Error('Database query failed');
            });

        // Prepare pagination info
        let pagination: Record<string, any> = {
            currentPage: page,
            pageSize: limit,
        };

        if (total !== undefined) {
            pagination = {
                ...pagination,
                totalPages: Math.ceil(total / limit),
                totalActivities: total
            };
        }

        // Add cache headers for better performance
        // Cache for 1 minute since activity data can change frequently
        res.set('Cache-Control', 'private, max-age=60');

        return res.status(200).json({
            success: true,
            data: {
                type,
                activities: activities,
                pagination
            }
        });

    } catch (error) {
        // Enhanced error logging
        console.error('[Activity history error]', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            userId: req.authSession?.value?.userId,
            query: req.query,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: 'ACTIVITY_HISTORY_ERROR',
            data: null
        });
    }
});









export default router;