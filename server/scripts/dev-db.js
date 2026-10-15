import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create();
process.env.MONGO_URI = mongod.getUri('office_management');

console.log(`In-memory MongoDB ready at ${mongod.getUri()}`);

await import('../src/server.js');

const { default: seedUsers } = await import('../src/utils/seedUsers.js');
const { default: seedEmployeeModules } = await import('../src/utils/seedModules.js');
const { default: seedOrganization } = await import('../src/utils/seedOrganization.js');
const { default: seedLeaveTypes } = await import('../src/utils/seedLeaveTypes.js');
const { default: seedHolidays } = await import('../src/utils/seedHolidays.js');
const { default: seedEvents } = await import('../src/utils/seedEvents.js');
const { default: seedSettings } = await import('../src/utils/seedSettings.js');
const { default: seedJobs } = await import('../src/utils/seedJobs.js');

const { demoUsers, created, updated } = await seedUsers();
const { users } = await seedEmployeeModules();
const counts = await seedOrganization();
const leaveTypes = await seedLeaveTypes();
const holidays = await seedHolidays();
const events = await seedEvents();
const settings = await seedSettings();
const recruiting = await seedJobs();

console.log(`Demo users seeded (created: ${created}, updated: ${updated}):`);
for (const u of demoUsers) console.log(`  ${u.email} | ${u.password} | ${u.role}`);
console.log(`Employee profile modules seeded for ${users} employee(s).`);
console.log(
  `Organization seeded: ${counts.departments} departments, ${counts.designations} designations, ${counts.teams} teams, ${counts.locations} locations.`
);
console.log(
  `Leave types seeded: ${leaveTypes.total} (created: ${leaveTypes.created}, updated: ${leaveTypes.updated}).`
);
console.log(
  `Holidays seeded: ${holidays.total} (created: ${holidays.created}, updated: ${holidays.updated}).`
);
console.log(
  `Events seeded: ${events.total} (created: ${events.created}, updated: ${events.updated}).`
);
console.log(
  `Settings seeded: ${settings.total} (created: ${settings.created}, updated: ${settings.updated}).`
);
console.log(
  `Recruiting seeded: ${recruiting.jobs.total} jobs (created: ${recruiting.jobs.created}) and ${recruiting.candidates.total} candidates (created: ${recruiting.candidates.created}).`
);
