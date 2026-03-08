import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import { getContentStyles } from '../constants/contentStyles';
import DonutChart from '../components/charts/DonutChart';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import { useWorkspace } from '../context/WorkspaceContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
type Tab = 'categories' | 'vendors';

export default function SpendingContent() {
  const [tab, setTab] = useState<Tab>('categories');
  const [chartW, setChartW] = useState(0);
  const c = useColors();
  const cs = useMemo(() => getContentStyles(c), [c]);
  const s = useMemo(() => createStyles(c), [c]);

  const { activeWorkspaceTransactions, activeWorkspaceId } = useWorkspace();
  const { totalAmount, byCategory, vendorAnalytics, byVendorChart, subscriptionCount, isEmpty } = useWorkspaceData(activeWorkspaceTransactions);

  if (isEmpty) {
    return (
      <>
        <Text style={cs.pageTitle}>Spending</Text>
        <Text style={cs.pageSubtitle}>See where every dollar goes. Upload a statement to get started.</Text>
        <WorkspaceEmptyState activeWorkspaceId={activeWorkspaceId} />
      </>
    );
  }

  const chartData = tab === 'categories' ? byCategory : byVendorChart.slice(0, 8);
  const top = chartData[0];

  return (
    <>
      <Text style={cs.pageTitle}>Spending</Text>
      <Text style={cs.pageSubtitle}>Where your money goes — by category or vendor.</Text>

      <View style={s.summaryStrip}>
        {[
          { val: `$${(totalAmount / 1000).toFixed(1)}K`, label: 'Total spend' },
          { val: `${subscriptionCount}`, label: 'Vendors' },
          { val: `${byCategory.length}`, label: 'Categories' },
          ...(top ? [{ val: top.name, label: `Top (${((top.value / totalAmount) * 100).toFixed(0)}%)` }] : []),
        ].map((item, i) => (
          <View key={i} style={s.summaryCard}>
            <Text style={s.summaryValue} numberOfLines={1}>{item.val}</Text>
            <Text style={s.summaryLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={s.tabRow}>
        {(['categories', 'vendors'] as Tab[]).map(t => (
          <Pressable key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Feather name={t === 'categories' ? 'pie-chart' : 'briefcase'} size={14} color={tab === t ? c.primary : c.textTertiary} />
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t === 'categories' ? 'By Category' : 'By Vendor'}</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.mainContent}>
        <View style={[cs.card, s.chartSection]} onLayout={(e: LayoutChangeEvent) => setChartW(e.nativeEvent.layout.width)}>
          <Text style={s.chartTitle}>{tab === 'categories' ? 'Spend by category' : 'Spend by vendor'}</Text>
          {chartW > 0 && chartData.length > 0 && (
            <View style={cs.donutContainer}>
              <DonutChart width={chartW - (isNative ? 32 : 48)} height={isNative ? 200 : 240} data={chartData} />
            </View>
          )}
        </View>
        <View style={[cs.card, s.breakdownSection]}>
          <Text style={s.breakdownTitle}>Breakdown</Text>
          {tab === 'categories' ? byCategory.map((item, i) => (
            <View key={i} style={s.breakdownRow}>
              <View style={[s.colorDot, { backgroundColor: item.color }]} />
              <Text style={s.breakdownName} numberOfLines={1}>{item.name}</Text>
              <Text style={s.breakdownPct}>{((item.value / totalAmount) * 100).toFixed(0)}%</Text>
              <Text style={s.breakdownValue}>${item.value.toLocaleString()}</Text>
            </View>
          )) : vendorAnalytics.slice(0, 12).map((v, i) => (
            <View key={i} style={s.breakdownRow}>
              <View style={[s.colorDot, { backgroundColor: c.chart[i % c.chart.length] }]} />
              <View style={s.vendorInfo}>
                <Text style={s.breakdownName} numberOfLines={1}>{v.vendor}</Text>
                <Text style={s.vendorMeta}>{v.category} &middot; {v.count}x</Text>
              </View>
              <Text style={s.breakdownValue}>${v.total.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    summaryStrip: { flexDirection: isNative ? 'column' : 'row', gap: 12, marginBottom: 20 },
    summaryCard: { flex: isNative ? 0 : 1, backgroundColor: c.card, borderRadius: 12, padding: isNative ? 14 : 16, borderWidth: 1, borderColor: c.cardBorder },
    summaryValue: { fontSize: isNative ? 18 : 20, fontWeight: '700', color: c.text, marginBottom: 2 },
    summaryLabel: { fontSize: 12, color: c.textSecondary },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.border },
    tabActive: { backgroundColor: c.primaryLight, borderColor: c.primary },
    tabText: { fontSize: 13, fontWeight: '500', color: c.textTertiary },
    tabTextActive: { color: c.primary, fontWeight: '600' },
    mainContent: { flexDirection: isNative ? 'column' : 'row', gap: isNative ? 0 : 20 },
    chartSection: { flex: isNative ? 0 : 1 },
    breakdownSection: { flex: isNative ? 0 : 1.2 },
    chartTitle: { fontSize: 15, fontWeight: '600', color: c.text, marginBottom: 8 },
    breakdownTitle: { fontSize: 15, fontWeight: '600', color: c.text, marginBottom: 14 },
    breakdownRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, marginBottom: 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
    colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    breakdownName: { flex: 1, fontSize: 13, fontWeight: '500', color: c.text, minWidth: 0 },
    breakdownPct: { fontSize: 12, color: c.textTertiary, width: 40, textAlign: 'right', marginRight: 12 },
    breakdownValue: { fontSize: 13, fontWeight: '600', color: c.text, minWidth: 70, textAlign: 'right' },
    vendorInfo: { flex: 1, minWidth: 0 },
    vendorMeta: { fontSize: 11, color: c.textTertiary, marginTop: 2 },
  });
}
