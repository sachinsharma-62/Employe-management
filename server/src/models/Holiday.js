import mongoose from 'mongoose';
import { HOLIDAY_SCOPES, HOLIDAY_TYPES } from '../utils/enums.js';

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Holiday name is required'],
      trim: true,
      maxlength: 100,
    },
    date: { type: Date, required: [true, 'Holiday date is required'] },
    type: {
      type: String,
      enum: {
        values: HOLIDAY_TYPES,
        message: 'Invalid holiday type: {VALUE}',
      },
      default: 'NATIONAL',
    },
    optional: { type: Boolean, default: false },
    description: { type: String, trim: true, maxlength: 300, default: '' },

    scope: {
      type: String,
      enum: {
        values: HOLIDAY_SCOPES,
        message: 'Invalid scope: {VALUE}',
      },
      default: 'ALL',
    },
    locations: { type: [String], default: [] },
    departments: { type: [String], default: [] },

    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
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

holidaySchema.index({ date: 1 });
holidaySchema.index({ name: 1, date: 1 }, { unique: true });
holidaySchema.index({ scope: 1 });

export default mongoose.model('Holiday', holidaySchema);
