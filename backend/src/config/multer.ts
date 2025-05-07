/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req: Request, file: Express.Multer.File, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req: Request, file: Express.Multer.File, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(new Error('Invalid file type. Only JPEG, PNG, JPG, and WEBP files are allowed.'));
        return;
    }
    cb(null, true);
};

// Create multer upload instance
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    },
    fileFilter: fileFilter
});