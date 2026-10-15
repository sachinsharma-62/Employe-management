import mongoose from 'mongoose';
import { ATTENDANCE_MODES, ATTENDANCE_STATUSES } from '../utils/enums.js';

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: { type: Date, required: [true, 'Attendance date is required'] },
    status: {
      type: String,
      enum: {
        values: ATTENDANCE_STATUSES,
        message: 'Invalid attendance status: {VALUE}',
      },
      default: 'PRESENT',
    },
    workMode: {
      type: String,
      enum: {
        values: ATTENDANCE_MODES,
        message: 'Invalid work mode: {VALUE}',
      },
      default: 'OFFICE',
    },
    checkIn: { type: String, trim: true, default: '' },
    checkOut: { type: String, trim: true, default: '' },
    sessions: [
      {
        _id: false,
        checkIn: { type: String, trim: true, default: '' },
        checkOut: { type: String, trim: true, default: '' },
      },
    ],
    hoursWorked: { type: Number, default: 0, min: 0, max: 24 },
    workedMinutes: { type: Number, default: 0, min: 0, max: 1440 },
    lateMinutes: { type: Number, default: 0, min: 0 },
    overtimeMinutes: { type: Number, default: 0, min: 0 },
    breakMinutes: { type: Number, default: 0, min: 0 },
    shortMinutes: { type: Number, default: 0, min: 0 },
    note: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: -1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
