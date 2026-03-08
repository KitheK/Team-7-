const light = {
  background: '#fafaf8',
  card: '#ffffff',
  cardBorder: '#e5e2dc',
  sidebar: '#ffffff',
  sidebarHover: '#f3f1ed',
  sidebarText: '#6b7264',
  sidebarActive: '#1a2e1a',
  sidebarActiveBg: '#eef3ec',
  primary: '#2d6a4f',
  primaryMuted: '#40916c',
  primaryLight: 'rgba(45, 106, 79, 0.08)',
  text: '#1a1d17',
  textSecondary: '#52584d',
  textTertiary: '#9ca396',
  border: '#e3e0da',
  inputBg: '#f7f6f3',
  white: '#ffffff',
  success: '#2d6a4f',
  successLight: 'rgba(45, 106, 79, 0.08)',
  danger: '#c0392b',
  dangerLight: 'rgba(192, 57, 43, 0.08)',
  warning: '#b8860b',
  warningLight: 'rgba(184, 134, 11, 0.08)',
  info: '#2d6a4f',
  chart: [
    '#2d6a4f', '#40916c', '#b8860b', '#c0392b', '#1b4332',
    '#52b788', '#d4a574', '#8b5e3c', '#74c69d', '#2d6a4f',
  ],
};

const dark = {
  background: '#0f1510',
  card: '#171e18',
  cardBorder: '#253027',
  sidebar: '#131a14',
  sidebarHover: '#1c251d',
  sidebarText: '#7e8c78',
  sidebarActive: '#d4e7d0',
  sidebarActiveBg: '#1e2e1f',
  primary: '#52b788',
  primaryMuted: '#74c69d',
  primaryLight: 'rgba(82, 183, 136, 0.12)',
  text: '#e3ede0',
  textSecondary: '#9bab95',
  textTertiary: '#5e6e58',
  border: '#253027',
  inputBg: '#171e18',
  white: '#171e18',
  success: '#52b788',
  successLight: 'rgba(82, 183, 136, 0.12)',
  danger: '#e74c3c',
  dangerLight: 'rgba(231, 76, 60, 0.12)',
  warning: '#d4a017',
  warningLight: 'rgba(212, 160, 23, 0.12)',
  info: '#52b788',
  chart: [
    '#52b788', '#74c69d', '#d4a017', '#e74c3c', '#40916c',
    '#95d5b2', '#d4a574', '#c49a6c', '#b7e4c7', '#52b788',
  ],
};

export type ColorScheme = typeof dark;
export { light as LightColors, dark as DarkColors };

export function getColors(isDark: boolean): ColorScheme {
  return isDark ? dark : light;
}
