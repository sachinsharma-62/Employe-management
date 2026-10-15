import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Attendance from '../src/models/Attendance.js';
import AttendanceCorrection from '../src/models/AttendanceCorrection.js';

const start = new Date();
start.setHours(0, 0, 0, 0);
const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
const filter = { date: { $gte: start, $lt: end } };

const reset = async () => {
  await connectDB();
  const [attendance, corrections] = await Promise.all([
    Attendance.deleteMany(filter),
    AttendanceCorrection.deleteMany(filter),
  ]);
  console.log(
    `Today (${start.toDateString()}) reset: ${attendance.deletedCount} attendance record(s) cleared — every employee is now not present.`
  );
  console.log(`Cleared ${corrections.deletedCount} correction request(s) dated today.`);
  await mongoose.connection.close();
  process.exit(0);
};

reset().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
