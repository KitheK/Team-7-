// Light, inviting theme — for small businesses (e.g. local shops, restaurants).
export const Colors = {
  background: '#f8fafc',
  card: '#ffffff',
  cardBorder: '#e2e8f0',
  sidebar: '#ffffff',
  sidebarHover: '#f1f5f9',
  sidebarText: '#64748b',
  sidebarActive: '#0f172a',
  sidebarActiveBg: '#f1f5f9',
  primary: '#1e40af',
  primaryMuted: '#2563eb',
  primaryLight: 'rgba(30, 64, 175, 0.08)',
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  border: '#e2e8f0',
  inputBg: '#f8fafc',
  white: '#ffffff',
  success: '#16a34a',
  successLight: 'rgba(22, 163, 74, 0.08)',
  danger: '#dc2626',
  dangerLight: 'rgba(220, 38, 38, 0.08)',
  warning: '#ca8a04',
  info: '#2563eb',
  chart: [
    '#2563eb',
    '#16a34a',
    '#ca8a04',
    '#dc2626',
    '#7c3aed',
    '#0891b2',
    '#ea580c',
    '#db2777',
    '#0d9488',
    '#4f46e5',
  ],
  kpi: {
    savings: '#16a34a',
    spending: '#2563eb',
    subscriptions: '#7c3aed',
    roi: '#ca8a04',
  },
};

export type ColorScheme = typeof Colors;

export function getColors(_isDark?: boolean): ColorScheme {
  return Colors;
}
