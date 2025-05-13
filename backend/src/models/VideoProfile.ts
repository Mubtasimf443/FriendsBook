/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import mongoose, { Document, Schema, model } from 'mongoose';
import { IPassword, IUserImage, Language } from '../lib/types/user.types';


export interface IVideoProfile extends Document {
    name: string;
    email: string;
    profileImage?: IUserImage;
    coverImage?: IUserImage;
    gender: 'male' | 'female' | 'other';
    status: 'online' | 'offline' | 'busy';
    lastActive: Date;
    socketId?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    passwordDetails: IPassword,
    languages : Language[],
    authSession : String;
    location :{
        country : string ;
        lat : number ;
        long : number ;
    }
}


const videoProfileSchema = new Schema<IVideoProfile>(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        profileImage: {
            type: {},
            required: false,
        },
        coverImage: {
            type: {},
            required: false,
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            default: 'other'
        },
        status: {
            type: String,
            enum: ['online', 'offline', 'busy'],
            default: 'offline'
        },
        lastActive: {
            type: Date,
            default: Date.now
        },
        socketId: {
            type: String,
            default: null
        },
        passwordDetails: {
            type: {
                hashed: String,
                salt: String
            },
            required: true
        },
        languages : {
            type : [{
                type : String ,
                required : true 
            }],  
        },
        authSession : {
            type : String ,
           required : true 
        }
    },
    { timestamps: true }
);


const VideoProfile = model<IVideoProfile>('VideoProfile', videoProfileSchema);
export default VideoProfile;