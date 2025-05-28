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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../lib/middlewares/auth.middleware");
const schemaComponents_1 = require("../lib/schema/schemaComponents");
const SendMailedProfile_1 = require("../models/SendMailedProfile");
const user_1 = require("../models/user");
const membershipRequest_1 = require("../models/membershipRequest");
const ShortListedProfiles_1 = require("../models/ShortListedProfiles");
const router = (0, express_1.Router)();
router.post('/mail-history/:mailed_user_id', auth_middleware_1.validateUser, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            let mailed_user_id = schemaComponents_1._idValidator.parse(req.params.mailed_user_id);
            let user_id = (_a = req.authSession) === null || _a === void 0 ? void 0 : _a.value.userId;
            yield SendMailedProfile_1.SendMailedProfile.create({
                receiverId: mailed_user_id,
                senderId: user_id,
            });
            return res.sendStatus(201);
        }
        catch (error) {
            console.error(error);
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid request parameters',
                    error: error.errors,
                    data: null
                });
                return;
            }
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.get('/mail-history', auth_middleware_1.validateUser, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            let mailes = yield SendMailedProfile_1.SendMailedProfile.find({ senderId: (_a = req.authSession) === null || _a === void 0 ? void 0 : _a.value.userId }).sort({ emailedAt: -1 }).populate('receiverId', 'name _id profileImage').lean();
            for (let i = 0; i < mailes.length; i++) {
                let receiver = mailes[i].receiverId;
                delete mailes[i].receiverId;
                mailes[i]['receiver'] = receiver;
            }
            mailes.length === 0 ? res.sendStatus(204) : res.status(200).json(mailes);
            return;
        }
        catch (error) {
            console.error(error);
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid request parameters',
                    error: error.errors,
                    data: null
                });
                return;
            }
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.all('/short-list', auth_middleware_1.validateUser, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            let users = [];
            console.log(req.method);
            switch (req.method) {
                case 'POST':
                    yield ShortListedProfiles_1.ShortList.create({ shortListerId: (_a = req.authSession) === null || _a === void 0 ? void 0 : _a.value.userId, shortListedId: schemaComponents_1._idValidator.parse(req.body.shortlisted_profile_id), shortListedAt: Date.now() });
                    return res.sendStatus(200);
                case 'GET':
                    let shortlist = yield ShortListedProfiles_1.ShortList.find({ shortListerId: (_b = req.authSession) === null || _b === void 0 ? void 0 : _b.value.userId })
                        .sort({ viewedAt: -1 })
                        .select('shortListedId')
                        .populate('shortListedId', 'name email profileImage _id')
                        .lean();
                    return res.status(200).json({ success: true, data: { shortlist } });
            }
        }
        catch (error) {
            console.error('[Profile View Api error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.post('/phone-view/:requested_profile_id', auth_middleware_1.validateUser, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            let user = yield user_1.User.findById((_a = req.authSession) === null || _a === void 0 ? void 0 : _a.value.userId);
            let requested_profile_id = schemaComponents_1._idValidator.parse(req.params.requested_profile_id);
            if (!(user === null || user === void 0 ? void 0 : user.hasActiveMembership()))
                return res.sendStatus(403);
            let membership = yield membershipRequest_1.MembershipRequest.findOne({ _id: (_c = (_b = user === null || user === void 0 ? void 0 : user.membership) === null || _b === void 0 ? void 0 : _b.currentMembership) === null || _c === void 0 ? void 0 : _c.requestId });
            if (!membership)
                throw new Error("Membership Not Found");
            if (membership.verifiedPhoneLimit > membership.verifiedPhoneViewed) {
                let requested_profile = yield user_1.User.findById(requested_profile_id, 'phoneInfo.number');
                if (!requested_profile)
                    throw new Error("Phone Not Found");
                membership.verifiedPhoneViewed++;
                yield membership.save();
                return res.status(200).send(requested_profile.phoneInfo.number);
            }
            else
                return res.sendStatus(403);
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid request parameters',
                    error: error.errors,
                    data: null
                });
                return;
            }
            console.error('[Profile View Api error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
exports.default = router;
