import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { contentStyles } from '../constants/contentStyles';
import {
  kpiData,
  spendingSavingsData,
  cumulativeSavingsData,
  spendingByCategoryData,
} from '../constants/data';
import KPICard from '../components/KPICard';
import LineChart from '../components/charts/LineChart';
import DonutChart from '../components/charts/DonutChart';
import BarChart from '../components/charts/BarChart';

export default function DashboardContent() {
  const [lineW, setLineW] = useState(0);
  const [donutW, setDonutW] = useState(0);
  const [barW, setBarW] = useState(0);

  const onLayout = (setter: (w: number) => void) => (e: LayoutChangeEvent) => {
    setter(e.nativeEvent.layout.width);
  };

  return (
    <>
      <Text style={contentStyles.pageTitle}>Dashboard</Text>
      <Text style={contentStyles.pageSubtitle}>
        Welcome back — here's your cost intelligence overview.
      </Text>

      <View style={contentStyles.kpiRow}>
        {kpiData.map((kpi, i) => (
          <View key={kpi.title} style={[contentStyles.kpiItem, i === 0 && contentStyles.kpiItemFirst]}>
            <KPICard {...kpi} />
          </View>
        ))}
      </View>

      <View style={contentStyles.chartsRow}>
        <View style={[contentStyles.chartCard, { flex: 1 }]} onLayout={onLayout(setLineW)}>
          <Text style={styles.chartTitle}>Cumulative Savings</Text>
          <Text style={styles.chartSubtitle}>Last 6 months performance</Text>
          {lineW > 0 && (
            <LineChart
              width={lineW - 48}
              height={260}
              labels={cumulativeSavingsData.labels}
              values={cumulativeSavingsData.values}
              color={Colors.chart[0]}
            />
          )}
        </View>
        <View style={[contentStyles.chartCard, contentStyles.chartCardSecond, { flex: 1 }]} onLayout={onLayout(setDonutW)}>
          <Text style={styles.chartTitle}>Spending by Category</Text>
          <Text style={styles.chartSubtitle}>Current month breakdown</Text>
          {donutW > 0 && (
            <View style={contentStyles.donutContainer}>
              <DonutChart width={donutW - 48} height={220} data={spendingByCategoryData} />
            </View>
          )}
        </View>
      </View>

      <View style={[contentStyles.card]} onLayout={onLayout(setBarW)}>
        <Text style={styles.chartTitle}>Spending vs Savings Trend</Text>
        <Text style={styles.chartSubtitle}>Monthly comparison</Text>
        {barW > 0 && (
          <BarChart
            width={barW - 48}
            height={320}
            labels={spendingSavingsData.labels}
            series={[
              { data: spendingSavingsData.spending, color: '#3b82f6', label: 'Spending' },
              { data: spendingSavingsData.savings, color: '#22c55e', label: 'Savings' },
            ]}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  chartTitle: {
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    color: Colors.text,
    marginBottom: 2,
  },
  chartSubtitle: {
    fontSize: Typography.cardSubtitle.fontSize,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
});
