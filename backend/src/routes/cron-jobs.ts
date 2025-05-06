/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Router, Request, Response } from "express";
import { User } from "../models/user";
import { subMinutes } from 'date-fns';
import rateLimiter from "../config/rateRimiter";
import { JOB_SECRET as jobSecret} from "../config/env";
import { updateOnlineStatusSchema } from "../lib/schema/jobs.schema";

const router: Router = Router();


router.use(rateLimiter(60 * 1000, 10)); 

router.post('/update-online-status', async function (req: Request, res: Response): Promise<any> {
    try {
        // Validate request body
        const validationResult = updateOnlineStatusSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid request parameters",
                error: validationResult.error.errors
            });
        }

        const {secret } = validationResult.data;

        // Verify secret key
        

        if (!jobSecret || secret !== jobSecret) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

   
   

        // Update users who haven't been active
        const result = await User.updateMany(
            {
                'onlineStatus.isOnline': true,
                'onlineStatus.lastActive': { $lt: new Date(Date.now()- 5 * 60 * 1000 )  } // Every 5 minute
            },
            {
                $set: {
                    'onlineStatus.isOnline': false,
                    'onlineStatus.lastSeen': new Date()
                }
            }
        );

        return res.status(200).json({
            success: true,
            data: {
                modifiedCount: result.modifiedCount,
                matchedCount: result.matchedCount,
            }
        });

    } catch (error) {
        console.error('Update online status job error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

export default router;