import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';
import StatusPill from '../components/StatusPill';
import {
  negotiationsKpis,
  negotiationActivity,
  activeNegotiations,
} from '../constants/dummyData';

export default function VendorNegotiationsContent() {
  return (
    <>
      <Text style={contentStyles.pageTitle}>Vendor Negotiations</Text>
      <Text style={contentStyles.pageSubtitle}>
        AI-powered automated negotiations with your vendors.
      </Text>

      <View style={contentStyles.kpiRow}>
        <View style={[contentStyles.kpiItem, contentStyles.kpiItemFirst]}>
          <View style={[styles.kpiCard, styles.kpiActive]}>
            <Feather name="phone-call" size={22} color="#3b82f6" />
            <Text style={styles.kpiValue}>{negotiationsKpis.active}</Text>
            <Text style={styles.kpiLabel}>In progress now</Text>
            <View style={styles.miniBar}>
              <View style={[styles.miniBarFill, { width: '60%', backgroundColor: '#3b82f6' }]} />
            </View>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={[styles.kpiCard, styles.kpiSaved]}>
            <Feather name="dollar-sign" size={22} color="#22c55e" />
            <Text style={styles.kpiValue}>${negotiationsKpis.totalSaved.toLocaleString()}</Text>
            <Text style={[styles.kpiLabel, { color: '#22c55e' }]}>From completed deals</Text>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={[styles.kpiCard, styles.kpiRate]}>
            <Feather name="trending-up" size={22} color="#14b8a6" />
            <Text style={styles.kpiValue}>{negotiationsKpis.successRate}%</Text>
            <Text style={[styles.kpiLabel, { color: '#14b8a6' }]}>Last 30 days</Text>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={[styles.kpiCard, styles.kpiDuration]}>
            <Feather name="clock" size={22} color="#f59e0b" />
            <Text style={styles.kpiValue}>{negotiationsKpis.avgDuration}</Text>
            <Text style={[styles.kpiLabel, { color: '#f59e0b' }]}>Days to complete</Text>
          </View>
        </View>
      </View>

      <View style={contentStyles.card}>
        <Text style={contentStyles.cardTitle}>Negotiation Activity</Text>
        <Text style={contentStyles.cardSubtitle}>6-month performance overview</Text>
        <View style={styles.activityGrid}>
          {negotiationActivity.map((m) => (
            <View key={m.month} style={styles.activityCell}>
              <Text style={styles.activityMonth}>{m.month}</Text>
              <Text style={styles.activityVal}>Started {m.started}</Text>
              <Text style={[styles.activityVal, { color: '#22c55e' }]}>Done {m.done}</Text>
              <Text style={[styles.activityVal, { color: '#3b82f6' }]}>Won {m.won}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.headerRow}>
        <View>
          <Text style={contentStyles.cardTitle}>Active & Recent Negotiations</Text>
          <Text style={contentStyles.cardSubtitle}>AI-driven vendor negotiation pipeline</Text>
        </View>
        <Pressable style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>+ Start New Negotiation</Text>
        </Pressable>
      </View>

      {activeNegotiations.map((n, i) => (
        <View key={i} style={contentStyles.card}>
          <View style={styles.negHeader}>
            <View>
              <Text style={styles.negVendor}>{n.vendor}</Text>
              <Text style={styles.negCategory}>{n.category}</Text>
            </View>
            <StatusPill
              label={n.status}
              variant={n.status === 'In Progress' ? 'inProgress' : 'pending'}
            />
          </View>
          <View style={styles.negGrid}>
            <View style={styles.negGridItem}>
              <Text style={styles.negLabel}>Current Cost</Text>
              <Text style={styles.negNum}>${n.currentCost.toLocaleString()}</Text>
            </View>
            <View style={styles.negGridItem}>
              <Text style={styles.negLabel}>Target Cost</Text>
              <Text style={[styles.negNum, { color: '#22c55e' }]}>${n.targetCost.toLocaleString()}</Text>
            </View>
            <View style={styles.negGridItem}>
              <Text style={styles.negLabel}>AI Calls</Text>
              <Text style={styles.negNum}>{n.status === 'In Progress' ? '3 completed' : '0 completed'}</Text>
            </View>
            <View style={styles.negGridItem}>
              <Text style={styles.negLabel}>Potential Savings</Text>
              <Text style={[styles.negNum, styles.savings]}>${n.potentialSavings.toLocaleString()}/mo</Text>
            </View>
          </View>
          <View style={styles.confidenceBar}>
            <View style={[styles.confidenceFill, { width: `${n.confidence}%` }]} />
          </View>
          <View style={styles.stageBox}>
            <Text style={styles.stageTitle}>Current Stage: {n.stage}</Text>
            <Text style={styles.stageStrategy}>Strategy: {n.strategy}</Text>
          </View>
          <View style={styles.negFooter}>
            <Text style={styles.footerText}>Last updated: {n.lastUpdated}</Text>
            <Text style={styles.footerText}>
              <Feather name="calendar" size={12} color={Colors.textTertiary} /> Next call: {n.nextCall}
            </Text>
          </View>
          <View style={styles.negActions}>
            {n.status === 'In Progress' && (
              <Pressable style={[styles.outlineBtn, { marginRight: 10 }]}>
                <Text style={styles.outlineBtnText}>Pause</Text>
              </Pressable>
            )}
            <Pressable style={styles.outlineBtn}>
              <Text style={styles.outlineBtnText}>{n.status === 'Pending' ? 'Start Negotiation' : 'View Details'}</Text>
            </Pressable>
          </View>
        </View>
      ))}
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
  kpiActive: {},
  kpiSaved: {},
  kpiRate: {},
  kpiDuration: {},
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
  miniBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.inputBg,
    marginTop: 10,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  activityGrid: {
    flexDirection: 'row',
  },
  activityCell: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 8,
  },
  activityMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  activityVal: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  primaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  negHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  negVendor: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  negCategory: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  negGrid: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  negGridItem: {
    flex: 1,
    marginRight: 12,
  },
  negLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  negNum: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  savings: { color: '#22c55e' },
  confidenceBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.inputBg,
    marginBottom: 16,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  stageBox: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: Colors.inputBg,
    marginBottom: 12,
  },
  stageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  stageStrategy: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  negFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  negActions: {
    flexDirection: 'row',
  },
  outlineBtn: {
    paddingHorizontal: 16,
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
