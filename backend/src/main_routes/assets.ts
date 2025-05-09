/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Router, Request, Response } from "express";
import { upload } from "../config/multer";
import { Asset, AssetType, IAsset } from "../models/asset";
// import { UploadImageAsset, detroyAsset } from "../lib/core/Asset";
import { createImageAssetSchema } from "../lib/schema/asset.schema";
import fs from 'fs/promises';
import path from 'path';
import { ZodError } from "zod";
import rateLimiter from "../config/rateRimiter";
import { validateUser } from "../lib/middlewares/auth.middleware";

import cloudinary from "../config/cloudinary";
import { UploadApiResponse } from "cloudinary";


const router: Router = Router();
router.use(rateLimiter(120 * 1000, 120));
router.use(validateUser)


router.post('/upload/image', upload.single('image'), async function (req: Request, res: Response): Promise<any> {
    const file = req.file;

    // Early return if no file
    if (!file) {
        return res.status(400).json({
            success: false,
            message: "No image file was provided",
            error: "Missing required file upload"
        });
    }

    const cleanup = async (): Promise<void> => {
        try {
            if (file.path) {
                await fs.unlink(file.path);
            }
        } catch (error) {
            console.error(`Failed to cleanup file ${file.originalname}:`, error);
        }
    };
    try {
        const validationResult = createImageAssetSchema.safeParse({
            name: file.originalname,
            asset_type: AssetType.IMAGE,
            file: {
                size: file.size,
                mimetype: file.mimetype,
                originalname: file.originalname
            }
        });

       

        if (!validationResult.success) {
            await cleanup();
            return res.status(400).json({
                success: false,
                message: "Image validation failed",
                error: validationResult.error.errors.map(err => err.message).join(', ')
            });
        }

        // Upload to Cloudinary
        let r :UploadApiResponse= await cloudinary.uploader.upload(file.path , {
                unique_filename : true,
                resource_type : 'image',
                transformation: ["media_lib_thumb"]
            });
        
        if (!r.public_id ||  !r.url ) {

            await cleanup();
            return res.status(422).json({
                success: false,
                message: "Failed to upload image to cloud storage",
            });
        }

        // Create asset record
        const asset = await Asset.create({
            name: file.originalname,
            url: r.url,
            asset_type: AssetType.IMAGE,
            size: file.size,
            uploadInfo: {
                host: 'cloudinary',
                host_id: r.public_id,
                path: r.url
            }
        });

       // Cleanup temporary file
        await cleanup();

        // Return success response
        return res.status(201).json({
            success: true,
            message: "Image uploaded successfully",
            data: {
                asset: {
                    id: asset.id,
                    url: asset.url,
                    name: asset.name || file.originalname,
                    size: asset.size || file.size,
                    type: asset.asset_type
                }
            }
        });
    } catch (error) {
        await cleanup().catch((_) => {});

        // Handle specific error types
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                error: error.errors.map(e => e.message).join(', ')
            });
        }

        console.error('Image upload error:', error);

        // Return generic error response
        return res.status(500).json({
            success: false,
            message: "Failed to process image upload",
            error: "Internal server error during upload process"
        });
    }
}
);

export default router;