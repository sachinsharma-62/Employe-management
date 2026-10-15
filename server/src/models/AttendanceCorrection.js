import mongoose from 'mongoose';
import { ATTENDANCE_CORRECTION_STATUSES, ATTENDANCE_STATUSES } from '../utils/enums.js';

const attendanceCorrectionSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: { type: Date, required: [true, 'Attendance date is required'] },
    currentStatus: {
      type: String,
      enum: {
        values: ATTENDANCE_STATUSES,
        message: 'Invalid current status: {VALUE}',
      },
      default: 'ABSENT',
    },
    requestedStatus: {
      type: String,
      enum: {
        values: ATTENDANCE_STATUSES,
        message: 'Invalid requested status: {VALUE}',
      },
      default: 'PRESENT',
    },
    requestedCheckIn: { type: String, trim: true, default: '' },
    requestedCheckOut: { type: String, trim: true, default: '' },
    reason: { type: String, trim: true, required: [true, 'Reason is required'], maxlength: 500 },
    status: {
      type: String,
      enum: {
        values: ATTENDANCE_CORRECTION_STATUSES,
        message: 'Invalid correction status: {VALUE}',
      },
      default: 'PENDING',
      index: true,
    },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decidedAt: { type: Date, default: null },
    decisionNote: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

attendanceCorrectionSchema.index({ employee: 1, status: 1, createdAt: -1 });

export default mongoose.model('AttendanceCorrection', attendanceCorrectionSchema);