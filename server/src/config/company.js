const COMPANY = Object.freeze({
  name: process.env.COMPANY_NAME || 'Office EMS Pvt. Ltd.',
  address:
    process.env.COMPANY_ADDRESS ||
    '2nd Floor, Business Park, MG Road, Bengaluru, Karnataka 560001',
  email: process.env.COMPANY_EMAIL || 'hr@office-ems.com',
  phone: process.env.COMPANY_PHONE || '+91 80 4000 0000',
  website: process.env.COMPANY_WEBSITE || 'www.office-ems.com',
  gstin: process.env.COMPANY_GSTIN || '',
  cin: process.env.COMPANY_CIN || '',
});

export default COMPANY;
