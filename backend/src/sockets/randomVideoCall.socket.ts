/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Namespace } from 'socket.io';
import '../lib/types/socket.decralation';
import { socketMiddlewaresVideoProfile } from '../lib/middlewares/socket.middleware';
import { Socket } from 'socket.io';
import { RandomVideoCall, IRandomVideoCall } from '../models/RandomVideoCall';
import { z } from 'zod';
import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
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
            console.log('User connected to random video call socket', socket.user?._id);
           
            this.cleanupUserSessions(socket.user?._id);

            socket.on('create-video-call', async (peerId) => {
                try {
                    let peerIdSchema = z.string().min(10).max(512);
                  
                    if (!peerIdSchema.safeParse(peerId).success) {
                        return socket.emit('error', { text: 'Failed to validate' });
                    }

                    peerId = peerIdSchema.parse(peerId);
                    let roomId = randomUUID();
            

                    const randomVideoCall = new RandomVideoCall({
                        userId: socket.user._id,
                        status: 'searching',
                        peerId: peerId,
                        roomId: roomId,
                        gender : socket.user.gender
                    });
                    
                    socket.join(roomId);

                    await randomVideoCall.save();

                    socket.emit('room-created', roomId); // Fixed event name (removed leading slash)
                } catch (error) {
                    console.error('Error creating video request:', error);
                    socket.emit('error', { message: 'Failed to create video call request' });
                }
            });



            socket.on('connect-video-call', async (roomId) => {
                try {
                    let roomIdSchema = z.string().uuid();
                    if (!roomIdSchema.safeParse(roomId).success) {
                        return socket.emit('error', { text: 'Invalid room ID' });
                    }
                    
                    let randomVideoCall = await RandomVideoCall.findOne({ roomId: roomIdSchema.parse(roomId) });

                    if (!randomVideoCall) {
                        throw new Error("Cannot find Random video call created in the database");
                    }

                    socket.emit('started' , true)
                    let arr: number[] = [1, 2, 1, 2];

                    let startSearchNow: boolean = ((arr: number[]) => {
                        let randomNum = Math.floor(arr.length * Math.random());
                        return arr[randomNum] === 1;
                    })(arr);
            
                    if (startSearchNow) {
                        let request2 = await this.searchUser(socket.user._id, socket.user.gender);
                        if (request2) {
                            this.connectUser(randomVideoCall, request2, socket);
                        } else {
                            socket.emit('searching', { message: 'Looking for a match...' });
                        }
                    } else {
                        let timeOut = setTimeout(async () => {
                            let request2 = await this.searchUser(socket.user._id, socket.user.gender);
                            if (request2) {
                                this.connectUser(randomVideoCall, request2, socket);
                            } else {
                                socket.emit('searching', { message: 'Looking for a match...' });
                            }
                            clearTimeout(timeOut);
                        }, 1500);
                    }
                } catch (error) {
                    console.error(error);
                    socket.emit('error', {
                        type: 'video-connection-failed',
                        message: 'Failed to connect User in 20s video call'
                    });
                }
            });
           
            socket.on('caller-details-request' ,async function () {
                try {
                    let call2 =await RandomVideoCall.findOne({ connectedWith : socket.user._id , status : 'connected'});
                    if (!call2) {
                        return  socket.emit('error', { message: 'can not find Caller Details' });
                    }
                    let caller = await VideoProfile.findById(call2.connectedWith);
                    if (!caller) {
                        return  socket.emit('error', { message: 'can not find Caller Details' });
                    }
                    socket.emit('caller-details' , { 
                       name : caller.name ,
                       photo : caller.profileImage?.url,
                       email : caller.email
                    });
                    
                } catch (error) {
                    console.error(error);
                }
            })



            socket.on('stop-video-call' ,async  function () {
                let call2 =await RandomVideoCall.findOne({ connectedWith : socket.user._id , status : 'connected'});
                if (call2) {
                    socket.to(call2.roomId).emit('call-cancelled')
                }
            });



            socket.on('disconnect', async () => {
                try {
                    await RandomVideoCall.deleteOne({
                        userId : socket.user._id
                    });
                } catch (error) {
                    console.error('Error handling disconnect:', error);
                }
            });
        });
    }
    
    private async searchUser(id: mongoose.Types.ObjectId, gender: string) {
        // Fixed query to properly search for users of opposite gender
        const matchingUser = await RandomVideoCall.findOne({
            userId: { $ne: id },
            status: 'searching',
            gender : { $ne :gender }
        })
        .populate({
            path: 'userId',
        });
        
        // If userId doesn't match our criteria after population, return null
        if (!matchingUser || !matchingUser.userId) {
            return null;
        }
        
        return matchingUser;
    }

    private async connectUser(request1: IRandomVideoCall, request2: IRandomVideoCall, socket: Socket) {
        try {

            request1.status = 'connected';
            request1.connectedWith = request2.userId;
            await request1.save();

            request2.status = 'connected';
            request2.connectedWith = request1.userId;
            await request2.save();

            // Notify both users about the connection
            socket.emit('call-user', request2.peerId);
            

            let timeOut =setTimeout(() => {
                try {
                    socket.to(request1.roomId).emit('end-call'  );
                    socket.to(request2.roomId).emit('end-call'  );
                    clearTimeout(timeOut)
                } catch (error) {
                    console.error(error);
                }
            }, VIDEO_CALL_DURATION + 2500);
          


        } catch (error) {
            console.error('Error connecting users:', error);
            socket.emit('error', { message: 'Failed to establish connection' });
        }
    }


    // Helper method to clean up existing sessions for a user
    private async cleanupUserSessions(userId: mongoose.Types.ObjectId) {
        try {
            if (!userId) return;
            await RandomVideoCall.deleteMany(
                { 
                    userId: userId,
                    status: { $in: ['searching', 'connected'] }
                },
            );
        } catch (error) {
            console.error('Error cleaning up user sessions:', error);
        }
    }

    // Static method to get instance
    static getInstance(io: Namespace) { // Fixed typo in method name
        return new randomVideoCallSocketService(io);
    }
}