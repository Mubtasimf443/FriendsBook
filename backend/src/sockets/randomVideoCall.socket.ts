/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Namespace } from 'socket.io';
import '../lib/types/socket.decralation';
import { socketMiddlewaresVideoProfile } from '../lib/middlewares/socket.middleware';
import { Socket } from 'socket.io';
import { RandomVideoCall, IRandomVideoCall } from '../models/RandomVideoCall';
import { z } from 'zod';
import mongoose from 'mongoose';
import VideoProfile from '../models/VideoProfile';

// Constants
const VIDEO_CALL_DURATION = 20 * 1000; // 20 seconds in milliseconds

export class randomVideoCallSocketService {
    private io: Namespace;
    private activeCallTimers: Map<string, NodeJS.Timeout> = new Map();

    constructor(io: Namespace) {
        this.io = io;
        this.io.use(socketMiddlewaresVideoProfile);
        this.initializeListeners();
    }

    private async initializeListeners() {
        this.io.on('connection', (socket: Socket) => {
            console.log(`User connected: ${socket.user?._id || 'Unknown'}, Socket ID: ${socket.id}`);
            
            // First, clean up any existing requests or active calls for this user
            this.cleanupUserSessions(socket.user?._id);

            // Handler for creating a new video call request
            socket.on('/create-video-request', async (data) => {
                try {
                    // Validate incoming data
                    const schema = z.object({
                        latitude: z.number().min(-90).max(90),
                        longitude: z.number().min(-180).max(180),
                        maxDistance: z.number().min(2000).max(100000).positive().optional().default(50000), // Distance in meters, default 50km
                        languages: z.array(z.string()).optional(),
                    });
                    
                    const validationResult = schema.safeParse(data);
                    
                    if (!validationResult.success) {
                        socket.emit('error', { 
                            message: 'Invalid request data', 
                            errors: validationResult.error.errors 
                        });
                        return;
                    }
                    
                    const { latitude, longitude, languages } = validationResult.data;
                    
                    // Generate a unique room ID
                    const roomId = `room_${socket.user._id}_${Date.now()}`;
                    
                    // Create a new random video call entry
                    const randomVideoCall = new RandomVideoCall({
                        userId: socket.user._id,
                        status: 'searching',
                        location: {
                            type: 'Point',
                            coordinates: [longitude, latitude]
                        },
                        languages: languages || socket.user.languages || [],
                        socketId: socket.id,
                        roomId: roomId
                    });
                    
                    await randomVideoCall.save();
                    
                    // Emit that the request was created successfully
                    socket.emit('request-created', {
                        success: true,
                        message: 'Video call request created successfully',
                        requestId: randomVideoCall.id.toString(), // Convert ObjectId to string
                        roomId: roomId
                    });
                    
                    // Join socket to a room with the same ID as the request
                    socket.join(roomId);
                    
                } catch (error) {
                    console.error('Error creating video request:', error);
                    socket.emit('error', { message: 'Failed to create video call request' });
                }
            });

            // Handler for checking available users for a video call
            socket.on('/check-users-request', async (data) => {
                try {
                    // Validate the request
                    const schema = z.object({
                        requestId: z.string().uuid().min(1), // MongoDB ObjectId as string
                        maxDistance: z.number().min(2000).max(100000).optional().default(50000),
                    });
                    
                    const validationResult = schema.safeParse(data);
                    if (!validationResult.success) {
                        socket.emit('error', { 
                            message: 'Invalid check request', 
                            errors: validationResult.error.errors 
                        });
                        return;
                    }
                    
                    const { requestId, maxDistance } = validationResult.data;
                    
                    // Find the user's own request
                    const myRequest = await RandomVideoCall.findOne({
                        id:requestId, // Use _id instead of id
                        userId: socket.user._id,
                        status: 'searching'
                    });
                    
                    if (!myRequest) {
                        socket.emit('error', { message: 'No active search request found' });
                        return;
                    }
                    
                    // Find a matching user based on location
                    const matchingUser = await RandomVideoCall.findOne({
                        userId: { $ne: socket.user._id },
                        status: 'searching',
                        location: {
                            $near: {
                                $geometry: myRequest.location,
                                $maxDistance: maxDistance
                            }
                        }
                    })
                    .populate('userId');
                    
                    if (!matchingUser) {
                        socket.emit('no-users-found', { message: 'No users found nearby, try again later' });
                        return;
                    }
                    
                    // Update both users' statuses to connected
                    myRequest.status = 'connected';
                    myRequest.connectedWith = matchingUser.userId;
                    myRequest.sessionId = `session_${Date.now()}`;
                    await myRequest.save();
                    
                    matchingUser.status = 'connected';
                    matchingUser.connectedWith = socket.user._id;
                    matchingUser.sessionId = myRequest.sessionId;
                    await matchingUser.save();
                    
                    // Get other user's profile info (limited for privacy)
                    const otherUserProfile = await VideoProfile.findById(matchingUser.userId).select('name gender status');
                    
                    // Notify both users about the match
                    socket.emit('user-found', {
                        success: true,
                        message: 'User found for video call',
                        sessionId: myRequest.sessionId,
                        roomId: myRequest.roomId,
                        userInfo: {
                            name: otherUserProfile?.name,
                            gender: otherUserProfile?.gender
                        }
                    });
                    
                    // Notify the other user through their socket
                    this.io.to(matchingUser.socketId).emit('incoming-call', {
                        success: true,
                        message: 'Someone wants to video chat with you',
                        sessionId: myRequest.sessionId,
                        roomId: myRequest.roomId,
                        userInfo: {
                            name: socket.user.name,
                            gender: socket.user.gender
                        }
                    });
                    
                    // Add the other user to the room
                    const otherSocket = this.io.sockets.get(matchingUser.socketId);
                    if (otherSocket) {
                        otherSocket.join(myRequest.roomId);
                    }
                    
                    // Start the 20-second timer for this call
                    this.startCallTimer(myRequest.roomId, myRequest.sessionId);
                    
                } catch (error) {
                    console.error('Error checking for users:', error);
                    socket.emit('error', { message: 'Failed to check for available users' });
                }
            });
            
            // Handler for joining a video call
            socket.on('/join-video-call', async (data) => {
                try {
                    const schema = z.object({
                        sessionId: z.string().min(1),
                        signal: z.any() // WebRTC signal data
                    });
                    
                    const validationResult = schema.safeParse(data);
                    if (!validationResult.success) {
                        socket.emit('error', { message: 'Invalid join request' });
                        return;
                    }
                    
                    const { sessionId, signal } = validationResult.data;
                    
                    // Find the call session
                    const callSession = await RandomVideoCall.findOne({
                        userId: socket.user._id,
                        sessionId: sessionId,
                        status: 'connected'
                    });
                    
                    if (!callSession) {
                        socket.emit('error', { message: 'Call session not found or not active' });
                        return;
                    }
                    
                    // Broadcast the WebRTC signal to the room (excluding sender)
                    socket.to(callSession.roomId).emit('user-joined', {
                        userId: socket.user._id.toString(), // Convert ObjectId to string
                        signal: signal
                    });
                    
                    socket.emit('join-success', { roomId: callSession.roomId });
                    
                } catch (error) {
                    console.error('Error joining video call:', error);
                    socket.emit('error', { message: 'Failed to join video call' });
                }
            });

            // Handler for leaving a video call
            socket.on('/leave-video-call', async (data) => {
                try {
                    const schema = z.object({
                        sessionId: z.string().min(1)
                    });
                    
                    const validationResult = schema.safeParse(data);
                    if (!validationResult.success) {
                        return;
                    }
                    
                    const { sessionId } = validationResult.data;
                    
                    await this.endCallSession(sessionId, socket.user._id, 'user-left');
                    
                } catch (error) {
                    console.error('Error leaving video call:', error);
                }
            });

            // WebRTC signaling
            socket.on('signal', (data) => {
                try {
                    const { roomId, signal } = data;
                    // Validate room ID
                    if (!roomId || typeof roomId !== 'string') {
                        return;
                    }
                    
                    socket.to(roomId).emit('signal', {
                        userId: socket.user._id.toString(), // Convert ObjectId to string
                        signal: signal
                    });
                } catch (error) {
                    console.error('Error processing signal:', error);
                }
            });

            // Handle disconnection
            socket.on('disconnect', async () => {
                try {
                    await this.handleUserDisconnect(socket.user?._id, socket.id);
                } catch (error) {
                    console.error('Error handling disconnect:', error);
                }
            });
        });
    }
    
    // Helper method to start the 20-second timer for a call
    private startCallTimer(roomId: string, sessionId: string) {
        // Clear any existing timer for this room
        if (this.activeCallTimers.has(roomId)) {
            clearTimeout(this.activeCallTimers.get(roomId));
        }
        
        // Set a new timer
        const timer = setTimeout(async () => {
            // End the call after 20 seconds
            await this.endCallByRoomId(roomId, 'time-expired');
            this.activeCallTimers.delete(roomId);
        }, VIDEO_CALL_DURATION);
        
        this.activeCallTimers.set(roomId, timer);
    }
    
    // Helper method to end a call by room ID
    private async endCallByRoomId(roomId: string, reason: string) {
        try {
            // Find all sessions in this room
            const sessions = await RandomVideoCall.find({ roomId: roomId, status: 'connected' });
            
            // Update all sessions to ended
            for (const session of sessions) {
                session.status = 'ended';
                await session.save();
            }
            
            // Notify all users in the room that the call has ended
            this.io.to(roomId).emit('call-ended', { 
                message: 'Video call has ended',
                reason: reason
            });
            
            // Clear the room
            this.io.in(roomId).socketsLeave(roomId);
            
        } catch (error) {
            console.error('Error ending call by room ID:', error);
        }
    }
    
    // Helper method to end a specific call session
    private async endCallSession(sessionId: string, userId: mongoose.Types.ObjectId, reason: string) {
        try {
            // Find the user's session
            const userSession = await RandomVideoCall.findOne({
                userId: userId,
                sessionId: sessionId,
                status: 'connected'
            });
            
            if (!userSession) return;
            
            // End the call for all users in this session
            await this.endCallByRoomId(userSession.roomId, reason);
            
        } catch (error) {
            console.error('Error ending call session:', error);
        }
    }
    
    // Helper method to handle user disconnect
    private async handleUserDisconnect(userId: mongoose.Types.ObjectId, socketId: string) {
        if (!userId) return;
        
        try {
            // Find any active sessions for this user
            const activeSessions = await RandomVideoCall.find({
                userId: userId,
                status: { $in: ['searching', 'connected'] },
                socketId: socketId
            });
            
            for (const session of activeSessions) {
                if (session.status === 'connected') {
                    // End active calls
                    await this.endCallByRoomId(session.roomId, 'user-disconnected');
                } else {
                    // Just mark searching sessions as ended
                    session.status = 'ended';
                    await session.save();
                }
            }
        } catch (error) {
            console.error('Error handling user disconnect:', error);
        }
    }
    
    // Helper method to clean up existing sessions for a user
    private async cleanupUserSessions(userId: mongoose.Types.ObjectId) {
        if (!userId) return;
        
        try {
            // End any existing 'searching' or 'connected' sessions for this user
            await RandomVideoCall.updateMany(
                { 
                    userId: userId,
                    status: { $in: ['searching', 'connected'] }
                },
                { 
                    $set: { status: 'ended' }
                }
            );
        } catch (error) {
            console.error('Error cleaning up user sessions:', error);
        }
    }

    // Static method to get instance
    static getIntance(io: Namespace) {
        return new randomVideoCallSocketService(io);
    }
}