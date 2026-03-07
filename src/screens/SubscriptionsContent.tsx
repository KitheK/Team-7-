import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';
import StatusPill from '../components/StatusPill';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import { useWorkspace } from '../context/WorkspaceContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';

export default function SubscriptionsContent() {
  const { activeWorkspaceTransactions, activeWorkspaceId } = useWorkspace();
  const {
    subscriptionCount,
    duplicateOrAlertCount,
    totalAmount,
    subscriptions,
    isEmpty,
  } = useWorkspaceData(activeWorkspaceTransactions);

  if (isEmpty) {
    return (
      <>
      <Text style={contentStyles.pageTitle}>Recurring bills</Text>
      <Text style={contentStyles.pageSubtitle}>
        Companies you pay regularly. Add a statement for a month to see them here.
      </Text>
        <WorkspaceEmptyState activeWorkspaceId={activeWorkspaceId} />
      </>
    );
  }

  return (
    <>
      <Text style={contentStyles.pageTitle}>Recurring bills</Text>
      <Text style={contentStyles.pageSubtitle}>
        Companies you pay regularly — see who shows up more than once (possible double charge).
      </Text>

      <View style={contentStyles.kpiRow}>
        <View style={[contentStyles.kpiItem, contentStyles.kpiItemFirst]}>
          <View style={styles.summaryCard}>
            <Feather name="check-circle" size={24} color="#22c55e" />
            <Text style={styles.summaryValue}>{subscriptionCount}</Text>
            <Text style={styles.summaryLabel}>Vendors / subscriptions</Text>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={styles.summaryCard}>
            <Feather name="alert-triangle" size={24} color="#eab308" />
            <Text style={styles.summaryValue}>{duplicateOrAlertCount}</Text>
            <Text style={styles.summaryLabel}>Duplicate or multi-charge</Text>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={styles.summaryCard}>
            <Feather name="dollar-sign" size={24} color="#3b82f6" />
            <Text style={styles.summaryValue}>${(totalAmount / 1000).toFixed(1)}K</Text>
            <Text style={styles.summaryLabel}>Total spend</Text>
          </View>
        </View>
      </View>

      <View style={contentStyles.card}>
        <Text style={contentStyles.cardTitle}>All subscriptions (by vendor)</Text>
        <Text style={contentStyles.cardSubtitle}>From uploaded transactions in this view</Text>
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={[styles.cell, styles.cellService]}>Vendor</Text>
            <Text style={[styles.cell, styles.cellCat]}>Category</Text>
            <Text style={[styles.cell, styles.cellCost]}>Total</Text>
            <Text style={[styles.cell, styles.cellCount]}>Charges</Text>
            <Text style={[styles.cell, styles.cellDate]}>Last date</Text>
            <Text style={[styles.cell, styles.cellStatus]}>Status</Text>
          </View>
          {subscriptions.map((row, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={[styles.cell, styles.cellService, styles.cellServiceContent]}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{row.vendor.slice(0, 1).toUpperCase()}</Text>
                </View>
                <Text style={styles.serviceName} numberOfLines={1}>{row.vendor}</Text>
              </View>
              <Text style={[styles.cell, styles.cellCat]}>{row.category}</Text>
              <Text style={[styles.cell, styles.cellCost]}>${row.totalAmount.toLocaleString()}</Text>
              <Text style={[styles.cell, styles.cellCount]}>{row.count}</Text>
              <Text style={[styles.cell, styles.cellDate]}>{row.lastDate ?? '—'}</Text>
              <View style={[styles.cell, styles.cellStatus]}>
                <StatusPill
                  label={row.isDuplicate ? 'Duplicate' : 'Active'}
                  variant={row.isDuplicate ? 'priceAlert' : 'active'}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  table: {},
  tableRowHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginTop: 16,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cell: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  cellService: { flex: 1.5, minWidth: 120 },
  cellCat: { flex: 1, minWidth: 90 },
  cellCost: { flex: 0.6, minWidth: 72 },
  cellCount: { flex: 0.35, minWidth: 48 },
  cellDate: { flex: 0.6, minWidth: 80 },
  cellStatus: { flex: 0.7, minWidth: 88 },
  cellServiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
});
