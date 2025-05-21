/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { ExtendedError, Socket } from "socket.io";
import { Namespace } from "socket.io";
import { verifiyToken } from "../lib/middlewares/socket.middleware";
import { NextFunction } from "express";
import { z } from "zod";
import { authSessionValidation } from "../lib/schema/auth.schema";
import VideoProfile from "../models/VideoProfile";
import AuthSession from "../models/AuthSession";
import { User } from "../models/user";

export enum NotificationFor {
    ALL= 'all_users',
    MATRIMONY_USERS= 'matrimony_users',
    VIDEO_USERS= 'video_users',
}
export enum NotificationType {
    ADMIN = "admin_notification"
}
export enum Rooms {
    VIDEO_ROOMS = 'video_calling_members_room',
    MATRIMONY_ROOMS = 'matrimony_members_room',
    ALL_USERS_ROOMS = 'all_members_room',
}


export interface INotificationSocketService {
    // sendGlobalNotification(notification: any): void;
    // sendProfileNotification(profileType: 'videoProfile' | 'matrimonyProfile', notification: any): void;
}

export class NotificationSocketService {
    private io: Namespace;
   
    constructor(io: Namespace) {
        this.io = io;
        io.use(async function (socket, next: (error?: ExtendedError | undefined) => void): Promise<any> {
            try {
                let { token, profileType } = await socket.handshake.auth;
                token = authSessionValidation.parse(token);
                if (profileType === 'video_calling_member') {
                    let videoCallingMember = await VideoProfile.findOne({ 'auth.authSession': token });
                    if (videoCallingMember) {
                        socket.user_id = videoCallingMember._id.toString();
                        socket.userProfileType = 'videoProfile';
                        videoCallingMember.socket_ids.messaging_socket = socket.id;
                        await videoCallingMember.save();
                        return next();
                    } else return next(new Error('Failed To Authenticate the User'));
                } else {
                    let matrimonyProfile = await AuthSession.findOne({ key: token }, 'value.userId');
                    if (matrimonyProfile) {
                        socket.user_id = matrimonyProfile.value.userId.toString();
                        socket.userProfileType = 'matrimonyProfile';
                        await User.findByIdAndUpdate(socket.user_id, { 'socket_ids.messaging_socket': socket.id })
                        return next();
                    } else return next(new Error('Failed To Authenticate the User'));
                }
            } catch (error) {
                next(new Error('Failed to Authenticate User'));
            }
        });
        this.initializeListeners();
    }

    private async initializeListeners() {
        this.io.on('connection', async (socket: Socket) => {
          
            socket.emit('connection-success' , null) 
       
            socket.on('video-users-notification-request' , (data)  => {
                socket.emit('notification-request-accepted', 'video_calling_members')
            });

            socket.on('matrimony-users-notification-request' , (data)  => {
                socket.emit('notification-request-accepted', 'matrimony_members')
            });
            
            socket.on('all-users-notification-request' , (data)  => {
                socket.emit('notification-request-accepted', 'all_members')
            });
           
            socket.on('admin_notification' ,(playload) => {
                try {
                    let {type , title , message} = (z.object({
                        title : z.string().min(10).max(80),
                        message : z.string().min(20).max(140),
                        type : z.nativeEnum(NotificationFor)
                    })).parse(playload);

                  
                    this.io.emit('notifcation' , {
                        type : NotificationType.ADMIN ,
                        for :type,
                        data : {
                            title ,
                            message
                        }
                    });

                    socket.emit('notification_sent' , null)
                } catch (error) {
                    console.error(error);
                    socket.emit('notification_error' , null)
                }
                
            });
            socket.on('disconnect', () => { });
        });
    }
  
    // public sendGlobalNotification(notification: any) {
    //     this.io.emit('notification', notification);
    // }
    
    
    // public sendProfileNotification(profileType: 'videoProfile' | 'matrimonyProfile', notification: any) {
    //     if (profileType === 'videoProfile') {
    //         this.io.to('videoProfileRoom').emit('notification', notification);
    //     } else if (profileType === 'matrimonyProfile') {
    //         this.io.to('matrimonyProfileRoom').emit('notification', notification);
    //     }
    // }

    static getInstance(io: Namespace) { 
        return new NotificationSocketService(io);
    }
}
