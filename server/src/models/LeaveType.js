import mongoose from 'mongoose';
import { LEAVE_APPLICABLE_SCOPES, LEAVE_TYPES } from '../utils/enums.js';

const leaveTypeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Leave code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      enum: {
        values: LEAVE_TYPES,
        message: 'Invalid leave code: {VALUE}',
      },
    },
    name: {
      type: String,
      required: [true, 'Leave name is required'],
      trim: true,
      maxlength: 80,
    },
    description: { type: String, trim: true, maxlength: 300, default: '' },

    totalDays: {
      type: Number,
      default: 0,
      min: [0, 'Total days cannot be negative'],
      max: 366,
    },
    carryForward: { type: Boolean, default: false },
    carryForwardLimit: {
      type: Number,
      default: 0,
      min: [0, 'Carry forward limit cannot be negative'],
      max: 366,
    },
    encashable: { type: Boolean, default: false },

    applicableScope: {
      type: String,
      enum: {
        values: LEAVE_APPLICABLE_SCOPES,
        message: 'Invalid applicable scope: {VALUE}',
      },
      default: 'ALL',
    },
    applicableRoles: { type: [String], default: [] },
    applicableDepartments: { type: [String], default: [] },
    applicableEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    isActive: { type: Boolean, default: true },
    color: { type: String, trim: true, default: 'indigo' },
  },
  { timestamps: true }
);

leaveTypeSchema.index({ isActive: 1, code: 1 });

export default mongoose.model('LeaveType', leaveTypeSchema);
