import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      maxlength: 60,
    },
    code: { type: String, trim: true, uppercase: true, maxlength: 20, default: null },
    head: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
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

departmentSchema.index({ name: 1 }, { unique: true });
departmentSchema.index({ code: 1 }, { unique: true, sparse: true });

export default mongoose.model('Department', departmentSchema);