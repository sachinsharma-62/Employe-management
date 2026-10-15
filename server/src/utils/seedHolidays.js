import Holiday from '../models/Holiday.js';

// National holiday calendar (shared across the organisation).
const NATIONAL = [
  { name: 'Republic Day', date: '2026-01-26' },
  { name: 'Maha Shivratri', date: '2026-02-21' },
  { name: 'Holi', date: '2026-03-04' },
  { name: 'Eid-ul-Fitr', date: '2026-03-20' },
  { name: 'Good Friday', date: '2026-04-03' },
  { name: 'Dr. Ambedkar Jayanti', date: '2026-04-14' },
  { name: 'Maharashtra Day', date: '2026-05-01' },
  { name: 'Eid-ul-Adha', date: '2026-05-27' },
  { name: 'Independence Day', date: '2026-08-15' },
  { name: 'Gandhi Jayanti', date: '2026-10-02' },
  { name: 'Dussehra', date: '2026-10-20' },
  { name: 'Diwali', date: '2026-11-08' },
  { name: 'Christmas', date: '2026-12-25' },
  { name: 'Republic Day', date: '2027-01-26' },
  { name: 'Holi', date: '2027-03-24' },
  { name: 'Independence Day', date: '2027-08-15' },
  { name: 'Gandhi Jayanti', date: '2027-10-02' },
  { name: 'Diwali', date: '2027-11-07' },
  { name: 'Christmas', date: '2027-12-25' },
];

// Company-specific holidays (optional / targeted by location or department).
const COMPANY = [
  {
    name: 'Company Foundation Day',
    date: '2026-06-15',
    type: 'COMPANY',
    optional: false,
    description: 'Annual celebration of our founding day.',
  },
  {
    name: 'Team Day',
    date: '2026-09-12',
    type: 'COMPANY',
    optional: true,
    description: 'Optional half-day — spend it with your team.',
  },
  {
    name: 'Diwali Bonus Day',
    date: '2026-11-09',
    type: 'COMPANY',
    optional: false,
    scope: 'LOCATIONS',
    locations: ['Head Office', 'Branch Office'],
    description: 'Extended festive break for office locations.',
  },
  {
    name: 'Engineering Off-Site',
    date: '2026-12-04',
    type: 'COMPANY',
    optional: true,
    scope: 'DEPARTMENTS',
    departments: ['Engineering'],
    description: 'Optional department holiday for the annual off-site.',
  },
];

const seedHolidays = async () => {
  let created = 0;
  let updated = 0;

  const entries = [
    ...NATIONAL.map((item) => ({ ...item, type: 'NATIONAL', optional: false })),
    ...COMPANY,
  ];

  for (const data of entries) {
    const existing = await Holiday.findOne({ name: data.name, date: data.date });
    if (existing) {
      Object.assign(existing, data);
      await existing.save();
      updated += 1;
      continue;
    }
    await Holiday.create(data);
    created += 1;
  }

  return { created, updated, total: entries.length };
};

export default seedHolidays;