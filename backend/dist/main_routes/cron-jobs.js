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
const user_1 = require("../models/user");
const rateRimiter_1 = __importDefault(require("../config/rateRimiter"));
const env_1 = require("../config/env");
const jobs_schema_1 = require("../lib/schema/jobs.schema");
const router = (0, express_1.Router)();
router.use((0, rateRimiter_1.default)(60 * 1000, 10));
router.post('/update-online-status', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Validate request body
            const validationResult = jobs_schema_1.updateOnlineStatusSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid request parameters",
                    error: validationResult.error.errors
                });
            }
            const { secret } = validationResult.data;
            // Verify secret key
            if (!env_1.JOB_SECRET || secret !== env_1.JOB_SECRET) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized"
                });
            }
            // Update users who haven't been active
            const result = yield user_1.User.updateMany({
                'onlineStatus.isOnline': true,
                'onlineStatus.lastActive': { $lt: new Date(Date.now() - 5 * 60 * 1000) } // Every 5 minute
            }, {
                $set: {
                    'onlineStatus.isOnline': false,
                    'onlineStatus.lastSeen': new Date()
                }
            });
            return res.status(200).json({
                success: true,
                data: {
                    modifiedCount: result.modifiedCount,
                    matchedCount: result.matchedCount,
                }
            });
        }
        catch (error) {
            console.error('Update online status job error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    });
});
exports.default = router;
