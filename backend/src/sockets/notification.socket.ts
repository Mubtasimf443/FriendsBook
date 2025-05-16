/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Socket } from "socket.io";
import { Namespace } from "socket.io";
import { verifiyToken } from "../lib/middlewares/socket.middleware";
import { NextFunction } from "express";


export interface INotificationSocketService {
    sendGlobalNotification(notification: any): void;
    sendProfileNotification(profileType: 'videoProfile' | 'matrimonyProfile', notification: any): void;
}

export class NotificationSocketService {
    private io: Namespace;
   
    constructor(io: Namespace) {
        this.io = io;
        this.initializeListeners();
    }

    private async initializeListeners() {
        this.io.on('connection', async (socket: Socket) => {
           
            socket.use(async (packet, next) => {
                try {
                    const details = await verifiyToken({ 
                        profileType: socket.handshake.auth.profileType, 
                        token: socket.handshake.auth.token 
                    });

                    if (!details) {
                        return next(new Error('Failed to validate the user'));
                    }
               
                   
                    socket.data.profileType = details.profileType;
                    socket.data.user = details.user;
                    
                    next();
                } catch (error) {
                    next(new Error('User Validation Error'));
                }
            });
            
       
            if (socket.data.profileType === 'matrimonyProfile') {
               
                socket.join('matrimonyProfileRoom');
                
            
            } else if (socket.data.profileType === 'videoProfile') {
                socket.join('videoProfileRoom');
            }
            
           
            
            socket.on('disconnect', () => { });
        });
    }
  
    public sendGlobalNotification(notification: any) {
        this.io.emit('notification', notification);
    }
    
    
    public sendProfileNotification(profileType: 'videoProfile' | 'matrimonyProfile', notification: any) {
        if (profileType === 'videoProfile') {
            this.io.to('videoProfileRoom').emit('notification', notification);
        } else if (profileType === 'matrimonyProfile') {
            this.io.to('matrimonyProfileRoom').emit('notification', notification);
        }
    }

    static getInstance(io: Namespace) { 
        return new NotificationSocketService(io);
    }
}
