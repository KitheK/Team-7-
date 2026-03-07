// Single source of truth for fonts across the app and all graphs (demo-consistent).

const fontFamily = 'System'; // React Native default; on web this becomes system UI font
// Sans-serif stack for SVG chart text so it matches the app (no weird serif fallback).
export const chartFontFamily = 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const Typography = {
  fontFamily,

  // App / pages
  pageTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  pageSubtitle: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
  label: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  value: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  valueSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
  },

  // Charts (SVG and legend) – same sizes everywhere
  chart: {
    axisLabel: 12,   // X/Y category labels (e.g. "Jan", "Feb")
    axisValue: 11,   // Y-axis numbers (e.g. "10k", "20k")
    legend: 12,      // Legend text
    centerPrimary: 18,   // Donut center main value
    centerSecondary: 11, // Donut center subtitle
  },
};
