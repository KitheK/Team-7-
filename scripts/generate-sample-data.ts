import * as fs from 'fs';
import * as path from 'path';

const OUT_DIR = path.resolve(__dirname, '../sample-data');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const YEAR = 2025;

// Vendor name variants for normalization testing
const AWS_NAMES = ['Amazon Web Services', 'AWS', 'AMZN Web Services', 'AWS Cloud Services', 'Amazon Web Services Inc'];
const SF_NAMES = ['Salesforce', 'Salesforce.com', 'Salesforce CRM', 'SALESFORCE'];
const TWILIO_NAMES = ['Twilio', 'Twilio Inc', 'TWILIO COMMUNICATIONS'];
const ZOOM_NAMES = ['Zoom Video Communications', 'ZOOM.US', 'Zoom'];

function pick<T>(arr: T[], month: number): T {
  return arr[month % arr.length]!;
}

function date(month: number, day: number): string {
  return `${YEAR}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function jitter(base: number, pct: number = 0.03): number {
  const factor = 1 + (Math.random() * 2 - 1) * pct;
  return Math.round(base * factor * 100) / 100;
}

interface Row {
  vendor_name: string;
  amount: number;
  transaction_date: string;
  description: string;
}

function generateMonth(month: number): Row[] {
  const rows: Row[] = [];

  // ── High-spend recurring (AI negotiation candidates) ──

  // AWS: $3,800 → $4,500 with steady creep
  const awsBase = 3800 + month * 63;
  rows.push({
    vendor_name: pick(AWS_NAMES, month),
    amount: jitter(awsBase),
    transaction_date: date(month, 1),
    description: 'Cloud infrastructure & compute',
  });
  // AWS sometimes has a second line item for data transfer
  if (month >= 3) {
    rows.push({
      vendor_name: pick(AWS_NAMES, month),
      amount: jitter(280 + month * 15),
      transaction_date: date(month, 1),
      description: 'Data transfer & bandwidth',
    });
  }

  // Salesforce: $1,400 → $1,650
  rows.push({
    vendor_name: pick(SF_NAMES, month),
    amount: jitter(1400 + month * 23),
    transaction_date: date(month, 3),
    description: 'CRM platform - Enterprise licenses',
  });

  // Twilio: $1,100 → $1,350 with creep
  rows.push({
    vendor_name: pick(TWILIO_NAMES, month),
    amount: jitter(1100 + month * 23),
    transaction_date: date(month, 5),
    description: 'Voice & SMS API usage',
  });

  // HubSpot: $750 → $850
  rows.push({
    vendor_name: 'HubSpot',
    amount: jitter(750 + month * 9),
    transaction_date: date(month, 2),
    description: 'Marketing Hub Professional',
  });

  // Datadog: $500 → $620
  rows.push({
    vendor_name: month % 3 === 0 ? 'Datadog Inc' : 'Datadog',
    amount: jitter(500 + month * 11),
    transaction_date: date(month, 4),
    description: 'Infrastructure monitoring',
  });

  // Zendesk: $350 steady (Customer Support — negotiable category)
  rows.push({
    vendor_name: 'Zendesk',
    amount: jitter(350 + month * 5),
    transaction_date: date(month, 6),
    description: 'Customer support platform',
  });

  // ── Recurring subscriptions (email cancellation candidates) ──

  rows.push({
    vendor_name: 'Slack Technologies',
    amount: jitter(200),
    transaction_date: date(month, 1),
    description: 'Business+ plan',
  });
  // Slack duplicate charge in months 4 and 8
  if (month === 3 || month === 7) {
    rows.push({
      vendor_name: 'Slack Technologies',
      amount: jitter(200),
      transaction_date: date(month, 15),
      description: 'Business+ plan - duplicate charge',
    });
  }

  rows.push({
    vendor_name: pick(ZOOM_NAMES, month),
    amount: jitter(149),
    transaction_date: date(month, 1),
    description: 'Business plan - 50 hosts',
  });

  rows.push({
    vendor_name: 'Figma',
    amount: jitter(90),
    transaction_date: date(month, 7),
    description: 'Organization plan',
  });

  rows.push({
    vendor_name: month % 2 === 0 ? 'GitHub' : 'GitHub Inc',
    amount: jitter(150),
    transaction_date: date(month, 10),
    description: 'Team plan - 25 seats',
  });
  // GitHub duplicate in month 6
  if (month === 5) {
    rows.push({
      vendor_name: 'GitHub',
      amount: jitter(150),
      transaction_date: date(month, 12),
      description: 'Team plan - duplicate billing',
    });
  }

  rows.push({
    vendor_name: 'Notion Labs',
    amount: jitter(80),
    transaction_date: date(month, 8),
    description: 'Team plan',
  });

  rows.push({
    vendor_name: 'Adobe Creative Cloud',
    amount: jitter(300),
    transaction_date: date(month, 12),
    description: 'All Apps plan - 10 licenses',
  });

  rows.push({
    vendor_name: 'Asana',
    amount: jitter(120),
    transaction_date: date(month, 9),
    description: 'Business tier',
  });

  rows.push({
    vendor_name: 'Mailchimp',
    amount: jitter(99),
    transaction_date: date(month, 5),
    description: 'Standard plan - email marketing',
  });

  // Intercom: appears months 3-11 (mid-year addition → shows as newer recurring)
  if (month >= 2 && month <= 10) {
    rows.push({
      vendor_name: 'Intercom',
      amount: jitter(189),
      transaction_date: date(month, 11),
      description: 'Support & engagement platform',
    });
  }

  // ── Sporadic vendors (manual review / one-off) ──

  // Office supplies: random months
  if ([0, 2, 5, 9].includes(month)) {
    rows.push({
      vendor_name: 'Staples Business',
      amount: jitter(340 + Math.random() * 200),
      transaction_date: date(month, 18),
      description: 'Office supplies & equipment',
    });
  }

  // Annual conference: one month only
  if (month === 4) {
    rows.push({
      vendor_name: 'SaaStr Annual Conference',
      amount: 4500,
      transaction_date: date(month, 20),
      description: 'Conference tickets - 3 attendees',
    });
  }

  // Consulting: appears 2 months
  if (month === 1 || month === 2) {
    rows.push({
      vendor_name: 'McKinsey Digital',
      amount: jitter(12500),
      transaction_date: date(month, 15),
      description: 'Strategy consulting engagement',
    });
  }

  // One-off software purchase
  if (month === 7) {
    rows.push({
      vendor_name: 'JetBrains',
      amount: 649,
      transaction_date: date(month, 22),
      description: 'IntelliJ IDEA Ultimate - annual',
    });
  }

  // WeWork coworking: sporadic
  if ([0, 1, 2, 3].includes(month)) {
    rows.push({
      vendor_name: 'WeWork',
      amount: jitter(950),
      transaction_date: date(month, 1),
      description: 'Hot desk membership',
    });
  }

  // Stripe: appears as a payment processor charge most months
  if (month >= 1) {
    rows.push({
      vendor_name: 'Stripe',
      amount: jitter(45 + month * 8),
      transaction_date: date(month, 28 > 28 ? 28 : Math.min(28, 15 + month)),
      description: 'Payment processing fees',
    });
  }

  // DigitalOcean: small cloud usage, intermittent
  if ([1, 3, 5, 7, 9, 11].includes(month)) {
    rows.push({
      vendor_name: 'DigitalOcean',
      amount: jitter(85),
      transaction_date: date(month, 20),
      description: 'Droplet hosting',
    });
  }

  // Cloudflare: small but recurring
  rows.push({
    vendor_name: 'Cloudflare',
    amount: jitter(65),
    transaction_date: date(month, 3),
    description: 'Pro plan + Workers',
  });

  // Amplitude: analytics, starts month 4
  if (month >= 3) {
    rows.push({
      vendor_name: 'Amplitude',
      amount: jitter(420 + (month - 3) * 12),
      transaction_date: date(month, 14),
      description: 'Growth plan - product analytics',
    });
  }

  return rows;
}

function toCsv(rows: Row[]): string {
  const header = 'vendor_name,amount,transaction_date,description';
  const lines = rows.map(r => {
    const escape = (s: string) => s.includes(',') ? `"${s}"` : s;
    return `${escape(r.vendor_name)},${r.amount},${r.transaction_date},${escape(r.description)}`;
  });
  return [header, ...lines].join('\n');
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (let m = 0; m < 12; m++) {
  const rows = generateMonth(m);
  const csv = toCsv(rows);
  const fileName = `${YEAR}-${String(m + 1).padStart(2, '0')}-${MONTHS[m]!.toLowerCase()}.csv`;
  fs.writeFileSync(path.join(OUT_DIR, fileName), csv);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  console.log(`${MONTHS[m]!.padEnd(10)} ${rows.length} rows  $${Math.round(total).toLocaleString()}`);
}

console.log('\nDone! Files written to sample-data/');
