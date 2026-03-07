import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';
import KPICard from '../components/KPICard';
import LineChart from '../components/charts/LineChart';
import {
  vendorAnalyticsKpis,
  topVendorsSpendTrend,
} from '../constants/dummyData';

const vendorKpis = [
  {
    title: 'Active Vendors',
    value: String(vendorAnalyticsKpis.activeVendors),
    change: `+${vendorAnalyticsKpis.activeVendorsChange} this quarter`,
    positive: true,
    icon: 'layers' as const,
    color: '#22c55e',
  },
  {
    title: 'Total Monthly Spend',
    value: `$${(vendorAnalyticsKpis.totalMonthlySpend / 1000).toFixed(1)}K`,
    change: `+${vendorAnalyticsKpis.spendChange}% vs last month`,
    positive: true,
    icon: 'dollar-sign' as const,
    color: '#3b82f6',
  },
  {
    title: 'Avg Utilization',
    value: `${vendorAnalyticsKpis.avgUtilization}%`,
    change: `+${vendorAnalyticsKpis.utilizationChange}% improvement`,
    positive: true,
    icon: 'trending-up' as const,
    color: '#f59e0b',
  },
  {
    title: 'Renewals Due',
    value: String(vendorAnalyticsKpis.renewalsDue),
    change: 'Next 90 days',
    positive: false,
    icon: 'alert-circle' as const,
    color: '#ef4444',
  },
];

export default function VendorAnalyticsContent() {
  const [chartW, setChartW] = useState(0);

  return (
    <>
      <Text style={contentStyles.pageTitle}>Vendor Analytics</Text>
      <Text style={contentStyles.pageSubtitle}>
        Deep insights into vendor relationships and spending patterns.
      </Text>

      <View style={contentStyles.kpiRow}>
        {vendorKpis.map((kpi, i) => (
          <View key={kpi.title} style={[contentStyles.kpiItem, i === 0 && contentStyles.kpiItemFirst]}>
            <KPICard {...kpi} />
          </View>
        ))}
      </View>

      <View
        style={contentStyles.card}
        onLayout={(e: LayoutChangeEvent) => setChartW(e.nativeEvent.layout.width)}
      >
        <Text style={contentStyles.cardTitle}>Top 5 Vendors - Spend Trend</Text>
        <Text style={contentStyles.cardSubtitle}>6-month spending comparison</Text>
        {chartW > 0 && (
          <LineChart
            width={chartW - 48}
            height={280}
            labels={topVendorsSpendTrend.labels}
            values={topVendorsSpendTrend.values}
            color="#ec4899"
          />
        )}
      </View>
    </>
  );
}
