// Single source of dummy data for the demo. Same vendors, numbers, and categories
// are used across all pages so the story is consistent (e.g. 47 subscriptions,
// Salesforce, AWS, Zendesk, $88.6K spend).

export const CATEGORIES = ['CRM', 'Cloud Services', 'Design Tools', 'Communications', 'Marketing', 'Customer Support'] as const;

// --- Subscriptions (Subscription Manager) ---
export const subscriptionsSummary = {
  active: 47,
  priceAlerts: 8,
  recentlyCancelled: 12,
};

export const subscriptionsTable = [
  { id: '1', service: 'Salesforce', initial: 'S', category: 'CRM', cost: 8400, priceChange: 12, nextBilling: 'Mar 31', status: 'Active' },
  { id: '2', service: 'AWS', initial: 'A', category: 'Cloud Services', cost: 6200, priceChange: 8, nextBilling: 'Apr 4', status: 'Price Alert' },
  { id: '3', service: 'Adobe Creative Cloud', initial: 'A', category: 'Design Tools', cost: 3200, priceChange: 0, nextBilling: 'Mar 31', status: 'Active' },
  { id: '4', service: 'Slack', initial: 'S', category: 'Communications', cost: 2800, priceChange: 0, nextBilling: 'Mar 31', status: 'Active' },
  { id: '5', service: 'HubSpot', initial: 'H', category: 'Marketing', cost: 4500, priceChange: -15, nextBilling: 'Mar 27', status: 'Price Alert' },
  { id: '6', service: 'Zoom', initial: 'Z', category: 'Communications', cost: 1200, priceChange: 9, nextBilling: 'Mar 15', status: 'Active' },
  { id: '7', service: 'Zendesk', initial: 'Z', category: 'Customer Support', cost: 840, priceChange: 0, nextBilling: 'Apr 1', status: 'Active' },
];

// --- Price Creep Detection ---
export const priceCreepMonthly = [
  { month: 'Oct', amount: 450, count: 2 },
  { month: 'Nov', amount: 780, count: 3 },
  { month: 'Dec', amount: 320, count: 1 },
  { month: 'Jan', amount: 1200, count: 4 },
  { month: 'Feb', amount: 950, count: 3 },
  { month: 'Mar', amount: 1500, count: 5 },
];

export const priceChangesTable = [
  { vendor: 'HubSpot Marketing', category: 'Marketing', oldPrice: 3900, newPrice: 4500, detected: 'Feb 27', status: 'Critical', action: 'Negotiating' },
  { vendor: 'AWS', category: 'Cloud Services', oldPrice: 5700, newPrice: 6200, detected: 'Feb 28', status: 'Warning', action: 'Under Review' },
  { vendor: 'Salesforce', category: 'CRM', oldPrice: 7500, newPrice: 8400, detected: 'Mar 4', status: 'Critical', action: 'AI Call Scheduled' },
  { vendor: 'Zoom', category: 'Communications', oldPrice: 1100, newPrice: 1200, detected: 'Feb 19', status: 'Resolved', action: 'Grandfathered' },
  { vendor: 'Adobe Creative Cloud', category: 'Design Tools', oldPrice: 3000, newPrice: 3200, detected: 'Mar 1', status: 'Warning', action: 'Monitoring' },
];

// --- Spend Categories ---
export const spendCategoriesSummary = {
  totalMonthlySpend: 88600,
  categoriesCount: 12,
  fastestGrowing: 'CRM & Sales',
  fastestGrowingPct: 12,
  topCategory: 'Cloud Services',
  topCategoryPct: 32,
  vsLastMonth: 7,
};

export const spendDistribution = [
  { name: 'Cloud Services', value: 28352, color: '#3b82f6' },
  { name: 'CRM & Sales', value: 22150, color: '#22c55e' },
  { name: 'Marketing Tools', value: 15948, color: '#f59e0b' },
  { name: 'Communications', value: 12404, color: '#a855f7' },
  { name: 'Design Tools', value: 9746, color: '#ec4899' },
];

export const categoryBreakdown = [
  { name: 'Cloud Services', pctChange: 8, amount: 28400 },
  { name: 'CRM & Sales', pctChange: 12, amount: 22100 },
  { name: 'Marketing Tools', pctChange: 5, amount: 15800 },
  { name: 'Communications', pctChange: -3, amount: 12600 },
  { name: 'Design Tools', pctChange: 0, amount: 9700 },
];

// --- Vendor Analytics ---
export const vendorAnalyticsKpis = {
  activeVendors: 47,
  activeVendorsChange: 3,
  totalMonthlySpend: 47200,
  spendChange: 9,
  avgUtilization: 83,
  utilizationChange: 5,
  renewalsDue: 12,
};

export const topVendorsSpendTrend = {
  labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
  values: [5200, 6800, 7200, 8800, 9200, 10200],
};

// --- Vendor Negotiations ---
export const negotiationsKpis = {
  active: 2,
  totalSaved: 1100,
  successRate: 87,
  avgDuration: 8.4,
};

export const negotiationActivity = [
  { month: 'Oct', started: 8, done: 5, won: 4 },
  { month: 'Nov', started: 10, done: 7, won: 5 },
  { month: 'Dec', started: 6, done: 4, won: 3 },
  { month: 'Jan', started: 12, done: 9, won: 7 },
  { month: 'Feb', started: 11, done: 8, won: 6 },
  { month: 'Mar', started: 15, done: 4, won: 3 },
];

export const activeNegotiations = [
  { vendor: 'AWS', category: 'Cloud Services', status: 'In Progress', currentCost: 12400, targetCost: 10200, potentialSavings: 2200, confidence: 92, stage: 'Price Discussion', strategy: 'Volume discount based on usage patterns', lastUpdated: 'Mar 6, 2026', nextCall: 'Mar 9' },
  { vendor: 'Salesforce', category: 'CRM', status: 'Pending', currentCost: 14200, targetCost: 11800, potentialSavings: 2400, confidence: 88, stage: 'Initial Contact', strategy: 'Contract renewal leverage + competitive pricing', lastUpdated: 'Mar 5, 2026', nextCall: 'Mar 8' },
];

// --- Automated Cancellation ---
export const cancellationKpis = {
  potentialSavings: 10600,
  readyToCancel: 2,
  inactiveUsers: 45,
  savedThisMonth: 2900,
};

export const cancellationQueue = [
  { vendor: 'Zendesk', category: 'Customer Support', unusedLicenses: 12, totalLicenses: 45, monthlyCost: 840, daysInactive: 92, lastActivity: 'Dec 4, 2025', annualSavings: 3360, confidence: 98, status: 'Ready' },
  { vendor: 'Slack', category: 'Communications', unusedLicenses: 8, totalLicenses: 32, monthlyCost: 640, daysInactive: 78, lastActivity: 'Dec 20, 2025', annualSavings: 2560, confidence: 91, status: 'Ready' },
];

// --- AI Recommendations ---
export const aiRecommendationsKpis = {
  activeRecommendations: 6,
  totalOpportunity: 9100,
  quickWins: 3,
  avgConfidence: 94,
};

export const quickWins = [
  { title: 'Optimize AWS Reserved Instances', description: 'Usage patterns suggest 40% of workloads can move to reserved capacity.', savings: 2680 },
  { title: 'Salesforce License Right-Sizing', description: 'Downgrade 12 unused Sales Cloud licenses to Essentials.', savings: 1800 },
  { title: 'Negotiate HubSpot Annual Commit', description: 'Switch to annual billing to secure 18% discount.', savings: 1360 },
];

export const allRecommendations = [
  { title: 'Consolidate Zoom & Slack', category: 'Communications', priority: 'High', savings: 920 },
  { title: 'Adobe Team License Audit', category: 'Design Tools', priority: 'Medium', savings: 540 },
  { title: 'Zendesk Unused Seat Recovery', category: 'Customer Support', priority: 'High', savings: 3360 },
];
