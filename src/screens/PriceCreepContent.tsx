import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';
import StatusPill from '../components/StatusPill';
import BarChart from '../components/charts/BarChart';
import { priceCreepMonthly, priceChangesTable } from '../constants/dummyData';

export default function PriceCreepContent() {
  const [barW, setBarW] = useState(0);

  return (
    <>
      <Text style={contentStyles.pageTitle}>Detected Price Changes</Text>
      <Text style={contentStyles.pageSubtitle}>
        All unauthorized price increases.
      </Text>

      <View
        style={contentStyles.card}
        onLayout={(e: LayoutChangeEvent) => setBarW(e.nativeEvent.layout.width)}
      >
        <Text style={contentStyles.cardTitle}>Monthly price change summary</Text>
        <Text style={contentStyles.cardSubtitle}>Total $ increase and count by month</Text>
        {barW > 0 && (
          <BarChart
            width={barW - 48}
            height={200}
            labels={priceCreepMonthly.map((m) => m.month)}
            series={[
              {
                data: priceCreepMonthly.map((m) => m.amount),
                color: '#eab308',
                label: 'Increase ($)',
              },
            ]}
          />
        )}
        <View style={styles.monthlyLegend}>
          {priceCreepMonthly.map((m) => (
            <View key={m.month} style={styles.legendItem}>
              <Text style={styles.legendAmount}>${m.amount}</Text>
              <Text style={styles.legendCount}>{m.count} increases</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={contentStyles.card}>
        <View style={styles.tableHeader}>
          <Text style={contentStyles.cardTitle}>Detected Price Changes</Text>
          <View style={styles.headerActions}>
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>All Status</Text>
              <Feather name="chevron-down" size={14} color={Colors.textSecondary} />
            </View>
            <Pressable style={styles.exportBtn}>
              <Text style={styles.exportBtnText}>Export Report</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={[styles.cell, styles.colVendor]}>Vendor</Text>
            <Text style={[styles.cell, styles.colPrice]}>Old Price</Text>
            <Text style={[styles.cell, styles.colPrice]}>New Price</Text>
            <Text style={[styles.cell, styles.colIncrease]}>Increase</Text>
            <Text style={[styles.cell, styles.colDetected]}>Detected</Text>
            <Text style={[styles.cell, styles.colStatus]}>Status</Text>
            <Text style={[styles.cell, styles.colAction]}>Action</Text>
          </View>
          {priceChangesTable.map((row, i) => {
            const increase = row.newPrice - row.oldPrice;
            const pct = ((increase / row.oldPrice) * 100).toFixed(1);
            return (
              <View key={i} style={styles.tableRow}>
                <View style={[styles.cell, styles.colVendor]}>
                  <Text style={styles.vendorName}>{row.vendor}</Text>
                  <Text style={styles.categoryName}>{row.category}</Text>
                </View>
                <Text style={[styles.cell, styles.colPrice]}>${row.oldPrice.toLocaleString()}</Text>
                <Text style={[styles.cell, styles.colPrice]}>${row.newPrice.toLocaleString()}</Text>
                <View style={[styles.cell, styles.colIncrease]}>
                  <Text style={styles.negative}>+${increase} (+{pct}%)</Text>
                </View>
                <View style={[styles.cell, styles.colDetected]}>
                  <Feather name="calendar" size={12} color={Colors.textTertiary} style={{ marginRight: 4 }} />
                  <Text style={styles.cellText}>{row.detected}</Text>
                </View>
                <View style={[styles.cell, styles.colStatus]}>
                  <StatusPill
                    label={row.status}
                    variant={row.status === 'Critical' ? 'critical' : row.status === 'Warning' ? 'warning' : 'resolved'}
                  />
                </View>
                <View style={[styles.cell, styles.colAction]}>
                  <Text style={styles.cellText}>{row.action}</Text>
                  <Pressable style={styles.takeActionBtn}>
                    <Text style={styles.takeActionText}>Take Action →</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  monthlyLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legendItem: {
    alignItems: 'center',
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  legendCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
    marginRight: 12,
  },
  dropdownText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 6,
  },
  exportBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  table: {},
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cell: { fontSize: 13, color: Colors.textSecondary },
  cellText: { fontSize: 13, color: Colors.textSecondary },
  colVendor: { flex: 1.4, minWidth: 120 },
  colPrice: { flex: 0.6, minWidth: 72 },
  colIncrease: { flex: 0.8, minWidth: 88 },
  colDetected: { flex: 0.6, minWidth: 72 },
  colStatus: { flex: 0.6, minWidth: 80 },
  colAction: { flex: 1.2, minWidth: 140 },
  vendorName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  categoryName: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  negative: { color: '#ef4444', fontSize: 13 },
  takeActionBtn: {
    marginTop: 4,
  },
  takeActionText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
});
