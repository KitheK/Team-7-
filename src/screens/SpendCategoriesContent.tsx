import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';
import KPICard from '../components/KPICard';
import DonutChart from '../components/charts/DonutChart';
import {
  spendCategoriesSummary,
  spendDistribution,
  categoryBreakdown,
} from '../constants/dummyData';

const spendKpis = [
  {
    title: 'Total Monthly Spend',
    value: `$${(spendCategoriesSummary.totalMonthlySpend / 1000).toFixed(1)}K`,
    change: `+${spendCategoriesSummary.vsLastMonth}% vs last month`,
    positive: true,
    icon: 'dollar-sign' as const,
    color: '#22c55e',
  },
  {
    title: 'Categories',
    value: String(spendCategoriesSummary.categoriesCount),
    change: 'Active spending categories',
    positive: true,
    icon: 'pie-chart' as const,
    color: '#3b82f6',
  },
  {
    title: 'Fastest Growing',
    value: spendCategoriesSummary.fastestGrowing,
    change: `+${spendCategoriesSummary.fastestGrowingPct}% growth`,
    positive: true,
    icon: 'trending-up' as const,
    color: '#f59e0b',
  },
  {
    title: 'Top Category',
    value: spendCategoriesSummary.topCategory,
    change: `${spendCategoriesSummary.topCategoryPct}% of total spend`,
    positive: true,
    icon: 'percent' as const,
    color: '#a855f7',
  },
];

const categoryColors: Record<string, string> = {
  'Cloud Services': '#3b82f6',
  'CRM & Sales': '#22c55e',
  'Marketing Tools': '#f59e0b',
  'Communications': '#a855f7',
  'Design Tools': '#ec4899',
};

export default function SpendCategoriesContent() {
  const [donutW, setDonutW] = useState(0);
  const maxBreakdown = Math.max(...categoryBreakdown.map((c) => c.amount));

  return (
    <>
      <Text style={contentStyles.pageTitle}>Spend Categories</Text>
      <Text style={contentStyles.pageSubtitle}>
        Analyze spending patterns across different service categories.
      </Text>

      <View style={contentStyles.kpiRow}>
        {spendKpis.map((kpi, i) => (
          <View key={kpi.title} style={[contentStyles.kpiItem, i === 0 && contentStyles.kpiItemFirst]}>
            <KPICard {...kpi} />
          </View>
        ))}
      </View>

      <View style={contentStyles.chartsRow}>
        <View
          style={[contentStyles.chartCard, { flex: 1 }]}
          onLayout={(e: LayoutChangeEvent) => setDonutW(e.nativeEvent.layout.width)}
        >
          <Text style={contentStyles.cardTitle}>Spend Distribution</Text>
          <Text style={contentStyles.cardSubtitle}>Current month breakdown</Text>
          {donutW > 0 && (
            <DonutChart
              width={donutW - 48}
              height={280}
              data={spendDistribution.map((d) => ({ name: d.name, value: d.value, color: d.color }))}
            />
          )}
        </View>
        <View style={[contentStyles.chartCard, contentStyles.chartCardSecond, { flex: 1 }]}>
          <Text style={contentStyles.cardTitle}>Category Breakdown</Text>
          <Text style={contentStyles.cardSubtitle}>Monthly spending by category</Text>
          {categoryBreakdown.map((c) => (
            <View key={c.name} style={styles.breakdownRow}>
              <View style={styles.breakdownLabel}>
                <View style={[styles.dot, { backgroundColor: categoryColors[c.name] ?? Colors.textTertiary }]} />
                <Text style={styles.breakdownName}>{c.name}</Text>
              </View>
              <View style={styles.breakdownBarWrap}>
                <View
                  style={[
                    styles.breakdownBar,
                    {
                      width: `${(c.amount / maxBreakdown) * 100}%`,
                      backgroundColor: categoryColors[c.name] ?? Colors.textTertiary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.breakdownPct, c.pctChange < 0 && styles.negative]}>
                {c.pctChange > 0 ? '+' : ''}{c.pctChange}%
              </Text>
              <Text style={styles.breakdownAmount}>${(c.amount / 1000).toFixed(1)}K</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  breakdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 130,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  breakdownName: {
    fontSize: 13,
    color: Colors.text,
  },
  breakdownBarWrap: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.inputBg,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  breakdownBar: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownPct: {
    width: 40,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  negative: { color: '#ef4444' },
  breakdownAmount: {
    width: 56,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'right',
  },
});
