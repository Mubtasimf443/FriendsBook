/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Router, Response, Request } from "express";
import { validateUser } from "../lib/middlewares/auth.middleware";
import rateLimiter from "../config/rateRimiter";
import { educationLevelValidator } from "../lib/schema/profile.schema";
import getEducationCertificates from "../lib/core/getEducationCertificates";
import { ApiResponse } from "../lib/types/api.response";
import { EducationLevel } from "../lib/types/userEducation.types";

const router: Router = Router();

// Constants
const RATE_LIMIT_WINDOW_MS = 120 * 1000; // 2 minutes
const RATE_LIMIT_MAX_REQUESTS = 250;

// Apply rate limiter
router.use(rateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS));

router.get('/certificates', async function (req: Request, res: Response): Promise<Response | any>  {
    const validationResult = await educationLevelValidator.safeParseAsync(req.query.education_level);
    
    if (!validationResult.success) {
        return res.status(400).json({
            success: false,
            message: "Invalid education level provided",
            errors: validationResult.error.errors.map(err => ({
                path: err.path.join('.'),
                message: err.message
            }))
        } as ApiResponse<null>);
    }

    const educationLevel = validationResult.data as EducationLevel;
    const certificates = getEducationCertificates(educationLevel);

    return res.status(200).json({
        success: true,
        message: `Certificates for ${educationLevel}`,
        data: { certificates }
    } as ApiResponse<{ certificates: unknown[] }>);
});

 

export default router;