import mongoose from 'mongoose';
import { NOTE_VISIBILITIES } from '../utils/enums.js';

const employeeNoteSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    body: { type: String, required: [true, 'Note content is required'], trim: true, maxlength: 2000 },
    visibility: {
      type: String,
      enum: {
        values: NOTE_VISIBILITIES,
        message: 'Invalid note visibility: {VALUE}',
      },
      default: 'TEAM',
    },
  },
  { timestamps: true }
);

employeeNoteSchema.index({ employee: 1, createdAt: -1 });

export default mongoose.model('EmployeeNote', employeeNoteSchema);
