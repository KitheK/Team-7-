import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Platform } from 'react-native';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';
import KPICard from '../components/KPICard';
import DonutChart from '../components/charts/DonutChart';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import { useWorkspace } from '../context/WorkspaceContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export default function SpendCategoriesContent() {
  const [donutW, setDonutW] = useState(0);
  const { activeWorkspaceTransactions, activeWorkspaceId } = useWorkspace();
  const {
    totalAmount,
    byCategory,
    subscriptionCount,
    isEmpty,
  } = useWorkspaceData(activeWorkspaceTransactions);

  if (isEmpty) {
    return (
      <>
        <Text style={contentStyles.pageTitle}>Where your money went</Text>
        <Text style={contentStyles.pageSubtitle}>
          Spending grouped by type. Add a statement to see your breakdown.
        </Text>
        <WorkspaceEmptyState activeWorkspaceId={activeWorkspaceId} />
      </>
    );
  }

  const topCategory = byCategory[0];
  const kpis = [
    { title: 'Total spend', value: `$${(totalAmount / 1000).toFixed(1)}K`, change: 'In this view', positive: true, icon: 'dollar-sign' as const, color: '#22c55e' },
    { title: 'Categories', value: String(byCategory.length), change: 'With spend', positive: true, icon: 'pie-chart' as const, color: '#3b82f6' },
    { title: 'Vendors', value: String(subscriptionCount), change: 'Unique vendors', positive: true, icon: 'layers' as const, color: '#f59e0b' },
    { title: 'Top category', value: topCategory?.name ?? '—', change: topCategory ? `${((topCategory.value / totalAmount) * 100).toFixed(0)}% of total` : '—', positive: true, icon: 'percent' as const, color: '#a855f7' },
  ];

  return (
    <>
      <Text style={contentStyles.pageTitle}>Where your money went</Text>
      <Text style={contentStyles.pageSubtitle}>
        Your spending grouped by type — spot where most goes.
      </Text>

      <View style={contentStyles.kpiRow}>
        {kpis.map((kpi, i) => (
          <View key={kpi.title} style={[contentStyles.kpiItem, i === 0 && contentStyles.kpiItemFirst]}>
            <KPICard {...kpi} />
          </View>
        ))}
      </View>

      <View
        style={[contentStyles.chartCard, { marginTop: isNative ? 0 : 24 }]}
        onLayout={(e: LayoutChangeEvent) => setDonutW(e.nativeEvent.layout.width)}
      >
        <Text style={styles.chartTitle}>Spend by category</Text>
        <Text style={styles.chartSubtitle}>Derived from vendor → category mapping</Text>
        {donutW > 0 && byCategory.length > 0 && (
          <View style={contentStyles.donutContainer}>
            <DonutChart width={donutW - (isNative ? 32 : 48)} height={isNative ? 200 : 240} data={byCategory} />
          </View>
        )}
        {byCategory.length === 0 && (
          <Text style={styles.noCategories}>No categories from transactions.</Text>
        )}
      </View>

      {byCategory.length > 0 && (
        <View style={contentStyles.card}>
          <Text style={contentStyles.cardTitle}>Category breakdown</Text>
          <View style={styles.breakdownTable}>
            {byCategory.map((c, i) => (
              <View key={i} style={styles.breakdownRow}>
                <View style={[styles.breakdownBar, { width: `${(c.value / totalAmount) * 100}%`, backgroundColor: c.color }]} />
                <Text style={styles.breakdownName} numberOfLines={1}>{c.name}</Text>
                <Text style={styles.breakdownValue}>${c.value.toLocaleString()}</Text>
                <Text style={styles.breakdownPct}>{((c.value / totalAmount) * 100).toFixed(0)}%</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  chartTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  chartSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },
  noCategories: { fontSize: 14, color: Colors.textTertiary, padding: 24 },
  breakdownTable: { marginTop: 16 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: isNative ? 8 : 12 },
  breakdownBar: { height: 8, borderRadius: 4, minWidth: 4 },
  breakdownName: { flex: 1, fontSize: 13, color: Colors.text, minWidth: 0 },
  breakdownValue: { fontSize: 13, fontWeight: '600', color: Colors.text, width: isNative ? 70 : 80, textAlign: 'right' },
  breakdownPct: { fontSize: 12, color: Colors.textSecondary, width: 40, textAlign: 'right' },
});
