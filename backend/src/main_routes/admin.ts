/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Request, Response, Router } from "express";

const router : Router = Router();


router.get('/membership-request' ,async function (req : Request , res : Response) :Promise<any>{
    try {
        
    } catch (error) {
        console.error('[]', error);
        return res.status(500).json({
           success: false,
           message: 'Internal server error',
           data: null
        });
    }
});



router.put('/membership-request' ,async function (req : Request , res : Response) :Promise<any>{
    try {
        
    } catch (error) {
        console.error('[]', error);
        return res.status(500).json({
           success: false,
           message: 'Internal server error',
           data: null
        });
    }
});



export default  router;