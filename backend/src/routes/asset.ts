/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Router, Request, Response } from "express";
import { upload } from "../config/multer";
import { Asset, AssetType } from "../models/asset";
import { UploadImageAsset, detroyAsset } from "../lib/core/Asset";
import { createAssetSchema } from "../lib/schema/Assets";
import fs from 'fs/promises';
import path from 'path';

const router: Router = Router();

// Type for handling multer files in request
interface MulterRequest extends Request {
    files: Express.Multer.File[];
}

router.post('/upload/image', upload.array('images', 1), async function (req: Request, res: Response): Promise<any> {
        try {
            let files = (req as MulterRequest).files;
            
            if (!files || files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No files were uploaded"
                });
            }

            const uploadedAssets = [];
            const errors = [];

            // Process each file
            for (const file of files) {
                try {
                    const validationResult = createAssetSchema.safeParse({
                        name: file.originalname,
                        asset_type: AssetType.IMAGE,
                        file: file
                    });

                    if (!validationResult.success) {
                        errors.push({
                            filename: file.originalname,
                            error: validationResult.error.errors
                        });
                        continue;
                    }

                    // Upload to Cloudinary
                    const cloudinaryResponse = await UploadImageAsset(file.path);

                    // Create asset record
                    const asset = await Asset.create({
                        name: file.originalname,
                        path: cloudinaryResponse.path,
                        url: cloudinaryResponse.url,
                        asset_type: AssetType.IMAGE,
                        id: cloudinaryResponse.public_id,
                        size: file.size
                    });

                    uploadedAssets.push({
                        id: asset.id,
                        url: asset.url,
                        name: asset.name
                    });

                    // Clean up local file
                    await fs.unlink(file.path);

                } catch (error) {
                    console.error(`Error processing file ${file.originalname}:`, error);
                    errors.push({
                        filename: file.originalname,
                        error: 'Failed to process file'
                    });

                    // Clean up local file in case of error
                    try {
                        await fs.unlink(file.path);
                    } catch (unlinkError) {
                        console.error('Error deleting local file:', unlinkError);
                    }
                }
            }

            // Return response based on upload results
            if (uploadedAssets.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "All uploads failed",
                    errors
                });
            }

            return res.status(200).json({
                success: true,
                message: errors.length > 0 ? "Some files were uploaded successfully" : "All files uploaded successfully",
                data: {
                    assets: uploadedAssets,
                    errors: errors.length > 0 ? errors : undefined
                }
            });

        } catch (error) {
            console.error('Image upload error:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
);


export default router;