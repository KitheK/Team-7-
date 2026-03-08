import React from 'react';
import { View, StyleSheet } from 'react-native';
import theme from '../../constants/theme';
import Typography from './ui/Typography';

type Variant = 'active' | 'priceAlert' | 'cancelled' | 'critical' | 'warning' | 'resolved' | 'pending' | 'inProgress';

const variantStyles: Record<Variant, { bg: string; text: string }> = {
  active: { bg: withAlpha(theme.colors.success, 0.14), text: theme.colors.success },
  priceAlert: { bg: withAlpha(theme.colors.warning, 0.16), text: theme.colors.warning },
  cancelled: { bg: withAlpha(theme.colors.error, 0.14), text: theme.colors.error },
  critical: { bg: withAlpha(theme.colors.error, 0.14), text: theme.colors.error },
  warning: { bg: withAlpha(theme.colors.warning, 0.16), text: theme.colors.warning },
  resolved: { bg: withAlpha(theme.colors.success, 0.14), text: theme.colors.success },
  pending: { bg: withAlpha(theme.colors.warning, 0.16), text: theme.colors.warning },
  inProgress: { bg: withAlpha(theme.colors.accentBlue, 0.18), text: theme.colors.accentBlue },
};

type Props = {
  label: string;
  variant: Variant;
};

export default function StatusPill({ label, variant }: Props) {
  const s = variantStyles[variant] ?? variantStyles.active;
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Typography variant="label" style={[styles.text, { color: s.text }]}>
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: theme.typography.weights.semibold,
  },
});

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const bigint = Number.parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
