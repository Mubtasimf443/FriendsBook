/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Router, Response, Request } from "express";
import { validateUser } from "../lib/middlewares/auth.middleware";
import rateLimiter from "../config/rateRimiter";
import { IAuthSession } from "../models/AuthSession";
import { User } from "../models/user";
import { _idValidator } from "../lib/schema/schemaComponents";
import { formatDistanceToNow } from 'date-fns';
import { z } from 'zod';
import createHttpError from 'http-errors';
import queryMiddleware from "../lib/middlewares/query.middleware";
import { userDetailsQuerySchema } from "../lib/schema/profile.schema";

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

export default router;