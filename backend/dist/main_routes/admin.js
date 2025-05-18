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
const auth_controller_1 = require("../controllers/auth.controller");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const user_1 = require("../models/user");
const VideoProfile_1 = __importDefault(require("../models/VideoProfile"));
const zod_1 = require("zod");
const membershipRequest_1 = require("../models/membershipRequest");
const memberdship_types_1 = require("../lib/types/memberdship.types");
const router = (0, express_1.Router)();
router.post('/login', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, password } = req.body;
            let adminSettings = JSON.parse((0, fs_1.readFileSync)(path_1.default.join(__dirname, '../../data/admin.panal.settings.json'), 'utf-8'));
            let { email: validEmail, password: validPassword } = adminSettings;
            if (email === validEmail && password === validPassword) {
                let authToken = (0, auth_controller_1.giveAuthSessionId)();
                (0, fs_1.writeFileSync)(path_1.default.join(__dirname, '../../data/admin.panal.settings.json'), JSON.stringify({
                    email: validEmail,
                    password: validPassword,
                    auth_session: authToken
                }));
                // Set auth token as cookie
                res.cookie('admin_auth_token', authToken, {
                    httpOnly: true,
                    sameSite: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 24 * 60 * 60 * 1000 // 24 hours
                });
                return res.status(200).json({
                    success: true,
                    message: 'Admin login successful',
                    data: { email: email, authToken }
                });
            }
            else {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during authentication',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
});
router.post('/is-loggedin', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const authToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.admin_auth_token;
            let adminSettings = JSON.parse((0, fs_1.readFileSync)(path_1.default.join(__dirname, '../../data/admin.panal.settings.json'), 'utf-8'));
            if (!authToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Admin is not logged in'
                });
            }
            if (adminSettings.auth_session === authToken) {
                return res.status(200).json({
                    success: true,
                    message: 'Admin is logged in',
                    data: {
                        email: adminSettings.email,
                        token: authToken
                    }
                });
            }
            else {
                return res.status(401).json({
                    success: false,
                    message: 'Admin is not logged in'
                });
            }
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during authentication',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
});
router.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const authToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.admin_auth_token;
        if (!authToken) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Admin authentication required'
            });
        }
        let adminSettings = JSON.parse((0, fs_1.readFileSync)(path_1.default.join(__dirname, '../../data/admin.panal.settings.json'), 'utf-8'));
        if (adminSettings.auth_session === authToken) {
            // Admin is authenticated, proceed to the next middleware or route handler
            next();
        }
        else {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Invalid admin authentication token'
            });
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
router.get('/overview-statistics', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get counts from database
            const totalUsers = yield user_1.User.countDocuments();
            const onlineActiveUsers = yield user_1.User.countDocuments({ status: 'online' });
            const usersJoinedThisMonth = yield user_1.User.countDocuments({
                createdAt: { $gte: new Date(new Date().setDate(1)) } // First day of current month
            });
            const premiumUsers = yield user_1.User.countDocuments({ membershipType: 'premium' });
            const suspendedUsers = yield user_1.User.countDocuments({ status: 'suspended' });
            const videoProfileUsers = yield user_1.User.countDocuments({ hasVideoProfile: true });
            return res.status(200).json({
                success: true,
                data: {
                    totalUsers,
                    onlineActiveUsers,
                    usersJoinedThisMonth,
                    premiumUsers,
                    suspendedUsers,
                    videoProfileUsers
                }
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during authentication',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
});
router.get('/users', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const userType = req.query.usertype || 'all';
            const skip = (page - 1) * limit;
            let query = {};
            // Filter based on user type
            switch (userType) {
                case 'premium':
                    query = {
                        'membership.currentMembership.requestId': { $exists: true },
                        'membership.currentMembership.membership_exipation_date': { $exists: true }
                    };
                    break;
                case 'active':
                    query = {
                        'onlineStatus.isOnline': true,
                    };
                    break;
                case 'suspended':
                    query = { 'suspension.isSuspended': true };
                    break;
                case 'new':
                    // Users created in the last 7 days
                    query = { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
                    break;
                default:
                    // 'all' - no filter
                    break;
            }
            const users = yield user_1.User.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('_id name email profileImage.url suspension onlineStatus membership address phoneInfo');
            const totalUsers = yield user_1.User.countDocuments(query);
            const totalPages = Math.ceil(totalUsers / limit);
            return res.status(200).json({
                success: true,
                data: {
                    users,
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalUsers,
                        hasNextPage: page < totalPages,
                        hasPrevPage: page > 1
                    }
                }
            });
        }
        catch (error) {
            next(error);
        }
    });
});
router.get('/users/search', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const phoneRegex = /^\d{10,15}$/;
            const { searchTerm, userType } = req.query;
            if (typeof searchTerm !== 'string' || !(userType === 'video' || userType == 'matrimony')) {
                return res.sendStatus(400);
            }
            let filterbyEmail = true;
            if (emailRegex.test(searchTerm)) {
                filterbyEmail = true;
            }
            if (phoneRegex.test(searchTerm)) {
                filterbyEmail = false;
            }
            if (userType === 'matrimony') {
                let query = {};
                if (filterbyEmail)
                    query = { email: searchTerm.trim() };
                if (!filterbyEmail)
                    query = { "phoneInfo.number": searchTerm.trim() };
                const user = yield user_1.User.findOne(query)
                    .select('-password')
                    .limit(20);
                if (!user)
                    return res.sendStatus(204);
                return res.status(200).json({
                    success: true,
                    data: {
                        user
                    }
                });
            }
            if (userType === 'video') {
                let query = {};
                if (filterbyEmail)
                    query = { email: searchTerm.trim() };
                if (!filterbyEmail)
                    query = { "phone": searchTerm.trim() };
                const user = yield VideoProfile_1.default.findOne(query)
                    .select('-passwordDetails')
                    .limit(20);
                if (!user)
                    return res.sendStatus(204);
                return res.status(200).json({
                    success: true,
                    data: {
                        user
                    }
                });
            }
            return res.sendStatus(400);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during authentication',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
});
router.put('/users/:id', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let schema = zod_1.z.object({
                name: zod_1.z.string().min(6).max(30).optional(),
                email: zod_1.z.string().email().optional(),
                phoneInfo: zod_1.z.object({ number: zod_1.z.string().min(8).max(16).regex(/^\d{10,15}$/).optional() }).optional()
            });
            let data = schema.parse(req.body);
            yield user_1.User.findByIdAndUpdate(req.params.id, data);
            return res.sendStatus(200);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during authentication',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
});
router.put('/users/:id/suspend', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield user_1.User.findByIdAndUpdate(req.params.id || '', { 'suspension.isSuspended': true });
            return res.sendStatus(200);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during authentication',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
});
router.put('/users/:id/unsuspend', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield user_1.User.findByIdAndUpdate(req.params.id || '', { 'suspension.isSuspended': false });
            return res.sendStatus(200);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during authentication',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
});
router.delete('/users/:id', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield user_1.User.findByIdAndDelete(req.params.id);
            return res.sendStatus(200);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during authentication',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
});
router.get('/membership/pricing', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let data = JSON.parse((0, fs_1.readFileSync)(path_1.default.join(__dirname, '../../data/membership.config.json'), 'utf-8'));
            return res.status(200).json({
                success: true,
                data: {
                    membership_data: data
                }
            });
        }
        catch (error) {
            console.error('[/membership/pricing api error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.put('/membership/pricing', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let memberships = JSON.parse((0, fs_1.readFileSync)(path_1.default.join(__dirname, '../../data/membership.config.json'), 'utf-8'));
            let schema = zod_1.z.object({
                plan: zod_1.z.enum(['premium', 'gold', 'diamond']),
                duration: zod_1.z.enum(['3', '6', '12']),
                field: zod_1.z.enum(['sms', 'price']),
                value: zod_1.z.number().min(1).max(10000)
            });
            let { plan, duration, field, value } = schema.parse(req.body);
            memberships[plan].prices[duration][field] = value;
            (0, fs_1.writeFileSync)(path_1.default.join(__dirname, '../../data/membership.config.json'), JSON.stringify(memberships));
            return res.sendStatus(200);
        }
        catch (error) {
            console.error('[/membership/pricing api error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.get('/membership/request', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Parse pagination params, default to page 1, limit 10
            let page = parseInt(req.query.page) || 1;
            let limit = parseInt(req.query.limit) || 10;
            if (page < 1)
                page = 1;
            if (limit < 1)
                limit = 10;
            const skip = (page - 1) * limit;
            const total = yield membershipRequest_1.MembershipRequest.countDocuments({ requestStatus: memberdship_types_1.MembershipRequestStatus.PENDING });
            const membershipRequests = yield membershipRequest_1.MembershipRequest.find({ requestStatus: memberdship_types_1.MembershipRequestStatus.PENDING })
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });
            return res.status(200).json({
                success: true,
                message: 'Membership requests fetched successfully',
                data: {
                    requests: membershipRequests,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit)
                    }
                }
            });
        }
        catch (error) {
            console.error('[/membership/request api error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.put('/membership/request/:id/accept', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let {} = (zod_1.z.object({})).parse(req.body);
            let memberdshipRequest = yield membershipRequest_1.MembershipRequest.findById(req.params.id);
            if (!memberdshipRequest) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid request parameters',
                    data: null
                });
                return;
            }
            memberdshipRequest.requestStatus = memberdship_types_1.MembershipRequestStatus.APPROVED;
            memberdshipRequest.startDate = new Date();
            memberdshipRequest.endDate = new Date(Date.now() + (memberdshipRequest.duration * 30 * 24 * 60 * 60 * 1000));
            ;
            let user = yield user_1.User.findById(memberdshipRequest.requesterID, {
                "membership.currentMembership.requestId": memberdshipRequest._id,
                "membership.currentMembership.membership_exipation_date": memberdshipRequest.endDate
            });
            yield memberdshipRequest.save();
            res.status(200);
        }
        catch (error) {
            console.error('[/membership/pricing api error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.put('/membership/request/:id/reject', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let { reason } = (zod_1.z.object({
                reason: zod_1.z.string().min(1).max(120)
            })).parse(req.body);
            let m = yield membershipRequest_1.MembershipRequest.findByIdAndUpdate(req.params.id, {
                requestStatus: memberdship_types_1.MembershipRequestStatus.REJECTED,
                adminNote: reason
            });
            res.status(200).json({
                success: true,
                data: {},
                error: null,
                message: 'OK'
            });
            return;
        }
        catch (error) {
            console.error('[/membership/pricing api error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.post('/log-out', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            res.clearCookie('admin_auth_token', {
                httpOnly: true,
                sameSite: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            })
                .status(200)
                .json({});
            return;
        }
        catch (error) {
            console.error('[Admin Log out error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
exports.default = router;
