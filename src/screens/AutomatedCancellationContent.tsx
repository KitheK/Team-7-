import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';
import StatusPill from '../components/StatusPill';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import { useWorkspace } from '../context/WorkspaceContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export default function AutomatedCancellationContent() {
  const { activeWorkspaceTransactions, activeWorkspaceId } = useWorkspace();
  const { subscriptions, totalAmount, isEmpty } = useWorkspaceData(activeWorkspaceTransactions);

  const cancellationCandidates = useMemo(() => {
    return subscriptions
      .filter(s => s.isDuplicate || (s.count > 1))
      .map(s => ({
        vendor: s.vendor,
        category: s.category,
        monthlyCost: s.totalAmount,
        chargeCount: s.count,
        annualSavings: s.totalAmount * 12,
        reason: s.isDuplicate ? 'Duplicate charges — possible redundant subscription' : `${s.count} charges — review for consolidation`,
      }))
      .sort((a, b) => b.annualSavings - a.annualSavings);
  }, [subscriptions]);

  const potentialAnnualSavings = cancellationCandidates.reduce((s, c) => s + c.annualSavings, 0);

  if (isEmpty) {
    return (
      <>
        <Text style={contentStyles.pageTitle}>Cancel duplicates</Text>
        <Text style={contentStyles.pageSubtitle}>
          Candidates to cancel and save. Add a statement to see them.
        </Text>
        <WorkspaceEmptyState activeWorkspaceId={activeWorkspaceId} />
      </>
    );
  }

  return (
    <>
      <Text style={contentStyles.pageTitle}>Cancel duplicates</Text>
      <Text style={contentStyles.pageSubtitle}>
        Companies that charged you more than once — cancel the extra and save.
      </Text>

      <View style={contentStyles.kpiRow}>
        <View style={[contentStyles.kpiItem, contentStyles.kpiItemFirst]}>
          <View style={styles.kpiCard}>
            <Feather name="dollar-sign" size={22} color="#22c55e" />
            <Text style={styles.kpiValue}>${(potentialAnnualSavings / 1000).toFixed(1)}K</Text>
            <Text style={[styles.kpiLabel, { color: '#22c55e' }]}>Annual savings</Text>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={styles.kpiCard}>
            <Feather name="x-circle" size={22} color="#ef4444" />
            <Text style={styles.kpiValue}>{cancellationCandidates.length}</Text>
            <Text style={styles.kpiLabel}>Duplicates</Text>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={styles.kpiCard}>
            <Feather name="layers" size={22} color="#3b82f6" />
            <Text style={styles.kpiValue}>{subscriptions.length}</Text>
            <Text style={styles.kpiLabel}>Total vendors</Text>
          </View>
        </View>
      </View>

      <View style={contentStyles.card}>
        <Text style={contentStyles.cardTitle}>Cancellation queue</Text>
        <Text style={contentStyles.cardSubtitle}>
          Vendors charged multiple times this period
        </Text>

        {cancellationCandidates.length === 0 ? (
          <View style={styles.emptyQueue}>
            <Feather name="check-circle" size={32} color={Colors.success} />
            <Text style={styles.emptyQueueText}>No duplicate vendors in this view.</Text>
          </View>
        ) : (
          cancellationCandidates.map((item, i) => (
            <View key={i} style={styles.queueItem}>
              <View style={styles.queueItemHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.queueVendor}>{item.vendor}</Text>
                  <Text style={styles.queueCategory}>{item.category}</Text>
                </View>
                <StatusPill label="Duplicate" variant="priceAlert" />
              </View>
              <View style={styles.queueStats}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Charges</Text>
                  <Text style={styles.statValue}>{item.chargeCount}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Monthly cost</Text>
                  <Text style={styles.statValue}>${item.monthlyCost.toLocaleString()}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Annual savings</Text>
                  <Text style={[styles.statValue, styles.savingsColor]}>${item.annualSavings.toLocaleString()}</Text>
                </View>
              </View>
              <View style={styles.warningBox}>
                <Feather name="alert-triangle" size={16} color="#eab308" />
                <Text style={styles.warningText}>{item.reason}</Text>
              </View>
              <Pressable style={styles.outlineBtn}>
                <Feather name="send" size={14} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.outlineBtnText}>Draft cancellation email</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  kpiCard: {
    padding: isNative ? 16 : 20,
    borderRadius: isNative ? 12 : 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  kpiValue: { fontSize: isNative ? 24 : 26, fontWeight: '700', color: Colors.text, marginTop: 10, marginBottom: 4 },
  kpiLabel: { fontSize: 12, color: Colors.textSecondary },
  emptyQueue: { alignItems: 'center', padding: isNative ? 32 : 40 },
  emptyQueueText: { fontSize: 15, color: Colors.text, marginTop: 16 },
  queueItem: {
    padding: isNative ? 14 : 20,
    borderRadius: 12,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 16,
  },
  queueItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  queueVendor: { fontSize: isNative ? 16 : 18, fontWeight: '700', color: Colors.text },
  queueCategory: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  queueStats: { marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  statLabel: { fontSize: 13, color: Colors.textSecondary },
  statValue: { fontSize: 13, fontWeight: '600', color: Colors.text },
  savingsColor: { color: '#22c55e' },
  warningBox: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, backgroundColor: 'rgba(234, 179, 8, 0.1)', marginBottom: 14 },
  warningText: { fontSize: 13, color: '#eab308', marginLeft: 8, flex: 1 },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: isNative ? 12 : 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary, alignSelf: 'flex-start' },
  outlineBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
