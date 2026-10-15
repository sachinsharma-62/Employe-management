import mongoose from 'mongoose';

const designationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Designation title is required'],
      trim: true,
      maxlength: 60,
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    description: { type: String, trim: true, maxlength: 500, default: '' },
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

designationSchema.index({ title: 1 }, { unique: true });

export default mongoose.model('Designation', designationSchema);