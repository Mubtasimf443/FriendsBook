/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import mongoose, { Schema, Document } from 'mongoose';
import { Language } from '../lib/types/user.types';
import { randomUUID } from 'crypto';

export interface IRandomVideoCall extends Document {
  userId: mongoose.Types.ObjectId;
  id : string ;
  status: 'searching' | 'connected' | 'ended';
  location: {
    type: string;
    coordinates: number[];
  };
  languages : string[],
  connectedWith?: mongoose.Types.ObjectId;
  sessionId?: string;
  createdAt: Date;
  updatedAt: Date;
  socketId: string;
  roomId: string;
}

const RandomVideoCallSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'VideoProfile',
      required: true,
    },
    id : {
      type : String ,
      required : true , 
      default :() =>  randomUUID()
    },
    status: {
      type: String,
      enum: ['searching', 'connected', 'ended'],
      default: 'searching',
    },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    
    connectedWith: {
      type: Schema.Types.ObjectId,
      ref: 'VideoProfile',
    },

    sessionId: {
      type: String,
    },

    languages : [
      {
      type : String , 
      enum : Object.values(Language)
    }  
  ], 
  socketId :{
    type: String,
    required: true,
  },
    roomId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Index for geospatial queries
RandomVideoCallSchema.index({ location: '2dsphere' });
// Index for fast status lookups
RandomVideoCallSchema.index({ status: 1 });

export const RandomVideoCall = mongoose.model<IRandomVideoCall>('RandomVideoCall', RandomVideoCallSchema);