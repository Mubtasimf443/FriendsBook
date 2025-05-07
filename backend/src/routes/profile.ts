/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Router, Response, Request } from "express";
import { validateUser } from "../lib/middlewares/auth.middleware";
import rateLimiter from "../config/rateRimiter";
const router: Router = Router();

// Constants
const RATE_LIMIT_WINDOW_MS = 120 * 1000; // 2 minutes
const RATE_LIMIT_MAX_REQUESTS = 150;

// Apply rate limiter
router.use(rateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS));





export default router;