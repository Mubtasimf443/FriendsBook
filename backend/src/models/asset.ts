/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { randomUUID } from 'crypto';
import mongoose, { Document, Schema } from 'mongoose';



// Define the asset types we'll support
export enum AssetType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio'
}

// Upload info interface
export interface IUploadInfo {
  host: string;      
  host_id: string;   
  path?: string;    
}

// Interface for Asset document
export interface IAsset extends Document {
  name?: string;
  url: string;
  asset_type: AssetType;
  size?: number;
  created_at: Date;
  updated_at?: Date;
  uploadInfo: IUploadInfo;
  id : string;
}

// Create the uploadInfo schema
const UploadInfoSchema = new Schema<IUploadInfo>({
  host: {
    type: String,
    required: [true, 'Host service name is required'],
    trim: true
  },
  host_id: {
    type: String,
    required: [true, 'Host ID is required'],
    trim: true
  },
  path: {
    type: String,
    required: false,
    trim: true
  }
}, { _id: false }); // Disable _id for subdocument

// Create the Asset Schema
const AssetSchema = new Schema<IAsset>(
  {
    id : {
      type :String,
      required : true,
      index : true ,
      unique : true , 
      immutable : true ,
      default : randomUUID
    },
    name: {
      type: String,
      required: false,
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'Asset URL is required'],
      unique: true,
      trim: true
    },
    asset_type: {
      type: String,
      enum: Object.values(AssetType),
      required: [true, 'Asset type is required'],
    },
    size: {
      type: Number,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Size must be an integer'
      }
    },
    uploadInfo: {
      type: UploadInfoSchema,
      required: [true, 'Upload information is required']
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  }
);

// Indexes for performance optimization
AssetSchema.index({ asset_type: 1 });
AssetSchema.index({ created_at: -1 });
AssetSchema.index({ size: 1 });
AssetSchema.index({ 'uploadInfo.host': 1 });
AssetSchema.index({ 'uploadInfo.host_id': 1 });

// Add compound index for host and host_id
AssetSchema.index({ 'uploadInfo.host': 1, 'uploadInfo.host_id': 1 }, { unique: true });

export const Asset = mongoose.model<IAsset>('Asset', AssetSchema);