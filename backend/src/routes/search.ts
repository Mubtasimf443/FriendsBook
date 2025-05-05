/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Router ,  Request, Response, } from "express";
import rateLimiter from "../config/rateRimiter";
import { validateUser } from "../lib/middlewares/auth.middleware";

const router :Router = Router() ;

router.use(rateLimiter(120*1000 , 200));
router.use(validateUser);

router.get('/users/matching', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        
    } catch (error) {
        console.error(`match suggestion api error:`, error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null
        });
    }
});


router.get('/users/todays-match', async function (req: Request, res: Response): Promise<Response | any> {
    try {
        
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


router.get('/users/premium', async function (req: Request, res: Response): Promise<Response | any> {
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