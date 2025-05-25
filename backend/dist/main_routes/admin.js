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
const Gifts_1 = __importDefault(require("../models/Gifts"));
const schemaComponents_1 = require("../lib/schema/schemaComponents");
const notification_socket_1 = require("../sockets/notification.socket");
const CoinsTransection_1 = __importDefault(require("../models/CoinsTransection"));
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
            const userType = req.query.usertype || 'matrimony';
            const skip = (page - 1) * limit;
            let users = [];
            let totalUsers = 0;
            switch (userType) {
                case 'matrimony':
                    totalUsers = yield user_1.User.countDocuments({});
                    users = yield user_1.User.find({})
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)
                        .select('_id name email profileImage.url suspension onlineStatus membership address phoneInfo');
                    break;
                case 'video-calling':
                    totalUsers = yield VideoProfile_1.default.countDocuments({});
                    users = yield VideoProfile_1.default.find({})
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)
                        .select('location.country profileImage.url name email status phone gender');
                    break;
            }
            let totalPages = Math.ceil(totalUsers / limit);
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
router.put('/video-user/:id', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let { name, email, phone } = (zod_1.z.object({
                name: zod_1.z.string().min(2, "Name must be at least 2 characters").max(120).trim(),
                email: schemaComponents_1.emailValidatior,
                phone: zod_1.z.string().regex(/^\d{10,15}$/).trim(),
            })).parse(req.body);
            yield VideoProfile_1.default.findByIdAndUpdate(schemaComponents_1._idValidator.parse(req.params.id), { name, email, phone });
            return res.sendStatus(200);
        }
        catch (error) {
            console.error('[Uodate Video User From Admin Panal Api error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
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
                plan: zod_1.z.enum(['gold', 'diamond', 'platinum']),
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
                .sort({ createdAt: -1 })
                .select('_id requesterID requestDate paymentInfo tier duration')
                .populate('requesterID', "name phoneInfo.number profileImage email")
                .lean();
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
        var _a, _b;
        try {
            let membership = yield membershipRequest_1.MembershipRequest.findOne({ _id: schemaComponents_1._idValidator.parse(req.params.id), requestStatus: memberdship_types_1.MembershipRequestStatus.PENDING });
            if (!membership) {
                res.status(400).json({
                    success: false,
                    message: 'Request Not Found',
                    data: null
                });
                return;
            }
            let endDate = new Date(Date.now() + (membership.duration * 30 * 24 * 3600 * 1000));
            yield membershipRequest_1.MembershipRequest.findByIdAndUpdate(schemaComponents_1._idValidator.parse(req.params.id), {
                requestStatus: memberdship_types_1.MembershipRequestStatus.APPROVED,
                startDate: new Date(),
                endDate: endDate
            }, { runValidators: true });
            let user = yield user_1.User.findByIdAndUpdate(membership.requesterID, {
                "membership.currentMembership.requestId": membership._id,
                "membership.currentMembership.membership_exipation_date": endDate
            });
            let socket = (_a = user === null || user === void 0 ? void 0 : user.socket_ids) === null || _a === void 0 ? void 0 : _a.notification_socket;
            if (socket) {
                (_b = req.notifications) === null || _b === void 0 ? void 0 : _b.io.to(socket).emit('membership-notification', {
                    status: memberdship_types_1.MembershipRequestStatus.APPROVED,
                    tier: membership.tier,
                    duration: membership.duration,
                    phone_view_limit: membership.verifiedPhoneLimit,
                    membership_id: membership._id
                });
            }
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
router.put('/membership/request/:id/reject', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            let { reason } = (zod_1.z.object({
                reason: zod_1.z.string().min(1).max(120)
            })).parse(req.query);
            let m = yield membershipRequest_1.MembershipRequest.findByIdAndUpdate(req.params.id, {
                requestStatus: memberdship_types_1.MembershipRequestStatus.REJECTED,
                adminNote: reason
            });
            if (!m)
                return res.sendStatus(204);
            let user = yield user_1.User.findById(m === null || m === void 0 ? void 0 : m.requesterID, 'socket_ids');
            let socket = (_a = user === null || user === void 0 ? void 0 : user.socket_ids) === null || _a === void 0 ? void 0 : _a.notification_socket;
            if (socket) {
                (_b = req.notifications) === null || _b === void 0 ? void 0 : _b.io.to(socket).emit('membership-notification', {
                    status: memberdship_types_1.MembershipRequestStatus.APPROVED,
                    tier: m.tier,
                    duration: m.duration,
                    membership_id: m._id,
                    adminNote: reason
                });
            }
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
router.get('/coins/request', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let page = parseInt(req.query.page) || 1;
            let limit = parseInt(req.query.limit) || 10;
            if (page < 1)
                page = 1;
            if (limit < 1)
                limit = 10;
            const skip = (page - 1) * limit;
            let query = {
                status: "pending",
            };
            const total = yield CoinsTransection_1.default.countDocuments(query);
            let request = yield CoinsTransection_1.default.find(query).skip(skip).limit(limit).populate('userId', 'name email phone profileImage').lean();
            let data = JSON.parse((0, fs_1.readFileSync)(path_1.default.join(__dirname, '../../data/coin.packages.json'), 'utf-8'));
            for (let i = 0; i < request.length; i++)
                request[i]['package'] = data[request[i]['package']];
            return res.status(200).json({
                data: {
                    request,
                    pagination: {
                        page,
                        total,
                        limit,
                        totalPages: Math.ceil(total / limit)
                    }
                }
            });
        }
        catch (error) {
            console.error('[Coin Purchase Request Get Api (Admin ) Error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.put('/coins/request/:id/reject', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let t = yield CoinsTransection_1.default.findOneAndUpdate({
                _id: schemaComponents_1._idValidator.parse(req.params.id),
                status: "pending",
            }, {
                status: 'failed',
                admin_note: (zod_1.z.string().min(1).max(120)).parse(req.body.admin_note)
            });
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
router.put('/coins/request/:id/accept', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let t = yield CoinsTransection_1.default.findOne({
                _id: schemaComponents_1._idValidator.parse(req.params.id),
                status: "pending",
            });
            if (!t)
                return res.sendStatus(403);
            let data = JSON.parse((0, fs_1.readFileSync)(path_1.default.join(__dirname, '../../data/coin.packages.json'), 'utf-8'));
            let coins = data[t.package].coins;
            t.status = 'success';
            t.coins = coins;
            yield t.save();
            yield VideoProfile_1.default.findByIdAndUpdate(t.userId, { $inc: { video_calling_coins: t.coins } });
            return res.sendStatus(200);
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
router.put('/coins-data', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let coinPackages = JSON.parse((0, fs_1.readFileSync)(path_1.default.join(__dirname, '../../data/coin.packages.json'), 'utf-8'));
            // Validate input data
            const schema = zod_1.z.object({
                packageId: zod_1.z.enum(['package_1', 'package_2', 'package_3', 'package_4']),
                field: zod_1.z.enum(['name', 'price', 'coins']),
                value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()])
            });
            let { packageId, field, value } = schema.parse(req.body);
            // Convert number to string for storage
            if (typeof value === 'number') {
                value = value.toString();
            }
            // Update the package data
            coinPackages[packageId][field] = value;
            // Save the updated data
            (0, fs_1.writeFileSync)(path_1.default.join(__dirname, '../../data/coin.packages.json'), JSON.stringify(coinPackages, null, 2));
            return res.status(200).json({
                success: true,
                message: 'Coin package updated successfully'
            });
        }
        catch (error) {
            console.error('[/coins/pricing api error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.post('/gifts', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const giftSchema = zod_1.z.object({
                name: zod_1.z.string().min(1, "Gift name is required").max(50, "Gift name is too long"),
                coins: zod_1.z.number().int().positive("Coins must be a positive number"),
                image: zod_1.z.object({
                    id: zod_1.z.string().uuid(),
                    url: zod_1.z.string().url("Invalid image URL")
                })
            });
            const validationResult = giftSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    error: validationResult.error.errors.map(err => err.message).join(', ')
                });
            }
            const { name, coins, image } = validationResult.data;
            const newGift = yield Gifts_1.default.create({ name, coins, image });
            return res.status(201).json({
                success: true,
                message: "Gift created successfully",
                data: {
                    gift: newGift
                }
            });
        }
        catch (error) {
            console.error('[Gifts Posting Api error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.put('/gifts/:id', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const giftSchema = zod_1.z.object({
                name: zod_1.z.string().min(1, "Gift name is required").max(50, "Gift name is too long"),
                coins: zod_1.z.number().int().positive("Coins must be a positive number"),
            });
            const validationResult = giftSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    error: validationResult.error.errors.map(err => err.message).join(', ')
                });
            }
            const { name, coins } = validationResult.data;
            const updatedGift = yield Gifts_1.default.findByIdAndUpdate(req.params.id, { name, coins });
            return res.status(200).json({
                success: true,
                message: "Gift updated SuccessFully successfully",
                data: {
                    gift: updatedGift
                }
            });
        }
        catch (error) {
            console.error('[Gifts Posting Api error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.delete('/gifts/:id', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let deletedGift = yield Gifts_1.default.findByIdAndDelete(req.params.id);
            res.status(200).json({
                success: true,
                data: { deletedGift },
                error: null,
                message: 'Gift Deleted Success Fully'
            });
            return;
        }
        catch (error) {
            console.error('[delete api error]', error);
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
router.post('/notification', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            let { title, body, room } = (zod_1.z.object({
                title: zod_1.z.string().max(80).min(1),
                body: zod_1.z.string().min(1).max(120),
                room: zod_1.z.nativeEnum(notification_socket_1.Rooms)
            })).parse(req.body);
            if (room === notification_socket_1.Rooms.ALL_USERS_ROOMS) {
                (_a = req.notifications) === null || _a === void 0 ? void 0 : _a.io.emit('admin-notification', { title, body });
            }
            if (room === notification_socket_1.Rooms.MATRIMONY_ROOMS) {
                (_b = req.notifications) === null || _b === void 0 ? void 0 : _b.io.to(room).emit('admin-notification', { title, body });
            }
            else {
                (_c = req.notifications) === null || _c === void 0 ? void 0 : _c.io.to(room).emit('admin-notification', { title, body });
            }
            return res.sendStatus(200);
        }
        catch (error) {
            console.error('[Create Notification Api Error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
exports.default = router;
