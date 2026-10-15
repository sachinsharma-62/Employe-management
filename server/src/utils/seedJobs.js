import Job from '../models/Job.js';
import Candidate from '../models/Candidate.js';
import User from '../models/User.js';

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (days) => new Date(Date.now() + days * DAY);
const daysAgo = (days) => new Date(Date.now() - days * DAY);

// Recruiting placeholders so the global search has real data to surface. Jobs
// are keyed by title and candidates by email, making the seed idempotent.
const JOB_SEEDS = [
  {
    title: 'Senior React Engineer',
    department: 'Engineering',
    location: 'Indore (On-site)',
    jobType: 'FULL_TIME',
    openings: 2,
    status: 'OPEN',
    minExperience: 4,
    maxExperience: 8,
    salaryRange: '₹18L – ₹28L',
    skills: ['React', 'TypeScript', 'Node.js', 'REST'],
    closesOnDays: 30,
    description: 'Own the front-end architecture for our HR platform and mentor the team.',
    requirements: 'Strong React + TypeScript, state management, testing and performance tuning.',
  },
  {
    title: 'Backend Engineer (Node.js)',
    department: 'Engineering',
    location: 'Indore (Hybrid)',
    jobType: 'FULL_TIME',
    openings: 1,
    status: 'INTERVIEWING',
    minExperience: 3,
    maxExperience: 6,
    salaryRange: '₹14L – ₹22L',
    skills: ['Node.js', 'MongoDB', 'Express', 'AWS'],
    closesOnDays: 21,
    description: 'Design APIs and services powering attendance, leave and payroll.',
    requirements: 'Solid Node.js, MongoDB schema design, REST API and cloud deployment experience.',
  },
  {
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote',
    jobType: 'REMOTE',
    openings: 1,
    status: 'OPEN',
    minExperience: 3,
    maxExperience: 6,
    salaryRange: '₹12L – ₹20L',
    skills: ['Figma', 'Design Systems', 'Prototyping', 'UX'],
    closesOnDays: 40,
    description: 'Craft intuitive workflows for the employee and HR experience.',
    requirements: 'Portfolio with complex dashboards, strong systems thinking and prototyping.',
  },
  {
    title: 'HR Executive',
    department: 'Human Resources',
    location: 'Indore (On-site)',
    jobType: 'FULL_TIME',
    openings: 1,
    status: 'OPEN',
    minExperience: 1,
    maxExperience: 3,
    salaryRange: '₹5L – ₹8L',
    skills: ['Recruitment', 'Onboarding', 'HRMS'],
    closesOnDays: 25,
    description: 'Support hiring, onboarding and employee engagement initiatives.',
    requirements: '1–3 years in HR operations with strong communication skills.',
  },
  {
    title: 'Sales Manager',
    department: 'Sales',
    location: 'Mumbai (On-site)',
    jobType: 'FULL_TIME',
    openings: 1,
    status: 'ON_HOLD',
    minExperience: 6,
    maxExperience: 10,
    salaryRange: '₹16L – ₹24L',
    skills: ['B2B Sales', 'Negotiation', 'CRM'],
    closesOnDays: 45,
    description: 'Lead the enterprise sales motion for the western region.',
    requirements: 'Track record of closing enterprise SaaS deals and building teams.',
  },
  {
    title: 'Digital Marketing Specialist',
    department: 'Marketing',
    location: 'Remote',
    jobType: 'PART_TIME',
    openings: 1,
    status: 'OPEN',
    minExperience: 2,
    maxExperience: 5,
    salaryRange: '₹6L – ₹10L',
    skills: ['SEO', 'Google Ads', 'Content'],
    closesOnDays: 35,
    description: 'Run campaigns and grow organic reach across channels.',
    requirements: 'Hands-on SEO, paid ads and content marketing experience.',
  },
  {
    title: 'Finance Analyst',
    department: 'Finance',
    location: 'Indore (On-site)',
    jobType: 'FULL_TIME',
    openings: 1,
    status: 'CLOSED',
    minExperience: 2,
    maxExperience: 5,
    salaryRange: '₹8L – ₹12L',
    skills: ['Excel', 'Forecasting', 'Reporting'],
    closesOnDays: -5,
    description: 'Own budgeting, forecasting and monthly financial reporting.',
    requirements: 'Advanced Excel, financial modelling and reporting.',
  },
  {
    title: 'Customer Success Associate',
    department: 'Customer Success',
    location: 'Pune (On-site)',
    jobType: 'FULL_TIME',
    openings: 2,
    status: 'OPEN',
    minExperience: 1,
    maxExperience: 4,
    salaryRange: '₹5L – ₹9L',
    skills: ['Communication', 'CRM', 'Support'],
    closesOnDays: 28,
    description: 'Help customers onboard and get value from the product.',
    requirements: 'Excellent communication and a customer-first mindset.',
  },
];

const CANDIDATE_SEEDS = [
  { firstName: 'Aarav', lastName: 'Sharma', email: 'aarav.sharma@example.com', phone: '+91 98200 10001', jobTitle: 'Senior React Engineer', stage: 'INTERVIEW', source: 'LINKEDIN', appliedDaysAgo: 6 },
  { firstName: 'Diya', lastName: 'Patel', email: 'diya.patel@example.com', phone: '+91 98200 10002', jobTitle: 'Senior React Engineer', stage: 'HIRED', source: 'REFERRAL', appliedDaysAgo: 40 },
  { firstName: 'Ishaan', lastName: 'Verma', email: 'ishaan.verma@example.com', phone: '+91 98200 10003', jobTitle: 'Senior React Engineer', stage: 'SCREENED', source: 'JOB_PORTAL', appliedDaysAgo: 3 },
  { firstName: 'Meera', lastName: 'Iyer', email: 'meera.iyer@example.com', phone: '+91 98200 10004', jobTitle: 'Backend Engineer (Node.js)', stage: 'INTERVIEW', source: 'COMPANY_SITE', appliedDaysAgo: 9 },
  { firstName: 'Kabir', lastName: 'Singh', email: 'kabir.singh@example.com', phone: '+91 98200 10005', jobTitle: 'Backend Engineer (Node.js)', stage: 'APPLIED', source: 'LINKEDIN', appliedDaysAgo: 2 },
  { firstName: 'Ananya', lastName: 'Nair', email: 'ananya.nair@example.com', phone: '+91 98200 10006', jobTitle: 'Product Designer', stage: 'OFFER', source: 'LINKEDIN', appliedDaysAgo: 15 },
  { firstName: 'Rehan', lastName: 'Khan', email: 'rehan.khan@example.com', phone: '+91 98200 10007', jobTitle: 'Product Designer', stage: 'SCREENED', source: 'COMPANY_SITE', appliedDaysAgo: 5 },
  { firstName: 'Sneha', lastName: 'Joshi', email: 'sneha.joshi@example.com', phone: '+91 98200 10008', jobTitle: 'Product Designer', stage: 'APPLIED', source: 'REFERRAL', appliedDaysAgo: 1 },
  { firstName: 'Vikram', lastName: 'Rao', email: 'vikram.rao@example.com', phone: '+91 98200 10009', jobTitle: 'HR Executive', stage: 'OFFER', source: 'JOB_PORTAL', appliedDaysAgo: 12 },
  { firstName: 'Priya', lastName: 'Menon', email: 'priya.menon@example.com', phone: '+91 98200 10010', jobTitle: 'HR Executive', stage: 'APPLIED', source: 'REFERRAL', appliedDaysAgo: 2 },
  { firstName: 'Rohan', lastName: 'Gupta', email: 'rohan.gupta@example.com', phone: '+91 98200 10011', jobTitle: 'Sales Manager', stage: 'SCREENED', source: 'AGENCY', appliedDaysAgo: 20 },
  { firstName: 'Nisha', lastName: 'Reddy', email: 'nisha.reddy@example.com', phone: '+91 98200 10012', jobTitle: 'Sales Manager', stage: 'REJECTED', source: 'JOB_PORTAL', appliedDaysAgo: 30 },
  { firstName: 'Arjun', lastName: 'Mehta', email: 'arjun.mehta@example.com', phone: '+91 98200 10013', jobTitle: 'Digital Marketing Specialist', stage: 'INTERVIEW', source: 'LINKEDIN', appliedDaysAgo: 8 },
  { firstName: 'Tara', lastName: 'Kulkarni', email: 'tara.kulkarni@example.com', phone: '+91 98200 10014', jobTitle: 'Digital Marketing Specialist', stage: 'APPLIED', source: 'COMPANY_SITE', appliedDaysAgo: 4 },
  { firstName: 'Dev', lastName: 'Malhotra', email: 'dev.malhotra.candidate@example.com', phone: '+91 98200 10015', jobTitle: 'Customer Success Associate', stage: 'HIRED', source: 'REFERRAL', appliedDaysAgo: 45 },
  { firstName: 'Kavya', lastName: 'Pillai', email: 'kavya.pillai@example.com', phone: '+91 98200 10016', jobTitle: 'Customer Success Associate', stage: 'WITHDRAWN', source: 'COMPANY_SITE', appliedDaysAgo: 18 },
];

const seedJobs = async () => {
  const users = await User.find().sort({ employeeId: 1 });
  const admin = users.find((user) => user.email === 'hr@office.com') || users[0] || null;

  let jobsCreated = 0;
  let jobsUpdated = 0;
  const jobByTitle = new Map();

  for (const seed of JOB_SEEDS) {
    const { closesOnDays, ...rest } = seed;
    const payload = {
      ...rest,
      closesOn: closesOnDays != null ? daysFromNow(closesOnDays) : null,
      createdBy: admin ? admin._id : null,
      isActive: true,
    };
    const existing = await Job.findOne({ title: seed.title });
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      jobsUpdated += 1;
      jobByTitle.set(seed.title, existing);
      continue;
    }
    const job = await Job.create(payload);
    jobsCreated += 1;
    jobByTitle.set(seed.title, job);
  }

  let candidatesCreated = 0;
  let candidatesUpdated = 0;

  for (const seed of CANDIDATE_SEEDS) {
    const job = jobByTitle.get(seed.jobTitle) || null;
    const payload = {
      firstName: seed.firstName,
      lastName: seed.lastName,
      email: seed.email,
      phone: seed.phone,
      job: job ? job._id : null,
      stage: seed.stage,
      source: seed.source,
      appliedAt: daysAgo(seed.appliedDaysAgo),
      isActive: true,
    };
    const existing = await Candidate.findOne({ email: seed.email });
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      candidatesUpdated += 1;
      continue;
    }
    await Candidate.create(payload);
    candidatesCreated += 1;
  }

  return {
    jobs: { created: jobsCreated, updated: jobsUpdated, total: JOB_SEEDS.length },
    candidates: { created: candidatesCreated, updated: candidatesUpdated, total: CANDIDATE_SEEDS.length },
  };
};

export default seedJobs;