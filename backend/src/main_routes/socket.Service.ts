/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Server as SocketIOServer, Socket, ExtendedError } from 'socket.io';
import socketController from '../controllers/socket.controller';
import { IUser } from '../lib/types/user.types';
import { IVideoProfile } from '../models/VideoProfile';
import '../lib/types/socket.decralation'



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