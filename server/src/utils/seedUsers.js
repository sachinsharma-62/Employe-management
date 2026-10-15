import User from '../models/User.js';
import buildDemoUsers from '../seedData.js';

const seedUsers = async () => {
  const demoUsers = buildDemoUsers();
  let created = 0;
  let updated = 0;

  for (const data of demoUsers) {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      for (const [key, value] of Object.entries(data)) {
        if (key === 'password' || key === 'email') continue;
        existing[key] = value;
      }
      existing.isActive = data.isActive !== undefined ? data.isActive : true;
      await existing.save();
      updated += 1;
      continue;
    }
    await User.create(data);
    created += 1;
  }

  return { demoUsers, created, updated };
};

export default seedUsers;
