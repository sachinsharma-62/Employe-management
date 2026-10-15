import mongoose from 'mongoose';
import { EVENT_TYPES } from '../utils/enums.js';

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: 200,
    },
    date: { type: Date, required: [true, 'Event date is required'] },
    startTime: { type: String, required: [true, 'Start time is required'], trim: true },
    endTime: { type: String, required: [true, 'End time is required'], trim: true },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: 500,
    },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required'],
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    type: {
      type: String,
      enum: { values: EVENT_TYPES, message: 'Invalid event type: {VALUE}' },
      default: 'COMPANY_EVENT',
    },
    isPublic: { type: Boolean, default: false },
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

eventSchema.index({ date: 1 });
eventSchema.index({ name: 1, date: 1 }, { unique: true });
eventSchema.index({ type: 1, isPublic: 1, isActive: 1 });
eventSchema.index({ participants: 1 });

export default mongoose.model('Event', eventSchema);
