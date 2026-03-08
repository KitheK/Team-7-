function rgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const int = Number.parseInt(normalized, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const light = {
  background: '#EDEBE8',
  card: '#FFFFFF',
  cardBorder: '#E6E1DC',
  sidebar: '#FFFFFF',
  sidebarHover: '#F4F1ED',
  sidebarText: '#625C58',
  sidebarActive: '#3D3D3D',
  sidebarActiveBg: '#F8D6CB',
  primary: '#E77449',
  primaryMuted: '#D9663C',
  primaryLight: rgba('#E77449', 0.14),
  text: '#3D3D3D',
  textSecondary: '#625C58',
  textTertiary: '#9B948E',
  border: '#E6E1DC',
  inputBg: '#EDEBE8',
  white: '#FFFFFF',
  success: '#3F964B',
  successLight: rgba('#3F964B', 0.14),
  danger: '#D06B4D',
  dangerLight: rgba('#D06B4D', 0.14),
  warning: '#C79844',
  warningLight: rgba('#C79844', 0.14),
  info: '#E77449',
  chart: [
    '#E77449', '#3F964B', '#C79844', '#D06B4D', '#A65A33',
    '#6FB276', '#F0B17C', '#8B755F', '#A8A09A', '#E6A26D',
  ],
};

const dark = {
  background: '#252321',
  card: '#F4F1ED',
  cardBorder: '#4B4641',
  sidebar: '#F4F1ED',
  sidebarHover: '#EDE7E1',
  sidebarText: '#6C655F',
  sidebarActive: '#3D3D3D',
  sidebarActiveBg: '#F8D6CB',
  primary: '#E77449',
  primaryMuted: '#D9663C',
  primaryLight: rgba('#E77449', 0.16),
  text: '#FFFFFF',
  textSecondary: '#E3DCD6',
  textTertiary: '#C2B8AE',
  border: '#4B4641',
  inputBg: '#EDE7E1',
  white: '#FFFFFF',
  success: '#3F964B',
  successLight: rgba('#3F964B', 0.16),
  danger: '#D06B4D',
  dangerLight: rgba('#D06B4D', 0.16),
  warning: '#C79844',
  warningLight: rgba('#C79844', 0.16),
  info: '#E77449',
  chart: [
    '#E77449', '#3F964B', '#C79844', '#D06B4D', '#A65A33',
    '#6FB276', '#F0B17C', '#8B755F', '#A8A09A', '#E6A26D',
  ],
};

export type ColorScheme = typeof dark;
export { light as LightColors, dark as DarkColors };

export function getColors(isDark: boolean): ColorScheme {
  return isDark ? dark : light;
}
