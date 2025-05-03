/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Router } from "express";
import rateLimiter from "../config/rateRimiter";
import { validateUser } from "../lib/middlewares/auth.middleware";

const router :Router = Router() ;

router.use(rateLimiter(120*1000 , 200));
router.use(validateUser)




export default router;