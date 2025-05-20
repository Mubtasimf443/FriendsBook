/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Request, Response, Router } from "express";
import { readFileSync } from "fs";
import path from "path";

const router = Router();

router.get('/coins-data' ,  async function (req: Request, res: Response): Promise<any> {
    try {
        let data: any = JSON.parse(readFileSync(path.join(__dirname, '../../data/coin.packages.json'), 'utf-8'));
        return res.status(200).json({
            success: true,
            data: {
                coin_packages: data
            }
        });
    } catch (error) {
        console.error('[/coins/pricing api error]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});




export default router;
