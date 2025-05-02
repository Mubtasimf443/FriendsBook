/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { z } from 'zod';
import { AssetType } from '../../models/asset';


export const createAssetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  asset_type: z.enum([AssetType.IMAGE, AssetType.VIDEO, AssetType.DOCUMENT, AssetType.AUDIO]),
  file: z.any(), // This will be validated in the middleware
});

export const updateAssetSchema = z.object({
  name: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
