import connectDB from './config/db.js';
import seedUsers from './utils/seedUsers.js';
import seedEmployeeModules from './utils/seedModules.js';
import seedOrganization from './utils/seedOrganization.js';
import seedLeaveTypes from './utils/seedLeaveTypes.js';
import seedHolidays from './utils/seedHolidays.js';
import seedEvents from './utils/seedEvents.js';
import seedSettings from './utils/seedSettings.js';
import seedJobs from './utils/seedJobs.js';

const seed = async () => {
  await connectDB();
  const { demoUsers, created, updated } = await seedUsers();
  const leaveTypes = await seedLeaveTypes();
  const holidays = await seedHolidays();
  const { users } = await seedEmployeeModules();
  const events = await seedEvents();
  const settings = await seedSettings();
  const recruiting = await seedJobs();
  const counts = await seedOrganization();

  console.log(`Seed complete. Created: ${created}, Updated: ${updated}`);
  console.log(
    `Leave types seeded: ${leaveTypes.total} (created ${leaveTypes.created}, updated ${leaveTypes.updated}).`
  );
  console.log(
    `Holidays seeded: ${holidays.total} (created ${holidays.created}, updated ${holidays.updated}).`
  );
  console.log(`Employee profile modules seeded for ${users} employee(s).`);
  console.log(
    `Events seeded: ${events.total} (created ${events.created}, updated ${events.updated}).`
  );
  console.log(
    `Settings seeded: ${settings.total} (created ${settings.created}, updated ${settings.updated}).`
  );
  console.log(
    `Recruiting seeded: ${recruiting.jobs.total} jobs (created ${recruiting.jobs.created}) and ${recruiting.candidates.total} candidates (created ${recruiting.candidates.created}).`
  );
  console.log(
    `Organization seeded: ${counts.departments} departments, ${counts.designations} designations, ${counts.teams} teams, ${counts.locations} locations.`
  );
  console.log('Demo logins:');
  for (const u of demoUsers) console.log(`  ${u.email} | ${u.password} | ${u.role}`);
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
