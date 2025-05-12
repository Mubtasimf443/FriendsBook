/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import mongoose, { Schema, Document } from 'mongoose';

export interface IRandomVideoCall extends Document {
  userId: mongoose.Types.ObjectId;
  status: 'searching' | 'connected' | 'ended';
  location: {
    type: string;
    coordinates: number[];
  };
  preferences: {
    gender?: string;
    ageRange?: {
      min: number;
      max: number;
    };
    maxDistance?: number;
  };
  connectedWith?: mongoose.Types.ObjectId;
  sessionId?: string;
  createdAt: Date;
  updatedAt: Date;
  socketId: string;
}

const RandomVideoCallSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    preferences: {
      gender: {
        type: String,
        enum: ['male', 'female', 'any'],
        default: 'any',
      },
      ageRange: {
        min: {
          type: Number,
          default: 18,
        },
        max: {
          type: Number,
          default: 99,
        },
      },
      maxDistance: {
        type: Number,
        default: 50, // in kilometers
      },
    },
    connectedWith: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    sessionId: {
      type: String,
    },
    socketId: {
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