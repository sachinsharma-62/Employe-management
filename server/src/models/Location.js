import mongoose from 'mongoose';
import { LOCATION_TYPES } from '../utils/enums.js';

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
      maxlength: 60,
    },
    type: {
      type: String,
      enum: {
        values: LOCATION_TYPES,
        message: 'Invalid location type: {VALUE}',
      },
      default: 'BRANCH',
    },
    address: { type: String, trim: true, maxlength: 200, default: '' },
    city: { type: String, trim: true, maxlength: 60, default: '' },
    state: { type: String, trim: true, maxlength: 60, default: '' },
    country: { type: String, trim: true, maxlength: 60, default: '' },
    pincode: { type: String, trim: true, maxlength: 12, default: '' },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

locationSchema.index({ name: 1 }, { unique: true });

export default mongoose.model('Location', locationSchema);