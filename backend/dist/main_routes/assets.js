"use strict";
/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = require("../config/multer");
const asset_1 = require("../models/asset");
// import { UploadImageAsset, detroyAsset } from "../lib/core/Asset";
const asset_schema_1 = require("../lib/schema/asset.schema");
const promises_1 = __importDefault(require("fs/promises"));
const zod_1 = require("zod");
const rateRimiter_1 = __importDefault(require("../config/rateRimiter"));
const auth_middleware_1 = require("../lib/middlewares/auth.middleware");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const router = (0, express_1.Router)();
router.use((0, rateRimiter_1.default)(120 * 1000, 120));
router.use(auth_middleware_1.validateUser);
router.post('/upload/image', multer_1.upload.single('image'), function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const file = req.file;
        // Early return if no file
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No image file was provided",
                error: "Missing required file upload"
            });
        }
        const cleanup = () => __awaiter(this, void 0, void 0, function* () {
            try {
                if (file.path) {
                    yield promises_1.default.unlink(file.path);
                }
            }
            catch (error) {
                console.error(`Failed to cleanup file ${file.originalname}:`, error);
            }
        });
        try {
            const validationResult = asset_schema_1.createImageAssetSchema.safeParse({
                name: file.originalname,
                asset_type: asset_1.AssetType.IMAGE,
                file: {
                    size: file.size,
                    mimetype: file.mimetype,
                    originalname: file.originalname
                }
            });
            if (!validationResult.success) {
                yield cleanup();
                return res.status(400).json({
                    success: false,
                    message: "Image validation failed",
                    error: validationResult.error.errors.map(err => err.message).join(', ')
                });
            }
            // Upload to Cloudinary
            let r = yield cloudinary_1.default.uploader.upload(file.path, {
                unique_filename: true,
                resource_type: 'image',
                transformation: ["media_lib_thumb"]
            });
            if (!r.public_id || !r.url) {
                yield cleanup();
                return res.status(422).json({
                    success: false,
                    message: "Failed to upload image to cloud storage",
                });
            }
            // Create asset record
            const asset = yield asset_1.Asset.create({
                name: file.originalname,
                url: r.url,
                asset_type: asset_1.AssetType.IMAGE,
                size: file.size,
                uploadInfo: {
                    host: 'cloudinary',
                    host_id: r.public_id,
                    path: r.url
                }
            });
            // Cleanup temporary file
            yield cleanup();
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
        }
        catch (error) {
            yield cleanup().catch((_) => { });
            // Handle specific error types
            if (error instanceof zod_1.ZodError) {
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
    });
});
exports.default = router;
