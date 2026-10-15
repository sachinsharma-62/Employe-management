import Event from '../models/Event.js';
import User from '../models/User.js';

const dateInYear = (year, month, day) => new Date(year, month - 1, day);

// A spread of company events for the current year so the calendar is populated
// out of the box. Idempotent per year via the (name, date) lookup below.
const buildEvents = (year, users) => {
  const byEmail = (email) => users.find((user) => user.email === email) || users[0];
  const admin = byEmail('hr@office.com');
  const manager = byEmail('manager@office.com');
  const everyone = users.filter((user) => user.isActive).map((user) => user._id);
  const team = users.filter((user) => user.isActive).slice(0, 6).map((user) => user._id);

  return [
    {
      name: 'Annual Kickoff',
      type: 'COMPANY_EVENT',
      date: dateInYear(year, 1, 15),
      startTime: '10:00',
      endTime: '12:00',
      location: 'Main Auditorium',
      organizer: admin._id,
      participants: everyone,
      isPublic: true,
      description: 'Company-wide kickoff with the annual roadmap and awards.',
    },
    {
      name: 'Team Outing',
      type: 'TEAM_OUTING',
      date: dateInYear(year, 2, 14),
      startTime: '09:00',
      endTime: '18:00',
      location: 'Lonavala Resort',
      organizer: manager._id,
      participants: team,
      isPublic: true,
      description: 'Full-day outing with games, lunch and team activities.',
    },
    {
      name: 'Women’s Day Celebration',
      type: 'CELEBRATION',
      date: dateInYear(year, 3, 8),
      startTime: '16:00',
      endTime: '17:30',
      location: 'Cafeteria',
      organizer: admin._id,
      participants: everyone,
      isPublic: true,
      description: 'An evening of talks and appreciation.',
    },
    {
      name: 'React Workshop',
      type: 'WORKSHOP',
      date: dateInYear(year, 4, 22),
      startTime: '14:00',
      endTime: '17:00',
      location: 'Training Room 2',
      organizer: manager._id,
      participants: team,
      isPublic: true,
      description: 'Hands-on workshop on modern React patterns.',
    },
    {
      name: 'Leadership Training',
      type: 'TRAINING',
      date: dateInYear(year, 5, 20),
      startTime: '10:00',
      endTime: '13:00',
      location: 'Board Room',
      organizer: admin._id,
      participants: team,
      isPublic: true,
      description: 'Manager enablement session on coaching and feedback.',
    },
    {
      name: 'Foundation Day',
      type: 'CELEBRATION',
      date: dateInYear(year, 6, 15),
      startTime: '11:00',
      endTime: '15:00',
      location: 'Head Office Lawn',
      organizer: admin._id,
      participants: everyone,
      isPublic: true,
      description: 'Celebrating the anniversary of the company.',
    },
    {
      name: 'Quarterly Town Hall',
      type: 'MEETING',
      date: dateInYear(year, 7, 10),
      startTime: '15:00',
      endTime: '16:00',
      location: 'Auditorium',
      organizer: admin._id,
      participants: everyone,
      isPublic: true,
      description: 'Quarterly results, product updates and open Q&A.',
    },
    {
      name: 'Engineering Offsite',
      type: 'TEAM_OUTING',
      date: dateInYear(year, 8, 5),
      startTime: '09:30',
      endTime: '18:00',
      location: 'Goa',
      organizer: manager._id,
      participants: team,
      isPublic: false,
      description: 'Offsite planning and team building for engineering.',
    },
    {
      name: 'Birthday Bash',
      type: 'BIRTHDAY',
      date: dateInYear(year, 9, 12),
      startTime: '17:00',
      endTime: '18:00',
      location: 'Cafeteria',
      organizer: admin._id,
      participants: everyone,
      isPublic: true,
      description: 'Monthly birthday celebration for team members.',
    },
    {
      name: 'Design Workshop',
      type: 'WORKSHOP',
      date: dateInYear(year, 11, 20),
      startTime: '14:00',
      endTime: '17:00',
      location: 'Design Studio',
      organizer: manager._id,
      participants: team,
      isPublic: true,
      description: 'Design systems deep-dive for product teams.',
    },
    {
      name: 'Work Anniversary Felicitation',
      type: 'ANNIVERSARY',
      date: dateInYear(year, 12, 10),
      startTime: '16:00',
      endTime: '17:00',
      location: 'Auditorium',
      organizer: admin._id,
      participants: everyone,
      isPublic: true,
      description: 'Recognising work anniversaries across the year.',
    },
    {
      name: 'Year-end Gala',
      type: 'CELEBRATION',
      date: dateInYear(year, 12, 20),
      startTime: '18:00',
      endTime: '22:00',
      location: 'Grand Banquet Hall',
      organizer: admin._id,
      participants: everyone,
      isPublic: true,
      description: 'Annual gala dinner with performances and awards.',
    },
  ];
};

const seedEvents = async () => {
  const users = await User.find().sort({ employeeId: 1 });
  if (!users.length) return { created: 0, updated: 0, total: 0 };

  const year = new Date().getFullYear();
  const events = buildEvents(year, users);

  let created = 0;
  let updated = 0;

  for (const data of events) {
    const existing = await Event.findOne({ name: data.name, date: data.date });
    if (existing) {
      Object.assign(existing, data);
      await existing.save();
      updated += 1;
      continue;
    }
    await Event.create(data);
    created += 1;
  }

  return { created, updated, total: events.length };
};

export default seedEvents;
