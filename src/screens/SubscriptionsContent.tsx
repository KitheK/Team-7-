import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';
import StatusPill from '../components/StatusPill';
import {
  subscriptionsSummary,
  subscriptionsTable,
} from '../constants/dummyData';

export default function SubscriptionsContent() {
  return (
    <>
      <Text style={contentStyles.pageTitle}>Subscriptions</Text>
      <Text style={contentStyles.pageSubtitle}>
        Monitor and manage your recurring expenses.
      </Text>

      <View style={contentStyles.kpiRow}>
        <View style={[contentStyles.kpiItem, contentStyles.kpiItemFirst]}>
          <View style={[styles.summaryCard, styles.cardActive]}>
            <Feather name="check-circle" size={24} color="#22c55e" />
            <Text style={styles.summaryValue}>{subscriptionsSummary.active}</Text>
            <Text style={styles.summaryLabel}>Active Subscriptions</Text>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={[styles.summaryCard, styles.cardAlert]}>
            <Feather name="alert-triangle" size={24} color="#eab308" />
            <Text style={styles.summaryValue}>{subscriptionsSummary.priceAlerts}</Text>
            <Text style={styles.summaryLabel}>Price Alerts</Text>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={[styles.summaryCard, styles.cardCancelled]}>
            <Feather name="x-circle" size={24} color="#ef4444" />
            <Text style={styles.summaryValue}>{subscriptionsSummary.recentlyCancelled}</Text>
            <Text style={styles.summaryLabel}>Recently Cancelled</Text>
          </View>
        </View>
      </View>

      <View style={contentStyles.card}>
        <View style={styles.tableHeader}>
          <View>
            <Text style={contentStyles.cardTitle}>All Subscriptions</Text>
            <Text style={contentStyles.cardSubtitle}>Monitor and manage your recurring expenses.</Text>
          </View>
          <View style={styles.filters}>
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>All Categories</Text>
              <Feather name="chevron-down" size={14} color={Colors.textSecondary} />
            </View>
            <View style={[styles.dropdown, { marginLeft: 12 }]}>
              <Text style={styles.dropdownText}>All Status</Text>
              <Feather name="chevron-down" size={14} color={Colors.textSecondary} />
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={[styles.cell, styles.cellService]}>Service</Text>
            <Text style={[styles.cell, styles.cellCat]}>Category</Text>
            <Text style={[styles.cell, styles.cellCost]}>Cost</Text>
            <Text style={[styles.cell, styles.cellChange]}>Price Change</Text>
            <Text style={[styles.cell, styles.cellBilling]}>Next Billing</Text>
            <Text style={[styles.cell, styles.cellStatus]}>Status</Text>
            <Text style={[styles.cell, styles.cellAction]} />
          </View>
          {subscriptionsTable.map((row) => (
            <View key={row.id} style={styles.tableRow}>
              <View style={[styles.cell, styles.cellService, styles.cellServiceContent]}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{row.initial}</Text>
                </View>
                <View>
                  <Text style={styles.serviceName}>{row.service}</Text>
                  <Text style={styles.period}>Monthly</Text>
                </View>
              </View>
              <Text style={[styles.cell, styles.cellCat]}>{row.category}</Text>
              <Text style={[styles.cell, styles.cellCost]}>${row.cost.toLocaleString()}</Text>
              <Text style={[styles.cell, styles.cellChange, row.priceChange > 0 ? styles.positive : row.priceChange < 0 ? styles.negative : null]}>
                {row.priceChange > 0 ? '+' : ''}{row.priceChange}%
              </Text>
              <View style={[styles.cell, styles.cellBilling]}>
                <Feather name="calendar" size={12} color={Colors.textTertiary} style={{ marginRight: 4 }} />
                <Text style={styles.cellText}>{row.nextBilling}</Text>
              </View>
              <View style={[styles.cell, styles.cellStatus]}>
                <StatusPill
                  label={row.status}
                  variant={row.status === 'Active' ? 'active' : 'priceAlert'}
                />
              </View>
              <Pressable style={[styles.cell, styles.cellAction]}>
                <Feather name="more-vertical" size={18} color={Colors.textSecondary} />
              </Pressable>
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
  cardActive: {},
  cardAlert: {},
  cardCancelled: {},
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
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  filters: {
    flexDirection: 'row',
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
  },
  dropdownText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 6,
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
  cell: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  cellText: { fontSize: 13, color: Colors.textSecondary },
  cellService: { flex: 1.8, minWidth: 160 },
  cellCat: { flex: 1, minWidth: 100 },
  cellCost: { flex: 0.7, minWidth: 72 },
  cellChange: { flex: 0.6, minWidth: 64 },
  cellBilling: { flex: 0.7, minWidth: 72 },
  cellStatus: { flex: 0.8, minWidth: 90 },
  cellAction: { flex: 0.2, minWidth: 32 },
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
    marginRight: 12,
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
  },
  period: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  positive: { color: '#22c55e' },
  negative: { color: '#ef4444' },
});
