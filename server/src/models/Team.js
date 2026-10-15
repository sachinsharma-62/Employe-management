import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: 60,
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
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

teamSchema.index({ name: 1 }, { unique: true });

export default mongoose.model('Team', teamSchema);