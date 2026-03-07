import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography } from '../constants/typography';

type Variant = 'active' | 'priceAlert' | 'cancelled' | 'critical' | 'warning' | 'resolved' | 'pending' | 'inProgress';

const variantStyles: Record<Variant, { bg: string; text: string }> = {
  active: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
  priceAlert: { bg: 'rgba(245, 158, 11, 0.15)', text: '#eab308' },
  cancelled: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
  critical: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
  warning: { bg: 'rgba(245, 158, 11, 0.15)', text: '#eab308' },
  resolved: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
  pending: { bg: 'rgba(245, 158, 11, 0.15)', text: '#eab308' },
  inProgress: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
};

type Props = {
  label: string;
  variant: Variant;
};

export default function StatusPill({ label, variant }: Props) {
  const s = variantStyles[variant] ?? variantStyles.active;
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: Typography.chart.legend,
    fontWeight: '600',
  },
});
