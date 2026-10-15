const INDIAN_HOLIDAYS = {
  '2026-01-26': 'Republic Day',
  '2026-02-21': 'Maha Shivratri',
  '2026-03-04': 'Holi',
  '2026-03-20': 'Eid-ul-Fitr',
  '2026-04-03': 'Good Friday',
  '2026-04-14': 'Dr. Ambedkar Jayanti',
  '2026-05-01': 'Maharashtra Day',
  '2026-05-27': 'Eid-ul-Adha',
  '2026-08-15': 'Independence Day',
  '2026-10-02': 'Gandhi Jayanti',
  '2026-10-20': 'Dussehra',
  '2026-11-08': 'Diwali',
  '2026-12-25': 'Christmas',
  '2027-01-26': 'Republic Day',
  '2027-03-24': 'Holi',
  '2027-08-15': 'Independence Day',
  '2027-10-02': 'Gandhi Jayanti',
  '2027-11-07': 'Diwali',
  '2027-12-25': 'Christmas',
};

export const getHolidayTitle = (isoDate) => INDIAN_HOLIDAYS[isoDate] || null;

export const getHolidaysForYear = (year) => {
  const entries = Object.entries(INDIAN_HOLIDAYS)
    .filter(([date]) => date.startsWith(`${year}-`))
    .map(([date, title]) => ({ date, title }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  return { year, count: entries.length, holidays: entries };
};

export const isHoliday = (isoDate) => Boolean(INDIAN_HOLIDAYS[isoDate]);