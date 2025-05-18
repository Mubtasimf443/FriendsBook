/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Socket } from "socket.io";
import { Namespace } from "socket.io";
import { verifiyToken } from "../lib/middlewares/socket.middleware";
import { NextFunction } from "express";
import { z } from "zod";

export enum NotificationFor {
    ALL= 'all_users',
    MATRIMONY_USERS= 'matrimony_users',
    VIDEO_USERS= 'video_users',
}


export enum NotificationType {
    ADMIN = "admin_notification"
}


export interface INotificationSocketService {
    // sendGlobalNotification(notification: any): void;
    // sendProfileNotification(profileType: 'videoProfile' | 'matrimonyProfile', notification: any): void;
}

export class NotificationSocketService {
    private io: Namespace;
   
    constructor(io: Namespace) {
        this.io = io;
        this.initializeListeners();
    }

    private async initializeListeners() {
        this.io.on('connection', async (socket: Socket) => {
           
            socket.emit('connection-success' , null) 
       
            // if (socket.data.profileType === 'matrimonyProfile') {
               
            //     socket.join('matrimonyProfileRoom');
                
            
            // } else 
            // if (socket.data.profileType === 'videoProfile') {
            //     socket.join('videoProfileRoom');
            // }
            
            socket.on('hi' , () => socket.emit('hello'))


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
