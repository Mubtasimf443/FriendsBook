"use strict";
// /* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
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
const auth_middleware_1 = require("../lib/middlewares/auth.middleware");
const connectionRequest_schema_1 = require("../lib/schema/connectionRequest.schema");
const zod_1 = require("zod");
const ConnectionRequest_1 = require("../models/ConnectionRequest");
const user_1 = require("../models/user");
require("../lib/types/express.decratation");
const router = (0, express_1.Router)();
let userField = 'name _id address email age isEducated education address religion languages maritalStatus occupation annualIncome';
router.use(auth_middleware_1.validateUser);
router.get('/', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!req.authSession || !((_a = req.authSession) === null || _a === void 0 ? void 0 : _a.value)) {
                res.status(401).json({
                    success: false,
                    message: 'Failed to authorize the user',
                    data: null
                });
                return;
            }
            const userId = req.authSession.value.userId;
            let user = yield user_1.User.findOne({}, 'connections pendingIncomingRequests pendingOutgoingRequests').populate('connections').lean();
            res.status(200).json({
                success: true,
                data: {
                    user
                },
                error: null,
                message: 'OK'
            });
            return;
        }
        catch (error) {
            console.error('[Get Connection Request Api Error ]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: { code: 'INTERNAL_SERVER_ERROR' },
                data: null
            });
        }
    });
});
router.post('/send', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            if (!req.authSession || !((_a = req.authSession) === null || _a === void 0 ? void 0 : _a.value)) {
                res.status(401).json({
                    success: false,
                    message: 'Failed to authorize the user',
                    data: null
                });
                return;
            }
            // Validate request body
            const { recipientId } = yield connectionRequest_schema_1.createInitialMessageSchema.parseAsync(req.body);
            const senderId = req.authSession.value.userId;
            // Validate users exist
            const [sender, recipient] = yield Promise.all([
                user_1.User.findById(senderId),
                user_1.User.findById(recipientId)
            ]);
            {
                if (!recipient) {
                    return res.status(404).json({
                        success: false,
                        message: 'Recipient user not found',
                        error: { code: 'USER_NOT_FOUND' },
                        data: null
                    });
                }
                if ((_c = (_b = recipient.enhancedSettings) === null || _b === void 0 ? void 0 : _b.blocked) === null || _c === void 0 ? void 0 : _c.some(block => block.userId.toString() === senderId)) {
                    return res.status(403).json({
                        success: false,
                        message: 'Cannot send connection request as you have been blocked by this user',
                        error: { code: 'ACCESS_DENIED_BLOCKED' },
                        data: null
                    });
                }
                if (!sender) {
                    return res.status(404).json({
                        success: false,
                        message: 'Sender user not found',
                        error: { code: 'USER_NOT_FOUND' },
                        data: null
                    });
                }
                // Prevent self-connection
                if (senderId.toString() === recipientId.toString()) {
                    return res.status(400).json({
                        success: false,
                        message: 'Cannot send connection request to yourself',
                        error: { code: 'INVALID_RECIPIENT' },
                        data: null
                    });
                }
            }
            const connectionStatus = yield (function getConnectionStatus(user1Id, user2Id) {
                return __awaiter(this, void 0, void 0, function* () {
                    // Check for requests in both directions
                    const [request1, request2] = yield Promise.all([
                        ConnectionRequest_1.ConnectionRequest.findOne({
                            sender: user1Id,
                            recipient: user2Id,
                            status: { $in: [ConnectionRequest_1.ConnectionRequestStatus.PENDING, ConnectionRequest_1.ConnectionRequestStatus.ACCEPTED] }
                        }),
                        ConnectionRequest_1.ConnectionRequest.findOne({
                            sender: user2Id,
                            recipient: user1Id,
                            status: { $in: [ConnectionRequest_1.ConnectionRequestStatus.PENDING, ConnectionRequest_1.ConnectionRequestStatus.ACCEPTED] }
                        })
                    ]);
                    if ((request1 === null || request1 === void 0 ? void 0 : request1.status) === ConnectionRequest_1.ConnectionRequestStatus.ACCEPTED) {
                        return { status: 'connected', since: request1.acceptedAt };
                    }
                    if ((request2 === null || request2 === void 0 ? void 0 : request2.status) === ConnectionRequest_1.ConnectionRequestStatus.ACCEPTED) {
                        return { status: 'connected', since: request2.acceptedAt };
                    }
                    if ((request1 === null || request1 === void 0 ? void 0 : request1.status) === ConnectionRequest_1.ConnectionRequestStatus.PENDING) {
                        return { status: 'outgoing_request', since: request1.createdAt };
                    }
                    if ((request2 === null || request2 === void 0 ? void 0 : request2.status) === ConnectionRequest_1.ConnectionRequestStatus.PENDING) {
                        return { status: 'incoming_request', since: request2.createdAt };
                    }
                    return { status: 'not_connected' };
                });
            })(senderId, recipientId);
            switch (connectionStatus.status) {
                case 'connected':
                    return res.status(400).json({
                        success: false,
                        message: 'You are already connected with this user',
                        error: { code: 'ALREADY_CONNECTED' },
                        data: null
                    });
                case "outgoing_request":
                    return res.status(400).json({
                        success: false,
                        message: 'You have already sent a connection request to this user',
                        error: { code: 'REQUEST_PENDING' },
                        data: null
                    });
                case 'incoming_request':
                    // Accept the incoming request
                    const updatedRequest = yield ConnectionRequest_1.ConnectionRequest.findOneAndUpdate({
                        status: ConnectionRequest_1.ConnectionRequestStatus.PENDING,
                        sender: recipientId,
                        recipient: senderId
                    }, {
                        status: ConnectionRequest_1.ConnectionRequestStatus.ACCEPTED,
                        acceptedAt: new Date()
                    }, { new: true });
                    // Update users' connections arrays
                    yield Promise.all([
                        user_1.User.findByIdAndUpdate(senderId, {
                            $push: { connections: recipientId },
                            $pull: { pendingIncomingRequests: updatedRequest === null || updatedRequest === void 0 ? void 0 : updatedRequest._id }
                        }),
                        user_1.User.findByIdAndUpdate(recipientId, {
                            $push: { connections: senderId },
                            $pull: { pendingOutgoingRequests: updatedRequest === null || updatedRequest === void 0 ? void 0 : updatedRequest._id }
                        })
                    ]);
                    // // Send notification
                    // if (recipient.fcmToken) {
                    //     await sendNotification(recipient.fcmToken, {
                    //         title: 'Connection Request Accepted',
                    //         body: `${sender.name} has accepted your connection request`,
                    //         data: {
                    //             type: 'CONNECTION_REQUEST_ACCEPTED',
                    //             userId: senderId.toString()
                    //         }
                    //     });
                    // }
                    return res.status(200).json({
                        success: true,
                        data: {
                            connectionId: updatedRequest === null || updatedRequest === void 0 ? void 0 : updatedRequest._id,
                            status: 'accepted',
                            timestamp: updatedRequest === null || updatedRequest === void 0 ? void 0 : updatedRequest.acceptedAt
                        },
                        error: null,
                        message: 'Connection request accepted successfully'
                    });
                case 'not_connected':
                    // Create new connection request
                    const newRequest = yield ConnectionRequest_1.ConnectionRequest.create({
                        sender: senderId,
                        recipient: recipientId,
                        status: ConnectionRequest_1.ConnectionRequestStatus.PENDING,
                        createdAt: new Date()
                    });
                    // Update users' pending requests arrays
                    yield Promise.all([
                        user_1.User.findByIdAndUpdate(senderId, {
                            $push: { pendingOutgoingRequests: newRequest._id }
                        }),
                        user_1.User.findByIdAndUpdate(recipientId, {
                            $push: { pendingIncomingRequests: newRequest._id }
                        })
                    ]);
                    // // Send notification to recipient
                    // if (recipient.fcmToken) {
                    //     await sendNotification(recipient.fcmToken, {
                    //         title: 'New Connection Request',
                    //         body: `${sender.name} wants to connect with you`,
                    //         data: {
                    //             type: 'NEW_CONNECTION_REQUEST',
                    //             userId: senderId.toString()
                    //         }
                    //     });
                    // }
                    return res.status(200).json({
                        success: true,
                        data: {
                            requestId: newRequest._id,
                            status: 'pending',
                            timestamp: newRequest.createdAt
                        },
                        error: null,
                        message: 'Connection request sent successfully'
                    });
                default:
                    throw new Error('Invalid connection status');
            }
        }
        catch (error) {
            console.error('[send Connection Request API error]', error);
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid request parameters',
                    error: error.errors
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    });
});
router.put('/request/:requestId/accept', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const { requestId } = req.params;
            if (!req.authSession || !((_a = req.authSession) === null || _a === void 0 ? void 0 : _a.value)) {
                res.status(401).json({
                    success: false,
                    message: 'Failed to authorize the user',
                    data: null
                });
                return;
            }
            const userId = req.authSession.value.userId;
            // Find the connection request and validate it
            const connectionRequest = yield ConnectionRequest_1.ConnectionRequest.findById(requestId);
            if (!connectionRequest) {
                return res.status(404).json({
                    success: false,
                    message: 'Connection request not found',
                    error: { code: 'REQUEST_NOT_FOUND' },
                    data: null
                });
            }
            // Verify the user is the recipient of the request
            if (connectionRequest.recipient.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to accept this request',
                    error: { code: 'UNAUTHORIZED_ACTION' },
                    data: null
                });
            }
            // Check if request is in pending state
            if (connectionRequest.status !== ConnectionRequest_1.ConnectionRequestStatus.PENDING) {
                return res.status(400).json({
                    success: false,
                    message: `Request cannot be accepted as it is ${connectionRequest.status}`,
                    error: { code: 'INVALID_REQUEST_STATE' },
                    data: null
                });
            }
            // Accept the request
            const updatedRequest = yield connectionRequest.accept();
            // Update both users' connections arrays and remove from pending requests
            yield Promise.all([
                user_1.User.findByIdAndUpdate(userId, {
                    $push: { connections: connectionRequest.sender },
                    $pull: { pendingIncomingRequests: requestId }
                }),
                user_1.User.findByIdAndUpdate(connectionRequest.sender, {
                    $push: { connections: userId },
                    $pull: { pendingOutgoingRequests: requestId }
                })
            ]);
            // Send notification to sender
            const sender = yield user_1.User.findById(connectionRequest.sender);
            // if (sender?.fcmToken) {
            //     await sendNotification(sender.fcmToken, {
            //         title: 'Connection Request Accepted',
            //         body: 'Your connection request has been accepted',
            //         data: {
            //             type: 'CONNECTION_REQUEST_ACCEPTED',
            //             userId: userId
            //         }
            //     });
            // }
            return res.status(200).json({
                success: true,
                message: 'Connection request accepted successfully',
                data: {
                    connectionId: updatedRequest._id,
                    status: updatedRequest.status,
                    acceptedAt: updatedRequest.acceptedAt
                },
                error: null
            });
        }
        catch (error) {
            console.error('[Accept Connection Request API error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: { code: 'INTERNAL_SERVER_ERROR' },
                data: null
            });
        }
    });
});
router.put('/request/:requestId/reject', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const { requestId } = req.params;
            const { reason } = req.body;
            if (!req.authSession || !((_a = req.authSession) === null || _a === void 0 ? void 0 : _a.value)) {
                res.status(401).json({
                    success: false,
                    message: 'Failed to authorize the user',
                    data: null
                });
                return;
            }
            const userId = req.authSession.value.userId;
            // Find and validate the connection request
            const connectionRequest = yield ConnectionRequest_1.ConnectionRequest.findById(requestId);
            if (!connectionRequest) {
                return res.status(404).json({
                    success: false,
                    message: 'Connection request not found',
                    error: { code: 'REQUEST_NOT_FOUND' },
                    data: null
                });
            }
            // Verify the user is the recipient
            if (connectionRequest.recipient.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to reject this request',
                    error: { code: 'UNAUTHORIZED_ACTION' },
                    data: null
                });
            }
            // Check if request is in pending state
            if (connectionRequest.status !== ConnectionRequest_1.ConnectionRequestStatus.PENDING) {
                return res.status(400).json({
                    success: false,
                    message: `Request cannot be rejected as it is ${connectionRequest.status}`,
                    error: { code: 'INVALID_REQUEST_STATE' },
                    data: null
                });
            }
            // Reject the request
            const updatedRequest = yield connectionRequest.reject(reason);
            // Remove from pending requests
            yield Promise.all([
                user_1.User.findByIdAndUpdate(userId, {
                    $pull: { pendingIncomingRequests: requestId }
                }),
                user_1.User.findByIdAndUpdate(connectionRequest.sender, {
                    $pull: { pendingOutgoingRequests: requestId }
                })
            ]);
            // Notify sender
            const sender = yield user_1.User.findById(connectionRequest.sender);
            // if (sender?.fcmToken) {
            //     await sendNotification(sender.fcmToken, {
            //         title: 'Connection Request Rejected',
            //         body: 'Your connection request has been rejected',
            //         data: {
            //             type: 'CONNECTION_REQUEST_REJECTED',
            //             userId: userId
            //         }
            //     });
            // }
            return res.status(200).json({
                success: true,
                message: 'Connection request rejected successfully',
                data: {
                    requestId: updatedRequest._id,
                    status: updatedRequest.status,
                    rejectedAt: updatedRequest.rejectedAt,
                    reason: updatedRequest.rejectionReason
                },
                error: null
            });
        }
        catch (error) {
            console.error('[Reject Connection Request API error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: { code: 'INTERNAL_SERVER_ERROR' },
                data: null
            });
        }
    });
});
router.put('/request/:requestId/withdraw', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const { requestId } = req.params;
            if (!req.authSession || !((_a = req.authSession) === null || _a === void 0 ? void 0 : _a.value)) {
                res.status(401).json({
                    success: false,
                    message: 'Failed to authorize the user',
                    data: null
                });
                return;
            }
            const userId = req.authSession.value.userId;
            // Find and validate the connection request
            const connectionRequest = yield ConnectionRequest_1.ConnectionRequest.findById(requestId);
            if (!connectionRequest) {
                return res.status(404).json({
                    success: false,
                    message: 'Connection request not found',
                    error: { code: 'REQUEST_NOT_FOUND' },
                    data: null
                });
            }
            // Verify the user is the sender
            if (connectionRequest.sender.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to withdraw this request',
                    error: { code: 'UNAUTHORIZED_ACTION' },
                    data: null
                });
            }
            // Check if request is in pending state
            if (connectionRequest.status !== ConnectionRequest_1.ConnectionRequestStatus.PENDING) {
                return res.status(400).json({
                    success: false,
                    message: `Request cannot be withdrawn as it is ${connectionRequest.status}`,
                    error: { code: 'INVALID_REQUEST_STATE' },
                    data: null
                });
            }
            // Withdraw the request
            const updatedRequest = yield connectionRequest.withdraw();
            // Remove from pending requests
            yield Promise.all([
                user_1.User.findByIdAndUpdate(connectionRequest.recipient, {
                    $pull: { pendingIncomingRequests: requestId }
                }),
                user_1.User.findByIdAndUpdate(userId, {
                    $pull: { pendingOutgoingRequests: requestId }
                })
            ]);
            return res.status(200).json({
                success: true,
                message: 'Connection request withdrawn successfully',
                data: {
                    requestId: updatedRequest._id,
                    status: updatedRequest.status,
                    withdrawnAt: updatedRequest.withdrawnAt
                },
                error: null
            });
        }
        catch (error) {
            console.error('[Withdraw Connection Request API error]', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: { code: 'INTERNAL_SERVER_ERROR' },
                data: null
            });
        }
    });
});
// router.get('/incoming/accepted/users', async function (req: Request, res: Response): Promise<any> {
//     try {
//         const validationResult = paginationSchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const { page, limit, count: shouldCount } = validationResult.data;
//         const userId = req.authSession.value.userId;
//         // Get accepted incoming requests
//         const acceptedRequests = await ConnectionRequest.find({
//             recipient: userId,
//             status: ConnectionRequestStatus.ACCEPTED
//         })
//             .sort({ acceptedAt: -1 })
//             .skip((page - 1) * limit)
//             .limit(limit)
//             .lean();
//         const senderIds = acceptedRequests.map(request => request.sender);
//         const users = await User.find(
//             {
//                 _id: { $in: senderIds },
//                 'suspension.isSuspended': false
//             },
//             userField
//         ).lean();
//         const usersWithRequestInfo = users.map(user => {
//             const request = acceptedRequests.find(
//                 req => req.sender.toString() === user._id.toString()
//             );
//             return {
//                 ...user,
//                 requestDetails: {
//                     requestId: request?._id,
//                     acceptedAt: request?.acceptedAt,
//                     initialMessage: request?.initialMessage
//                 }
//             };
//         });
//         let totalCount: number | undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await ConnectionRequest.countDocuments({
//                 recipient: userId,
//                 status: ConnectionRequestStatus.ACCEPTED
//             });
//         }
//         const pagination = {
//             currentPage: page,
//             pageSize: limit,
//             ...(totalCount !== undefined && {
//                 totalPages: Math.ceil(totalCount / limit),
//                 totalUsers: totalCount
//             })
//         };
//         const responseData: IUserConnectionResponse = {
//             users: usersWithRequestInfo,
//             pagination,
//             requestDetails: {
//                 status: ConnectionRequestStatus.ACCEPTED,
//                 timestamp: new Date()
//             }
//         };
//         res.set('Cache-Control', 'private, max-age=60');
//         return res.status(200).json({
//             success: true,
//             data: responseData
//         });
//     } catch (error) {
//         console.error('[Get Accepted Incoming Requests Error]', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: { code: 'INTERNAL_SERVER_ERROR' },
//             data: null
//         });
//     }
// });
// router.get('/incoming/pending/users', async function (req: Request, res: Response): Promise<any> {
//     try {
//         const validationResult = paginationSchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const { page, limit, count: shouldCount } = validationResult.data;
//         const userId = req.authSession.value.userId;
//         // Get accepted incoming requests
//         const acceptedRequests = await ConnectionRequest.find({
//             recipient: userId,
//             status: ConnectionRequestStatus.PENDING, 
//         })
//             .sort({ acceptedAt: -1 })
//             .skip((page - 1) * limit)
//             .limit(limit)
//             .lean();
//         const senderIds = acceptedRequests.map(request => request.sender);
//         const users = await User.find(
//             {
//                 _id: { $in: senderIds },
//                 'suspension.isSuspended': false,
//             },
//             userField
//         ).lean();
//         const usersWithRequestInfo = users.map(user => {
//             const request = acceptedRequests.find(
//                 req => req.sender.toString() === user._id.toString()
//             );
//             return {
//                 ...user,
//                 requestDetails: {
//                     requestId: request?._id,
//                     requestedAt:request?.createdAt ,
//                     initialMessage: request?.initialMessage
//                 }
//             };
//         });
//         let totalCount: number | undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await ConnectionRequest.countDocuments({
//                 recipient: userId,
//                 status: ConnectionRequestStatus.ACCEPTED
//             });
//         }
//         const pagination = {
//             currentPage: page,
//             pageSize: limit,
//             ...(totalCount !== undefined && {
//                 totalPages: Math.ceil(totalCount / limit),
//                 totalUsers: totalCount
//             })
//         };
//         const responseData: IUserConnectionResponse = {
//             users: usersWithRequestInfo,
//             pagination,
//             requestDetails: {
//                 status: ConnectionRequestStatus.ACCEPTED,
//                 timestamp: new Date()
//             }
//         };
//         res.set('Cache-Control', 'private, max-age=60');
//         return res.status(200).json({
//             success: true,
//             data: responseData
//         });
//     } catch (error) {
//         console.error('[Get Accepted Incoming Requests Error]', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: { code: 'INTERNAL_SERVER_ERROR' },
//             data: null
//         });
//     }
// });
// // Get users who have rejected incoming connection requests
// router.get('/incoming/rejected/users', async function (req: Request, res: Response): Promise<any> {
//     try {
//         const validationResult = paginationSchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const { page, limit, count: shouldCount } = validationResult.data;
//         const userId = req.authSession.value.userId;
//         const rejectedRequests = await ConnectionRequest.find({
//             recipient: userId,
//             status: ConnectionRequestStatus.REJECTED
//         })
//         .sort({ rejectedAt: -1 })
//         .skip((page - 1) * limit)
//         .limit(limit)
//         .lean();
//         const senderIds = rejectedRequests.map(request => request.sender);
//         const users = await User.find(
//             {
//                 _id: { $in: senderIds },
//                 'suspension.isSuspended': false
//             },
//             userField
//         ).lean();
//         const usersWithRequestInfo = users.map(user => {
//             const request = rejectedRequests.find(
//                 req => req.sender.toString() === user._id.toString()
//             );
//             return {
//                 ...user,
//                 requestDetails: {
//                     requestId: request?._id,
//                     rejectedAt: request?.rejectedAt,
//                     rejectionReason: request?.rejectionReason,
//                     initialMessage: request?.initialMessage
//                 }
//             };
//         });
//         let totalCount: number | undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await ConnectionRequest.countDocuments({
//                 recipient: userId,
//                 status: ConnectionRequestStatus.REJECTED
//             });
//         }
//         const pagination = {
//             currentPage: page,
//             pageSize: limit,
//             ...(totalCount !== undefined && {
//                 totalPages: Math.ceil(totalCount / limit),
//                 totalUsers: totalCount
//             })
//         };
//         const responseData: IUserConnectionResponse = {
//             users: usersWithRequestInfo,
//             pagination,
//             requestDetails: {
//                 status: ConnectionRequestStatus.REJECTED,
//                 timestamp: new Date()
//             }
//         };
//         res.set('Cache-Control', 'private, max-age=60');
//         return res.status(200).json({
//             success: true,
//             data: responseData
//         });
//     } catch (error) {
//         console.error('[Get Rejected Incoming Requests Error]', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: { code: 'INTERNAL_SERVER_ERROR' },
//             data: null
//         });
//     }
// });
// // Outgoing requests follow the same pattern but swap sender and recipient
// router.get('/outgoing/pending/users', async function (req: Request, res: Response): Promise<any> {
//     try {
//         const validationResult = paginationSchema.safeParse(req.query);
//         if (!validationResult.success) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid query parameters",
//                 error: validationResult.error.errors,
//                 data: null
//             });
//         }
//         const { page, limit, count: shouldCount } = validationResult.data;
//         const userId = req.authSession.value.userId;
//         const pendingRequests = await ConnectionRequest.find({
//             sender: userId,
//             status: ConnectionRequestStatus.PENDING
//         })
//         .sort({ createdAt: -1 })
//         .skip((page - 1) * limit)
//         .limit(limit)
//         .lean();
//         const recipientIds = pendingRequests.map(request => request.recipient);
//         const users = await User.find(
//             {
//                 _id: { $in: recipientIds },
//                 'suspension.isSuspended': false
//             },
//             userField
//         ).lean();
//         const usersWithRequestInfo = users.map(user => {
//             const request = pendingRequests.find(
//                 req => req.recipient.toString() === user._id.toString()
//             );
//             return {
//                 ...user,
//                 requestDetails: {
//                     requestId: request?._id,
//                     timestamp: request?.createdAt,
//                     initialMessage: request?.initialMessage
//                 }
//             };
//         });
//         let totalCount: number | undefined;
//         if (shouldCount === 'yes') {
//             totalCount = await ConnectionRequest.countDocuments({
//                 sender: userId,
//                 status: ConnectionRequestStatus.PENDING
//             });
//         }
//         const pagination = {
//             currentPage: page,
//             pageSize: limit,
//             ...(totalCount !== undefined && {
//                 totalPages: Math.ceil(totalCount / limit),
//                 totalUsers: totalCount
//             })
//         };
//         const responseData: IUserConnectionResponse = {
//             users: usersWithRequestInfo,
//             pagination,
//             requestDetails: {
//                 status: ConnectionRequestStatus.PENDING,
//                 timestamp: new Date()
//             }
//         };
//         res.set('Cache-Control', 'private, max-age=30');
//         return res.status(200).json({
//             success: true,
//             data: responseData
//         });
//     } catch (error) {
//         console.error('[Get Pending Outgoing Requests Error]', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: { code: 'INTERNAL_SERVER_ERROR' },
//             data: null
//         });
//     }
// });
exports.default = router;
