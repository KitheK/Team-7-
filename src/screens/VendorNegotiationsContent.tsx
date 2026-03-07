import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Linking, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';
import StatusPill from '../components/StatusPill';
import ScheduleAICallModal from '../components/ScheduleAICallModal';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import { useWorkspace } from '../context/WorkspaceContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';

function draftNegotiationEmail(vendor: string, currentCost: number, targetCost: number, strategy: string): string {
  const body = `Subject: Contract renewal discussion – ${vendor}

Hi,

We're reaching out ahead of our renewal to discuss pricing and terms.

Current spend: $${currentCost.toLocaleString()}/mo
Target: $${targetCost.toLocaleString()}/mo

Our approach: ${strategy}

Please let us know a convenient time for a call.

Best regards`;
  return body;
}

export default function VendorNegotiationsContent() {
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduleVendor, setScheduleVendor] = useState('');

  const { activeWorkspaceTransactions, activeWorkspaceId } = useWorkspace();
  const { subscriptions, priceCreepSignals, totalAmount, isEmpty } = useWorkspaceData(activeWorkspaceTransactions);

  const negotiationCandidates = useMemo(() => {
    const highSpend = subscriptions.filter(s => s.totalAmount >= 2000).slice(0, 6);
    const fromCreep = priceCreepSignals.map(p => ({
      vendor: p.vendor,
      category: subscriptions.find(s => s.vendor === p.vendor)?.category ?? 'Other',
      currentCost: p.totalAmount,
      targetCost: Math.round(p.totalAmount * 0.88),
      potentialSavings: Math.round(p.totalAmount * 0.12),
      strategy: p.count > 1 ? 'Consolidate duplicate charges or renegotiate single contract.' : 'Review rate increase and negotiate discount.',
      isFromCreep: true,
    }));
    const fromHigh = highSpend
      .filter(s => !fromCreep.some(c => c.vendor === s.vendor))
      .map(s => ({
        vendor: s.vendor,
        category: s.category,
        currentCost: s.totalAmount,
        targetCost: Math.round(s.totalAmount * 0.9),
        potentialSavings: Math.round(s.totalAmount * 0.1),
        strategy: 'Volume or annual commitment for better rate.',
        isFromCreep: false,
      }));
    return [...fromCreep, ...fromHigh].slice(0, 8);
  }, [subscriptions, priceCreepSignals]);

  const handleScheduleAICall = (vendor?: string) => {
    setScheduleVendor(vendor ?? '');
    setScheduleModalVisible(true);
  };

  const handleDraftEmail = (vendor: string, currentCost: number, targetCost: number, strategy: string) => {
    const body = draftNegotiationEmail(vendor, currentCost, targetCost, strategy);
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(body);
      Alert.alert('Copied', 'Negotiation email draft copied to clipboard.');
    } else {
      Linking.openURL(`mailto:?body=${encodeURIComponent(body)}`);
    }
  };

  if (isEmpty) {
    return (
      <>
      <Text style={contentStyles.pageTitle}>Negotiate & save</Text>
      <Text style={contentStyles.pageSubtitle}>
        Companies where you might save by asking for a better rate or cancelling a duplicate. Add a statement to see suggestions.
      </Text>
        <WorkspaceEmptyState activeWorkspaceId={activeWorkspaceId} />
      </>
    );
  }

  return (
    <>
      <Text style={contentStyles.pageTitle}>Negotiate & save</Text>
      <Text style={contentStyles.pageSubtitle}>
        We highlight where you might save — by renegotiating or cancelling a duplicate charge.
      </Text>

      <View style={contentStyles.kpiRow}>
        <View style={[contentStyles.kpiItem, contentStyles.kpiItemFirst]}>
          <View style={styles.kpiCard}>
            <Feather name="phone-call" size={22} color="#3b82f6" />
            <Text style={styles.kpiValue}>{negotiationCandidates.length}</Text>
            <Text style={styles.kpiLabel}>Negotiation candidates</Text>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={styles.kpiCard}>
            <Feather name="dollar-sign" size={22} color="#22c55e" />
            <Text style={styles.kpiValue}>
              ${negotiationCandidates.reduce((s, n) => s + n.potentialSavings, 0).toLocaleString()}
            </Text>
            <Text style={[styles.kpiLabel, { color: '#22c55e' }]}>Potential savings/mo</Text>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={styles.kpiCard}>
            <Feather name="trending-up" size={22} color="#14b8a6" />
            <Text style={styles.kpiValue}>${(totalAmount / 1000).toFixed(1)}K</Text>
            <Text style={styles.kpiLabel}>Total spend in view</Text>
          </View>
        </View>
      </View>

      <View style={styles.headerRow}>
        <View>
          <Text style={contentStyles.cardTitle}>Negotiation pipeline</Text>
          <Text style={contentStyles.cardSubtitle}>High-spend and duplicate-charge vendors — schedule AI call or draft email</Text>
        </View>
        <Pressable style={styles.primaryBtn} onPress={() => handleScheduleAICall()}>
          <Feather name="phone-call" size={16} color={Colors.primary} />
          <Text style={styles.primaryBtnText}>Schedule AI call</Text>
        </Pressable>
      </View>

      {negotiationCandidates.length === 0 ? (
        <View style={contentStyles.card}>
          <Text style={styles.noCandidates}>No high-spend or duplicate vendors in this view. Upload more data or switch workspace.</Text>
        </View>
      ) : (
        negotiationCandidates.map((n, i) => (
          <View key={i} style={contentStyles.card}>
            <View style={styles.negHeader}>
              <View>
                <Text style={styles.negVendor}>{n.vendor}</Text>
                <Text style={styles.negCategory}>{n.category}</Text>
              </View>
              <StatusPill
                label={n.isFromCreep ? 'Duplicate / variance' : 'High spend'}
                variant={n.isFromCreep ? 'priceAlert' : 'inProgress'}
              />
            </View>
            <View style={styles.negGrid}>
              <View style={styles.negGridItem}>
                <Text style={styles.negLabel}>Current cost</Text>
                <Text style={styles.negNum}>${n.currentCost.toLocaleString()}</Text>
              </View>
              <View style={styles.negGridItem}>
                <Text style={styles.negLabel}>Target cost</Text>
                <Text style={[styles.negNum, { color: '#22c55e' }]}>${n.targetCost.toLocaleString()}</Text>
              </View>
              <View style={styles.negGridItem}>
                <Text style={styles.negLabel}>Potential savings</Text>
                <Text style={[styles.negNum, styles.savings]}>${n.potentialSavings.toLocaleString()}/mo</Text>
              </View>
            </View>
            <View style={styles.stageBox}>
              <Text style={styles.stageStrategy}>Strategy: {n.strategy}</Text>
            </View>
            <View style={styles.negActions}>
              <Pressable style={styles.outlineBtn} onPress={() => handleDraftEmail(n.vendor, n.currentCost, n.targetCost, n.strategy)}>
                <Feather name="mail" size={14} color={Colors.primary} />
                <Text style={styles.outlineBtnText}>Draft email</Text>
              </Pressable>
              <Pressable style={[styles.outlineBtn, styles.primaryOutlineBtn]} onPress={() => handleScheduleAICall(n.vendor)}>
                <Feather name="phone-call" size={14} color={Colors.primary} />
                <Text style={styles.outlineBtnText}>Schedule AI call</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      <ScheduleAICallModal
        visible={scheduleModalVisible}
        onClose={() => setScheduleModalVisible(false)}
        vendorName={scheduleVendor}
      />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  noCandidates: {
    fontSize: 14,
    color: Colors.textSecondary,
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
  stageBox: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: Colors.inputBg,
    marginBottom: 14,
  },
  stageStrategy: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  negActions: {
    flexDirection: 'row',
    gap: 10,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  primaryOutlineBtn: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
