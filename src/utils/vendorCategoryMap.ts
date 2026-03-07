/**
 * Maps vendor names (partial match, case-insensitive) to spend category.
 * Used to derive Spend Categories from transaction data.
 */

const CATEGORY_RULES: { pattern: RegExp | string; category: string }[] = [
  { pattern: /aws|google cloud|azure|digitalocean|cloudflare/i, category: 'Cloud & Infrastructure' },
  { pattern: /salesforce|hubspot|pipedrive|zoho crm/i, category: 'CRM & Sales' },
  { pattern: /slack|zoom|teams|discord|twilio|vonage/i, category: 'Communications' },
  { pattern: /adobe|figma|canva|sketch|invision/i, category: 'Design & Creative' },
  { pattern: /zendesk|intercom|freshdesk|help scout/i, category: 'Customer Support' },
  { pattern: /github|gitlab|bitbucket|atlassian|jira/i, category: 'Dev & Engineering' },
  { pattern: /notion|confluence|asana|monday|trello|basecamp/i, category: 'Productivity' },
  { pattern: /stripe|paypal|quickbooks|xero/i, category: 'Finance & Payments' },
  { pattern: /mailchimp|sendgrid|segment|amplitude|mixpanel/i, category: 'Marketing & Analytics' },
];

export function getCategoryForVendor(vendorName: string | null): string {
  if (!vendorName || !vendorName.trim()) return 'Other';
  const v = vendorName.toLowerCase().trim();
  for (const { pattern, category } of CATEGORY_RULES) {
    if (typeof pattern === 'string' ? v.includes(pattern.toLowerCase()) : pattern.test(v)) {
      return category;
    }
  }
  return 'Other';
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Cloud & Infrastructure': '#3b82f6',
  'CRM & Sales': '#22c55e',
  'Communications': '#a855f7',
  'Design & Creative': '#ec4899',
  'Customer Support': '#06b6d4',
  'Dev & Engineering': '#f59e0b',
  'Productivity': '#8b5cf6',
  'Finance & Payments': '#10b981',
  'Marketing & Analytics': '#f97316',
  'Other': '#64748b',
};
