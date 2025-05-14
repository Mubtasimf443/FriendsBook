/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Server as SocketIOServer, Socket, ExtendedError } from 'socket.io';
import socketController from '../controllers/socket.controller';
import { IUser } from '../lib/types/user.types';
import { IVideoProfile } from '../models/VideoProfile';



declare module 'socket.io' {
  interface Socket {
    user?: IUser | IVideoProfile |any;
    userProfileType?: "videoProfile" | "matrimonyProfile";
  }
}
export class SocketService {
    private io: SocketIOServer;
    //   private randomVideoCallService: RandomVideoCallService;

    constructor(io: SocketIOServer) {
        this.io = io;
        // this.randomVideoCallService = new RandomVideoCallService(io);

        // Middleware for authentication
        this.io.use(async (socket :Socket, next : (error ?: ExtendedError | undefined  ) => void ) => {
            try {
                let profileType =socket.handshake.auth.profileType;
                const token = socket.handshake.auth.token;
                
                let verificationRasult = await socketController.verifiyToken({ profileType , token })
                if (verificationRasult === false) {
                    next(new Error('Verification Error'));
                    return;
                }
                socket.user = verificationRasult.user;
                socket.userProfileType =verificationRasult.profileType;
                next();
            } catch (error) {
                console.error('Socket authentication error:', error);
                next(new Error('Socket Io validation error'))
            }
        });

        this.initializeListeners();

        // Run cleanup job every minute
        // setInterval(() => {
        //   this.randomVideoCallService.cleanupStaleSearches();
        // }, 60 * 1000);
    }

    private initializeListeners(): void {
        this.io.on('connection', (socket: Socket) => {
            console.log(`User connected: ${socket.data.userId}`);

            // Listen for random call requests
            //   socket.on('start-random-call', async (data) => {
            //     try {
            //       const { location, preferences } = data;

            //       if (!location || !location.latitude || !location.longitude) {
            //         return socket.emit('error', { 
            //           message: 'Location coordinates are required' 
            //         });
            //       }

            //       const userId = socket.data.userId;

            //       // Start searching for a random call
            //       await this.randomVideoCallService.initiateRandomCall(
            //         userId,
            //         socket.id,
            //         location,
            //         preferences
            //       );

            //       socket.emit('searching-for-call', { 
            //         message: 'Searching for a random call partner...' 
            //       });
            //     } catch (error) {
            //       console.error('Error starting random call:', error);
            //       socket.emit('error', { 
            //         message: 'Failed to initiate random call' 
            //       });
            //     }
            //   });

            //   // Handle call cancellation
            //   socket.on('cancel-random-call', async () => {
            //     try {
            //       const userId = socket.data.userId;
            //       await this.randomVideoCallService.cancelExistingSearches(userId);
            //       socket.emit('call-cancelled', { 
            //         message: 'Call search has been cancelled' 
            //       });
            //     } catch (error) {
            //       console.error('Error cancelling call:', error);
            //       socket.emit('error', { 
            //         message: 'Failed to cancel call' 
            //       });
            //     }
            //   });

            //   // Handle call ending
            //   socket.on('end-random-call', async () => {
            //     try {
            //       const userId = socket.data.userId;
            //       await this.randomVideoCallService.endCall(userId);
            //       socket.emit('call-ended', { 
            //         message: 'Call has been ended' 
            //       });
            //     } catch (error) {
            //       console.error('Error ending call:', error);
            //       socket.emit('error', { 
            //         message: 'Failed to end call' 
            //       });
            //     }
            //   });

            //   // Signal events for WebRTC
            //   socket.on('signal', async (data) => {
            //     const { sessionId, signal } = data;

            //     // Forward the signal to the other peer in the same session
            //     socket.to(sessionId).emit('signal', {
            //       userId: socket.data.userId,
            //       signal
            //     });
            //   });

            //   // Handle disconnection
            socket.on('disconnect', async () => {
                try {
                    //   await this.randomVideoCallService.handleUserDisconnect(socket.id);
                    //   console.log(`User disconnected: ${socket.data.userId}`);
                    console.log('Disconnected soceket')
                } catch (error) {
                    console.error('Error handling disconnect:', error);
                }
            });


        });
    }


}