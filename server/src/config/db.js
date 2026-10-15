import mongoose from 'mongoose';
import env from './env.js';

const connectDB = async () => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
};

export default connectDB;
