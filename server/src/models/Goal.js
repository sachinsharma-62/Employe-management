import mongoose from 'mongoose';
import { GOAL_CATEGORIES, GOAL_STATUSES } from '../utils/enums.js';

const goalSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: [true, 'Goal title is required'], trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    category: {
      type: String,
      enum: {
        values: GOAL_CATEGORIES,
        message: 'Invalid goal category: {VALUE}',
      },
      default: 'BUSINESS',
    },
    weight: { type: Number, default: 0, min: 0, max: 100 },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: {
        values: GOAL_STATUSES,
        message: 'Invalid goal status: {VALUE}',
      },
      default: 'NOT_STARTED',
    },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

goalSchema.index({ employee: 1, dueDate: 1 });

export default mongoose.model('Goal', goalSchema);
