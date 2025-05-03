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
  name?: string;
  path: string;
  url: string;
  asset_type: AssetType;
  id: string;
  size?: number;
  created_at: Date;
  updated_at?: Date;
}

// Create the Asset Schema
const AssetSchema = new Schema<IAsset>(
  {
    name: {
      type: String,
      required:false,
      trim: true,
    },
    path: {
      type: String,
      required: [true, 'Asset path is required'],
    },
    url: {
      type: String,
      required: [true, 'Asset URL is required'],
      unique : true
    },
    asset_type: {
      type: String,
      enum: Object.values(AssetType),
      required: [true, 'Asset type is required'],
    },
    id: {
      type: String,
      required: [true, 'Cloudinary ID is required'],
      unique: true,
    },
    size: {
      type: Number
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  }
);

// 1. Index asset_type for filtering by file type (image, video, etc.)
AssetSchema.index({ asset_type: 1 });

// 2. Index created_at for sorting by newest/oldest assets
AssetSchema.index({ created_at: -1 });

// 3. Optional: Index size if you query/filter based on file size
// (e.g., all assets under 5MB)
AssetSchema.index({ size: 1 });


export const Asset = mongoose.model<IAsset>('Asset', AssetSchema);