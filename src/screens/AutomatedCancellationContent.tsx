import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';
import StatusPill from '../components/StatusPill';
import { cancellationKpis, cancellationQueue } from '../constants/dummyData';

export default function AutomatedCancellationContent() {
  return (
    <>
      <Text style={contentStyles.pageTitle}>Automated Cancellation</Text>
      <Text style={contentStyles.pageSubtitle}>
        AI-powered detection and cancellation of unused licenses and subscriptions.
      </Text>

      <View style={contentStyles.kpiRow}>
        <View style={[contentStyles.kpiItem, contentStyles.kpiItemFirst]}>
          <View style={styles.kpiCard}>
            <Feather name="dollar-sign" size={22} color="#22c55e" />
            <Text style={styles.kpiValue}>${(cancellationKpis.potentialSavings / 1000).toFixed(1)}K</Text>
            <Text style={[styles.kpiLabel, { color: '#22c55e' }]}>Annual savings available</Text>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={styles.kpiCard}>
            <Feather name="x-circle" size={22} color="#ef4444" />
            <Text style={styles.kpiValue}>{cancellationKpis.readyToCancel}</Text>
            <Text style={[styles.kpiLabel, { color: '#ef4444' }]}>High confidence items</Text>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={styles.kpiCard}>
            <Feather name="users" size={22} color="#3b82f6" />
            <Text style={styles.kpiValue}>{cancellationKpis.inactiveUsers}</Text>
            <Text style={styles.kpiLabel}>90+ days no activity</Text>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={styles.kpiCard}>
            <Feather name="check-circle" size={22} color="#22c55e" />
            <Text style={styles.kpiValue}>${(cancellationKpis.savedThisMonth / 1000).toFixed(1)}K</Text>
            <Text style={[styles.kpiLabel, { color: '#22c55e' }]}>Saved from cancellations</Text>
          </View>
        </View>
      </View>

      <View style={contentStyles.card}>
        <View style={styles.queueHeader}>
          <View>
            <Text style={contentStyles.cardTitle}>Cancellation Queue</Text>
            <Text style={contentStyles.cardSubtitle}>Unused licenses detected by AI</Text>
          </View>
          <View style={styles.queueActions}>
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>All Status</Text>
              <Feather name="chevron-down" size={14} color={Colors.textSecondary} />
            </View>
            <Pressable style={styles.processBtn}>
              <Text style={styles.processBtnText}>Process All Ready</Text>
            </Pressable>
          </View>
        </View>

        {cancellationQueue.map((item, i) => (
          <View key={i} style={styles.queueItem}>
            <View style={styles.queueItemHeader}>
              <View>
                <Text style={styles.queueVendor}>{item.vendor}</Text>
                <Text style={styles.queueCategory}>{item.category}</Text>
              </View>
              <View style={styles.queueBadges}>
                <StatusPill label={item.status} variant="active" />
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{item.confidence}% confidence</Text>
                </View>
              </View>
            </View>
            <View style={styles.queueStats}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Unused Licenses</Text>
                <View style={styles.licenseBar}>
                  <View style={[styles.licenseBarUsed, { width: `${(item.unusedLicenses / item.totalLicenses) * 100}%` }]} />
                </View>
                <Text style={styles.statValue}>{item.unusedLicenses} of {item.totalLicenses}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Monthly Cost</Text>
                <Text style={styles.statValue}>${item.monthlyCost.toLocaleString()}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Days Inactive</Text>
                <Text style={styles.statValue}>{item.daysInactive} days</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Last Activity</Text>
                <Text style={styles.statValue}>{item.lastActivity}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Annual Savings</Text>
                <Text style={[styles.statValue, styles.savings]}>${item.annualSavings.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.warningBox}>
              <Feather name="alert-triangle" size={18} color="#eab308" />
              <Text style={styles.warningText}>Ready for automated cancellation</Text>
            </View>
            <View style={styles.queueItemActions}>
              <Pressable style={[styles.outlineBtn, { marginRight: 10 }]}>
                <Feather name="eye" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.outlineBtnText}>Review Users</Text>
              </Pressable>
              <Pressable style={styles.outlineBtn}>
                <Feather name="send" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.outlineBtnText}>Send Cancellation</Text>
              </Pressable>
            </View>
          </View>
        ))}
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
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  queueActions: {
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
  processBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  processBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  queueItem: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  queueItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  queueVendor: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  queueCategory: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  queueBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
  },
  queueStats: {
    marginBottom: 12,
  },
  stat: {
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  savings: { color: '#22c55e' },
  licenseBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.card,
    marginVertical: 4,
    overflow: 'hidden',
  },
  licenseBarUsed: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    marginBottom: 14,
  },
  warningText: {
    fontSize: 13,
    color: '#eab308',
    marginLeft: 8,
  },
  queueItemActions: {
    flexDirection: 'row',
    gap: 10,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
});
