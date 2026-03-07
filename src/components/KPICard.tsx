import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

type Props = {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: keyof typeof Feather.glyphMap;
  color: string;
};

export default function KPICard({ title, value, change, positive, icon, color }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Feather name={icon} size={20} color={color} />
        </View>
        <View style={[styles.changeTag, positive ? styles.changePositive : styles.changeNegative]}>
          <Feather
            name={positive ? 'arrow-up-right' : 'arrow-down-right'}
            size={12}
            color={positive ? Colors.success : Colors.danger}
          />
          <Text style={[styles.changeText, { color: positive ? Colors.success : Colors.danger }]}>
            {change}
          </Text>
        </View>
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  changePositive: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  changeNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  changeText: {
    fontSize: Typography.label.fontSize,
    fontWeight: '600',
    marginLeft: 2,
  },
  value: {
    fontSize: Typography.value.fontSize,
    fontWeight: Typography.value.fontWeight,
    color: Colors.text,
    marginBottom: 4,
  },
  title: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
