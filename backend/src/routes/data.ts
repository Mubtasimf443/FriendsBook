/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ InshaAllah
*/

import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ICity, IDistrict, IUpazila } from "../lib/types/LocationTypes";
import { Unions } from "../lib/data/unions";
import { Upazilas } from "../lib/data/upazilas";
import { Districts } from "../lib/data/districts";
import { Divisions } from "../lib/data/divisions";
import countryNames from "../lib/data/countries";



const router: Router = Router();
router.use(function(req: Request, res: Response, next : NextFunction){
    res.set("cache-control", "max-age=3600, public");
    next();
    return;
});

router.get("/location/country-names", async function (req: Request, res: Response): Promise<any> {
    return res.status(200).json({ success: true, message: "ok", data: {names : countryNames } })
});

router.get("/location/divisions", async function (req: Request, res: Response): Promise<any> {
    return res.status(200).json({ success: true, message: "ok", data: Divisions })
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
          


            let districts = Districts.filter(function (element: IDistrict): object | undefined {
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
           
            let upazilas = Upazilas.filter(function (element: IUpazila): object | undefined {
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
          
            let cities = Unions.filter(function (element: ICity): object | undefined {
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