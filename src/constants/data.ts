export const kpiData = [
  {
    title: 'Monthly Savings',
    value: '$31,542',
    change: '+12.5%',
    positive: true,
    icon: 'trending-up' as const,
    color: '#10B981',
  },
  {
    title: 'Total Spending',
    value: '$36,458',
    change: '-8.3%',
    positive: true,
    icon: 'credit-card' as const,
    color: '#3B82F6',
  },
  {
    title: 'Active Subscriptions',
    value: '47',
    change: '-3',
    positive: true,
    icon: 'layers' as const,
    color: '#8B5CF6',
  },
  {
    title: 'ROI',
    value: '284%',
    change: '+24%',
    positive: true,
    icon: 'award' as const,
    color: '#F59E0B',
  },
];

export const spendingSavingsData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  spending: [43000, 42000, 40000, 38000, 35000, 32000],
  savings: [10000, 13000, 15000, 18000, 25000, 30000],
};

export const cumulativeSavingsData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  values: [10000, 23000, 38000, 56000, 81000, 111000],
};

export const spendingByCategoryData = [
  { name: 'SaaS Tools', value: 12400, color: '#6366F1' },
  { name: 'Cloud Infra', value: 8900, color: '#3B82F6' },
  { name: 'Marketing', value: 6200, color: '#F59E0B' },
  { name: 'HR & Payroll', value: 4800, color: '#10B981' },
  { name: 'Office', value: 2600, color: '#F43F5E' },
  { name: 'Other', value: 1558, color: '#8B5CF6' },
];
