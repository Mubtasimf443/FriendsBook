/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import express, { Router, Request, Response } from "express";
import { User } from "../models/user";
import { ShortList } from "../models/ShortList";
import { ProfileView } from "../models/ProfileView";
import { z } from "zod";
import { _idValidator } from "../lib/schema/schemaComponents";

const router: Router = express.Router();




// Add to shortlist
router.post('/users/short-list/add', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const shortListSchema = z.object({
            shortListedId: _idValidator
        });        
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

// Mark user as online
router.put('/users/online/active', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        const userId = req.authSession.value.userId;

        await User.findByIdAndUpdate(userId, {
            'onlineStatus.isOnline': true,
            'onlineStatus.lastActive': new Date(),
            'onlineStatus.lastSeen': new Date()
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

export default router;