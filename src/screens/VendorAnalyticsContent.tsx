import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';
import KPICard from '../components/KPICard';
import DonutChart from '../components/charts/DonutChart';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import { useWorkspace } from '../context/WorkspaceContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';

export default function VendorAnalyticsContent() {
  const [chartW, setChartW] = useState(0);
  const { activeWorkspaceTransactions, activeWorkspaceId } = useWorkspace();
  const {
    totalAmount,
    vendorAnalytics,
    byVendorChart,
    subscriptionCount,
    isEmpty,
  } = useWorkspaceData(activeWorkspaceTransactions);

  if (isEmpty) {
    return (
      <>
      <Text style={contentStyles.pageTitle}>Who you pay</Text>
      <Text style={contentStyles.pageSubtitle}>
        A list of every company you paid and how much. Add a statement to see it here.
      </Text>
        <WorkspaceEmptyState activeWorkspaceId={activeWorkspaceId} />
      </>
    );
  }

  const topVendor = vendorAnalytics[0];
  const kpis = [
    {
      title: 'Vendors',
      value: String(subscriptionCount),
      change: 'In this view',
      positive: true,
      icon: 'layers' as const,
      color: '#22c55e',
    },
    {
      title: 'Total spend',
      value: `$${(totalAmount / 1000).toFixed(1)}K`,
      change: 'In this view',
      positive: true,
      icon: 'dollar-sign' as const,
      color: '#3b82f6',
    },
    {
      title: 'Top vendor',
      value: topVendor?.vendor ?? '—',
      change: topVendor ? `$${topVendor.total.toLocaleString()}` : '—',
      positive: true,
      icon: 'trending-up' as const,
      color: '#f59e0b',
    },
    {
      title: 'Transactions',
      value: String(activeWorkspaceTransactions.length),
      change: 'Total rows',
      positive: true,
      icon: 'file-text' as const,
      color: '#a855f7',
    },
  ];

  return (
    <>
      <Text style={contentStyles.pageTitle}>Who you pay</Text>
      <Text style={contentStyles.pageSubtitle}>
        Every company you paid and how much — so you can spot the big ones.
      </Text>

      <View style={contentStyles.kpiRow}>
        {kpis.map((kpi, i) => (
          <View key={kpi.title} style={[contentStyles.kpiItem, i === 0 && contentStyles.kpiItemFirst]}>
            <KPICard {...kpi} />
          </View>
        ))}
      </View>

      {byVendorChart.length > 0 && (
        <View
          style={[contentStyles.card, { marginTop: 24 }]}
          onLayout={(e: LayoutChangeEvent) => setChartW(e.nativeEvent.layout.width)}
        >
          <Text style={styles.chartTitle}>Spend by vendor</Text>
          <Text style={styles.chartSubtitle}>Top vendors in this view</Text>
          {chartW > 0 && (
            <View style={contentStyles.donutContainer}>
              <DonutChart width={chartW - 48} height={240} data={byVendorChart.slice(0, 8)} />
            </View>
          )}
        </View>
      )}

      <View style={contentStyles.card}>
        <Text style={contentStyles.cardTitle}>Vendor breakdown</Text>
        <Text style={contentStyles.cardSubtitle}>Total, count, and average per vendor</Text>
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={[styles.cell, styles.colVendor]}>Vendor</Text>
            <Text style={[styles.cell, styles.colCat]}>Category</Text>
            <Text style={[styles.cell, styles.colTotal]}>Total</Text>
            <Text style={[styles.cell, styles.colCount]}>Count</Text>
            <Text style={[styles.cell, styles.colAvg]}>Avg</Text>
          </View>
          {vendorAnalytics.map((row, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.cell, styles.colVendor, styles.vendorName]} numberOfLines={1}>{row.vendor}</Text>
              <Text style={[styles.cell, styles.colCat]}>{row.category}</Text>
              <Text style={[styles.cell, styles.colTotal]}>${row.total.toLocaleString()}</Text>
              <Text style={[styles.cell, styles.colCount]}>{row.count}</Text>
              <Text style={[styles.cell, styles.colAvg]}>${row.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  table: { marginTop: 16 },
  tableRowHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cell: { fontSize: 13, color: Colors.textSecondary },
  colVendor: { flex: 1.4, minWidth: 100 },
  colCat: { flex: 1, minWidth: 80 },
  colTotal: { flex: 0.6, minWidth: 72 },
  colCount: { flex: 0.35, minWidth: 48 },
  colAvg: { flex: 0.6, minWidth: 64 },
  vendorName: { fontWeight: '600', color: Colors.text },
});
