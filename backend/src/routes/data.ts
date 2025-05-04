/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ InshaAllah
*/

import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { giveLocationData } from "../controllers/data.controller";



const router: Router = Router();
router.use(function(req: Request, res: Response, next : NextFunction){
    res.set("cache-control", "max-age=3600, public");
    next();
    return;
});



router.get("/location/divisions", async function (req: Request, res: Response): Promise<any> {
    try {
        let divisions =await giveLocationData('division');
        res.status(200).json({
            success: true,
            message: "ok",
            data: divisions
        })
        return;
    } catch (error) {
        console.error("division location data error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null
        });
        return;
    }
});

router.get("/location/districts", async function (req: Request, res: Response): Promise<any> {
    try {
        let divisionSchema = z.number().gte(1).lte(8)
        let { success, error, data } = await divisionSchema.safeParseAsync(Number(req.query.division_id))
        if (error) {
            res.status(400).json({
                success: false,
                error: error.errors[0].message,
                errorDetails: error
            });
            return;
        }

        if (success && data) {
            interface IDistrict {
                id: string;
                division_id: string;
                name: string;
                bn_name: string;
                lat: string;
                long: string;
            }

            let districts: any[] = await giveLocationData('district');;

            districts = districts.filter(function (element: IDistrict): object | undefined {
                if (element.division_id === String(data)) {
                    return element;
                }
            });
            
            res.status(200).json({
                success: true,
                data: districts
            })
            return;
        }
    } catch (error) {
        console.error("district location data error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null
        });
        return;;
    }
});

router.get("/location/upazilas", async function (req: Request, res: Response): Promise<any> {
    try {
        let districtSchema = z.number().positive().gte(1).lte(64);
        let { success, error, data } = await districtSchema.safeParseAsync(Number(req.query.district_id))
        if (error) {
            res.status(400).json({
                success: false,
                error: error.errors[0].message
            });
            return;
        }

        if (success && data) {
            interface IUpazila {
                id: string;
                district_id: string;
                name: string;
                bn_name: string;
            }
            let upazilas: any[] = await giveLocationData('upazilas');

            upazilas = upazilas.filter(function (element: IUpazila): object | undefined {
                if (element.district_id === String(data)) {
                    return element;
                }
            });
            res.status(200).json({
                success: true,
                data: upazilas
            })
            return;
        }
    } catch (error) {
        console.error("upazila location data error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null
        });
        return;
    }
});


router.get("/location/unions", async function (req: Request, res: Response): Promise<any> {
    try {
        let upazilaSchema = z.number().positive().gte(1).lte(491)
        let { success, error, data } = await upazilaSchema.safeParseAsync(Number(req.query.upazila_id))
        if (error) {
            res.status(400).json({
                success: false,
                error: error.errors[0].message
            });
            return;
        }

        if (success && data) {
            interface ICity {
                id: string;
                upazilla_id: string;
                name: string;
                bn_name: string;
            }
            let cities: ICity[] = await giveLocationData('unions')

            cities = cities.filter(function (element: ICity): object | undefined {
                if (element.upazilla_id === String(data)) {
                    return element;
                }
            });
            res.status(200).json({
                success: true,
                data: cities
            })
            return;
        }
    } catch (error) {
        console.error("city location data error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null
        });
        return;
    }
})


export default router;