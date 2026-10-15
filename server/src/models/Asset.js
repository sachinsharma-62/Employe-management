import mongoose from 'mongoose';
import { ASSET_CONDITIONS, ASSET_STATUSES, ASSET_TYPES } from '../utils/enums.js';

const assetSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: [true, 'Asset name is required'], trim: true, maxlength: 120 },
    type: {
      type: String,
      enum: {
        values: ASSET_TYPES,
        message: 'Invalid asset type: {VALUE}',
      },
      default: 'LAPTOP',
    },
    serialNumber: { type: String, trim: true, default: '' },
    condition: {
      type: String,
      enum: {
        values: ASSET_CONDITIONS,
        message: 'Invalid asset condition: {VALUE}',
      },
      default: 'GOOD',
    },
    status: {
      type: String,
      enum: {
        values: ASSET_STATUSES,
        message: 'Invalid asset status: {VALUE}',
      },
      default: 'ASSIGNED',
    },
    assignedDate: { type: Date, default: Date.now },
    returnedDate: { type: Date, default: null },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

assetSchema.index({ employee: 1, status: 1 });

export default mongoose.model('Asset', assetSchema);
