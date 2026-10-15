import mongoose from 'mongoose';
import { PERFORMANCE_STATUSES } from '../utils/enums.js';

const performanceReviewSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cycle: { type: String, required: [true, 'Review cycle is required'], trim: true },
    periodStart: { type: Date, default: null },
    periodEnd: { type: Date, default: null },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rating: { type: Number, min: 1, max: 5, default: null },
    summary: { type: String, trim: true, maxlength: 2000, default: '' },
    strengths: { type: String, trim: true, maxlength: 1000, default: '' },
    improvements: { type: String, trim: true, maxlength: 1000, default: '' },
    status: {
      type: String,
      enum: {
        values: PERFORMANCE_STATUSES,
        message: 'Invalid review status: {VALUE}',
      },
      default: 'COMPLETED',
    },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

performanceReviewSchema.index({ employee: 1, reviewedAt: -1 });

export default mongoose.model('PerformanceReview', performanceReviewSchema);
