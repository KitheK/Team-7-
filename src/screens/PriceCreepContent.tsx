import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import { useWorkspace } from '../context/WorkspaceContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';

export default function PriceCreepContent() {
  const [tableW, setTableW] = useState(0);
  const { activeWorkspaceTransactions, activeWorkspaceId } = useWorkspace();
  const { priceCreepSignals, totalAmount, isEmpty } = useWorkspaceData(activeWorkspaceTransactions);

  if (isEmpty) {
    return (
      <>
      <Text style={contentStyles.pageTitle}>Unexpected price increases</Text>
      <Text style={contentStyles.pageSubtitle}>
        We flag when the same company charged you more than once or raised the amount. Add a statement to see results.
      </Text>
        <WorkspaceEmptyState activeWorkspaceId={activeWorkspaceId} />
      </>
    );
  }

  return (
    <>
      <Text style={contentStyles.pageTitle}>Unexpected price increases</Text>
      <Text style={contentStyles.pageSubtitle}>
        Same company charged you more than once, or the amount went up — worth a second look.
      </Text>

      <View style={contentStyles.kpiRow}>
        <View style={[contentStyles.kpiItem, contentStyles.kpiItemFirst]}>
          <View style={styles.kpiCard}>
            <Feather name="trending-up" size={22} color={Colors.warning} />
            <Text style={styles.kpiValue}>{priceCreepSignals.length}</Text>
            <Text style={styles.kpiLabel}>Vendors with duplicate or variance</Text>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={styles.kpiCard}>
            <Feather name="dollar-sign" size={22} color={Colors.textSecondary} />
            <Text style={styles.kpiValue}>${(totalAmount / 1000).toFixed(1)}K</Text>
            <Text style={styles.kpiLabel}>Total in view</Text>
          </View>
        </View>
      </View>

      <View
        style={contentStyles.card}
        onLayout={(e: LayoutChangeEvent) => setTableW(e.nativeEvent.layout.width)}
      >
        <Text style={contentStyles.cardTitle}>Detected price / duplicate signals</Text>
        <Text style={contentStyles.cardSubtitle}>
          Same vendor charged multiple times or amount variance &gt;5% in this period
        </Text>
        {priceCreepSignals.length === 0 ? (
          <View style={styles.emptyInline}>
            <Feather name="check-circle" size={24} color={Colors.success} />
            <Text style={styles.emptyInlineText}>No duplicate or variance signals in this view.</Text>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableRowHeader}>
              <Text style={[styles.cell, styles.colVendor]}>Vendor</Text>
              <Text style={[styles.cell, styles.colCharges]}>Charges</Text>
              <Text style={[styles.cell, styles.colTotal]}>Total</Text>
              <Text style={[styles.cell, styles.colMessage]}>Signal</Text>
            </View>
            {priceCreepSignals.map((row, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.cell, styles.colVendor, styles.vendorName]}>{row.vendor}</Text>
                <Text style={[styles.cell, styles.colCharges]}>{row.count}</Text>
                <Text style={[styles.cell, styles.colTotal]}>${row.totalAmount.toLocaleString()}</Text>
                <Text style={[styles.cell, styles.colMessage, styles.message]}>{row.message}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  kpiCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 10,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyInline: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    marginTop: 16,
  },
  emptyInlineText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 12,
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cell: { fontSize: 13, color: Colors.textSecondary },
  colVendor: { flex: 1.2, minWidth: 100 },
  colCharges: { flex: 0.35, minWidth: 56 },
  colTotal: { flex: 0.6, minWidth: 72 },
  colMessage: { flex: 1.5, minWidth: 0 },
  vendorName: { fontWeight: '600', color: Colors.text },
  message: { color: Colors.warning, fontSize: 12 },
});
