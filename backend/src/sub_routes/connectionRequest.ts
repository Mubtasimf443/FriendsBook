/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Router , Request , Response} from "express";
import { validateUser } from "../lib/middlewares/auth.middleware";
import { ConnectionRequestService } from "../controllers/connectionRequest.controller";
import { createInitialMessageSchema } from "../lib/schema/connectionRequest.schema";
import { ZodError } from "zod";
import { ConnectionRequest, ConnectionRequestStatus } from "../models/ConnectionRequest";
import mongoose from "mongoose";
import { sendNotification } from "../lib/core/notification.service";
import { User } from "../models/user";


const router : Router = Router();

router.use(validateUser);

router.post('/request', async function (req: Request, res: Response): Promise<any> {
    try {
        // Validate request body
        const { recipientId, initialMessage } = await createInitialMessageSchema.parseAsync(req.body);
        const senderId = req.authSession.value.userId;

        // Validate users exist
        const [sender, recipient] = await Promise.all([
            User.findById(senderId),
            User.findById(recipientId)
        ]);

        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: 'Recipient user not found',
                error: { code: 'USER_NOT_FOUND' },
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

        const connectionStatus = await (async function getConnectionStatus(
            user1Id: mongoose.Types.ObjectId, 
            user2Id: string
        ) {
            // Check for requests in both directions
            const [request1, request2] = await Promise.all([
                ConnectionRequest.findOne({
                    sender: user1Id,
                    recipient: user2Id,
                    status: { $in: [ConnectionRequestStatus.PENDING, ConnectionRequestStatus.ACCEPTED] }
                }),
                ConnectionRequest.findOne({
                    sender: user2Id,
                    recipient: user1Id,
                    status: { $in: [ConnectionRequestStatus.PENDING, ConnectionRequestStatus.ACCEPTED] }
                })
            ]);

            if (request1?.status === ConnectionRequestStatus.ACCEPTED) {
                return { status: 'connected', since: request1.acceptedAt };
            }

            if (request2?.status === ConnectionRequestStatus.ACCEPTED) {
                return { status: 'connected', since: request2.acceptedAt };
            }

            if (request1?.status === ConnectionRequestStatus.PENDING) {
                return { status: 'outgoing_request', since: request1.createdAt };
            }

            if (request2?.status === ConnectionRequestStatus.PENDING) {
                return { status: 'incoming_request', since: request2.createdAt };
            }

            return { status: 'not_connected' };
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
                const updatedRequest = await ConnectionRequest.findOneAndUpdate(
                    {
                        status: ConnectionRequestStatus.PENDING,
                        sender: recipientId,
                        recipient: senderId
                    },
                    {
                        status: ConnectionRequestStatus.ACCEPTED,
                        acceptedAt: new Date(),
                        initialMessage: initialMessage
                    },
                    { new: true }
                );

                // Update users' connections arrays
                await Promise.all([
                    User.findByIdAndUpdate(senderId, {
                        $push: { connections: recipientId },
                        $pull: { pendingIncomingRequests: updatedRequest?._id }
                    }),
                    User.findByIdAndUpdate(recipientId, {
                        $push: { connections: senderId },
                        $pull: { pendingOutgoingRequests: updatedRequest?._id }
                    })
                ]);

                // Send notification
                if (recipient.fcmToken) {
                    await sendNotification(recipient.fcmToken, {
                        title: 'Connection Request Accepted',
                        body: `${sender.name} has accepted your connection request`,
                        data: {
                            type: 'CONNECTION_REQUEST_ACCEPTED',
                            userId: senderId.toString()
                        }
                    });
                }

                return res.status(200).json({
                    success: true,
                    data: {
                        connectionId: updatedRequest?._id,
                        status: 'accepted',
                        timestamp: updatedRequest?.acceptedAt
                    },
                    error: null,
                    message: 'Connection request accepted successfully'
                });

            case 'not_connected':
                // Create new connection request
                const newRequest = await ConnectionRequest.create({
                    sender: senderId,
                    recipient: recipientId,
                    status: ConnectionRequestStatus.PENDING,
                    initialMessage: initialMessage,
                    createdAt: new Date()
                });

                // Update users' pending requests arrays
                await Promise.all([
                    User.findByIdAndUpdate(senderId, {
                        $push: { pendingOutgoingRequests: newRequest._id }
                    }),
                    User.findByIdAndUpdate(recipientId, {
                        $push: { pendingIncomingRequests: newRequest._id }
                    })
                ]);

                // Send notification to recipient
                if (recipient.fcmToken) {
                    await sendNotification(recipient.fcmToken, {
                        title: 'New Connection Request',
                        body: `${sender.name} wants to connect with you`,
                        data: {
                            type: 'NEW_CONNECTION_REQUEST',
                            userId: senderId.toString()
                        }
                    });
                }

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

    } catch (error) {
        console.error('[send Connection Request API error]', error);

        if (error instanceof ZodError) {
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

router.post('/request/:requestId/accept', async function (req: Request, res: Response): Promise<any> {
   
});

router.post('/request/:requestId/reject', async function (req: Request, res: Response): Promise<any> {
    
});

router.post('/request/:requestId/withdraw', async function (req: Request, res: Response): Promise<any> {
    
});

router.get('/',async function (req: Request, res: Response): Promise<any> {
   
});

router.get('/incoming', async function (req: Request, res: Response): Promise<any> {
 
});

router.get('/outgoing', async function (req: Request, res: Response): Promise<any> {
 
});

export default router;