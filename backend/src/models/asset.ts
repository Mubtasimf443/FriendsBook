/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */


import mongoose, { Document, Schema } from 'mongoose';

// Define the asset types we'll support
export enum AssetType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio'
}

// Interface for Asset document
export interface IAsset extends Document {
  name: string;
  path: string;
  url: string;
  asset_type: AssetType;
  cloudinary_id: string;
  size?: number;
  format?: string;
  created_at: Date;
  updated_at?: Date;
  user_id: mongoose.Types.ObjectId;
}

// Create the Asset Schema
const AssetSchema = new Schema<IAsset>(
  {
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
    },
    path: {
      type: String,
      required: [true, 'Asset path is required'],
    },
    url: {
      type: String,
      required: [true, 'Asset URL is required'],
    },
    asset_type: {
      type: String,
      enum: Object.values(AssetType),
      required: [true, 'Asset type is required'],
    },
    cloudinary_id: {
      type: String,
      required: [true, 'Cloudinary ID is required'],
      unique: true,
    },
    size: {
      type: Number,
    },
    format: {
      type: String,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  }
);


export const Asset = mongoose.model<IAsset>('Asset', AssetSchema);