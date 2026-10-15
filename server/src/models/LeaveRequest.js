import mongoose from 'mongoose';
import { LEAVE_STATUSES, LEAVE_TYPES } from '../utils/enums.js';

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, default: '' },
    name: { type: String, trim: true, default: '' },
    mimeType: { type: String, trim: true, default: '' },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const leaveRequestSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: LEAVE_TYPES,
        message: 'Invalid leave type: {VALUE}',
      },
      required: [true, 'Leave type is required'],
    },
    fromDate: { type: Date, required: [true, 'Start date is required'] },
    toDate: { type: Date, required: [true, 'End date is required'] },
    days: { type: Number, required: true, min: 0.5 },
    leaveYear: { type: Number, index: true },
    reason: { type: String, trim: true, maxlength: 500, default: '' },
    attachment: { type: attachmentSchema, default: () => ({}) },
    status: {
      type: String,
      enum: {
        values: LEAVE_STATUSES,
        message: 'Invalid leave status: {VALUE}',
      },
      default: 'PENDING',
      index: true,
    },
    appliedAt: { type: Date, default: Date.now },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    decidedAt: { type: Date, default: null },
    decisionNote: { type: String, trim: true, maxlength: 300, default: '' },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ employee: 1, fromDate: -1 });
leaveRequestSchema.index({ employee: 1, status: 1, leaveYear: 1 });

leaveRequestSchema.pre('save', function setLeaveYear(next) {
  if (this.fromDate) this.leaveYear = new Date(this.fromDate).getFullYear();
  next();
});

export default mongoose.model('LeaveRequest', leaveRequestSchema);
