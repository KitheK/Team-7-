import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Linking, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import { getContentStyles } from '../constants/contentStyles';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import ScheduleAICallModal from '../components/ScheduleAICallModal';
import { useWorkspace } from '../context/WorkspaceContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

type AlertRow = {
  vendor: string;
  amount: number;
  count: number;
  message: string;
  category: string;
  isDuplicate: boolean;
  isPriceCreep: boolean;
};

export default function AlertsContent() {
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [callVendor, setCallVendor] = useState('');
  const c = useColors();
  const cs = useMemo(() => getContentStyles(c), [c]);
  const s = useMemo(() => createStyles(c), [c]);

  const { activeWorkspaceTransactions, activeWorkspaceId, workspaces } = useWorkspace();
  const { subscriptions, priceCreepSignals, isEmpty } = useWorkspaceData(activeWorkspaceTransactions);
  const resolvedWorkspaceId = activeWorkspaceId === 'all' ? (workspaces[0]?.id ?? null) : activeWorkspaceId;

  const duplicates = useMemo(() => subscriptions.filter(sub => sub.isDuplicate).sort((a, b) => b.totalAmount - a.totalAmount), [subscriptions]);
  const annualSavings = useMemo(() => duplicates.reduce((sum, d) => sum + d.totalAmount * 12, 0), [duplicates]);

  const alerts = useMemo(() => {
    const byVendor = new Map<string, AlertRow>();
    for (const d of duplicates) {
      byVendor.set(d.vendor, {
        vendor: d.vendor,
        amount: d.totalAmount,
        count: d.count,
        message: `Charged ${d.count} times this period`,
        category: d.category,
        isDuplicate: true,
        isPriceCreep: false,
      });
    }
    for (const p of priceCreepSignals) {
      const existing = byVendor.get(p.vendor);
      if (existing) {
        existing.isPriceCreep = true;
        existing.message = existing.message + (p.message ? ` · ${p.message}` : '');
      } else {
        byVendor.set(p.vendor, {
          vendor: p.vendor,
          amount: p.totalAmount,
          count: p.count,
          message: p.message,
          category: 'Other',
          isDuplicate: false,
          isPriceCreep: true,
        });
      }
    }
    return Array.from(byVendor.values()).sort((a, b) => b.amount - a.amount);
  }, [duplicates, priceCreepSignals]);

  if (isEmpty) {
    return (
      <>
        <Text style={cs.pageTitle}>Alerts</Text>
        <Text style={cs.pageSubtitle}>We flag duplicates, price increases, and anything that looks off.</Text>
        <WorkspaceEmptyState activeWorkspaceId={activeWorkspaceId} />
      </>
    );
  }

  const handleDraftEmail = (vendor: string, amount: number) => {
    const body = `Subject: Account review — ${vendor}\n\nHi,\n\nI'd like to review charges for ${vendor}. I noticed spend totaling $${amount.toLocaleString()} and want to discuss adjustments or consolidation.\n\nPlease let me know a convenient time for a call.\n\nBest regards`;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(body);
      Alert.alert('Copied', 'Negotiation email copied to clipboard.');
    } else {
      Linking.openURL(`mailto:?body=${encodeURIComponent(body)}`);
    }
  };

  const handleScheduleCall = (vendor: string) => {
    setCallVendor(vendor);
    setCallModalVisible(true);
  };

  return (
    <>
      <Text style={cs.pageTitle}>Alerts</Text>
      <Text style={cs.pageSubtitle}>Vendors with duplicate charges or price changes — one list.</Text>

      <View style={s.summaryRow}>
        <View style={[s.summaryCard, { borderLeftColor: c.warning }]}>
          <Text style={s.summaryValue}>{alerts.length}</Text>
          <Text style={s.summaryLabel}>Vendors with issues</Text>
        </View>
        <View style={[s.summaryCard, { borderLeftColor: c.success }]}>
          <Text style={s.summaryValue}>${(annualSavings / 1000).toFixed(1)}K</Text>
          <Text style={s.summaryLabel}>Potential annual savings</Text>
        </View>
      </View>

      {alerts.length === 0 ? (
        <View style={s.allClear}>
          <Feather name="check-circle" size={36} color={c.success} />
          <Text style={s.allClearTitle}>All clear!</Text>
          <Text style={s.allClearText}>No duplicate or price issues in this period.</Text>
        </View>
      ) : (
        <View style={cs.card}>
          {alerts.map((alert, i) => {
            const expanded = expandedVendor === alert.vendor;
            const hasBoth = alert.isDuplicate && alert.isPriceCreep;
            return (
              <Pressable
                key={alert.vendor}
                style={[s.alertRow, i < alerts.length - 1 && s.alertRowBorder]}
                onPress={() => setExpandedVendor(expanded ? null : alert.vendor)}
              >
                <View style={s.alertMain}>
                  <View style={[s.alertIcon, { backgroundColor: hasBoth ? c.warningLight : alert.isDuplicate ? c.warningLight : c.dangerLight }]}>
                    <Feather
                      name={hasBoth ? 'alert-triangle' : alert.isDuplicate ? 'copy' : 'trending-up'}
                      size={16}
                      color={hasBoth ? c.warning : alert.isDuplicate ? c.warning : c.danger}
                    />
                  </View>
                  <View style={s.alertInfo}>
                    <Text style={s.alertVendor} numberOfLines={1}>{alert.vendor}</Text>
                    <Text style={s.alertMessage} numberOfLines={1}>{alert.message}</Text>
                  </View>
                  <View style={s.alertRight}>
                    <Text style={s.alertAmount}>${alert.amount.toLocaleString()}</Text>
                    <View style={s.badgeRow}>
                      {alert.isDuplicate && (
                        <View style={[s.alertBadge, { backgroundColor: c.warningLight }]}>
                          <Text style={[s.alertBadgeText, { color: c.warning }]}>Duplicate</Text>
                        </View>
                      )}
                      {alert.isPriceCreep && (
                        <View style={[s.alertBadge, { backgroundColor: c.dangerLight }]}>
                          <Text style={[s.alertBadgeText, { color: c.danger }]}>Price change</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                {expanded && (
                  <View style={s.expanded}>
                    <View style={s.expandedStats}>
                      <View>
                        <Text style={s.expandedLabel}>Charges</Text>
                        <Text style={s.expandedValue}>{alert.count}</Text>
                      </View>
                      <View>
                        <Text style={s.expandedLabel}>Total</Text>
                        <Text style={s.expandedValue}>${alert.amount.toLocaleString()}</Text>
                      </View>
                      <View>
                        <Text style={s.expandedLabel}>Annual impact</Text>
                        <Text style={[s.expandedValue, { color: c.danger }]}>${(alert.amount * 12).toLocaleString()}</Text>
                      </View>
                    </View>
                    <View style={s.actionRow}>
                      <Pressable style={s.actionBtn} onPress={() => handleDraftEmail(alert.vendor, alert.amount)}>
                        <Feather name="mail" size={14} color={c.primary} />
                        <Text style={s.actionBtnText}>Draft email</Text>
                      </Pressable>
                      <Pressable style={[s.actionBtn, s.actionBtnFilled]} onPress={() => handleScheduleCall(alert.vendor)}>
                        <Feather name="phone-call" size={14} color="#fff" />
                        <Text style={s.actionBtnFilledText}>AI call</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      <ScheduleAICallModal
        visible={callModalVisible}
        onClose={() => setCallModalVisible(false)}
        vendorName={callVendor}
        workspaceId={resolvedWorkspaceId}
      />
    </>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    summaryRow: { flexDirection: isNative ? 'column' : 'row', gap: 12, marginBottom: 20 },
    summaryCard: { flex: isNative ? 0 : 1, backgroundColor: c.card, borderRadius: 12, padding: isNative ? 14 : 16, borderWidth: 1, borderColor: c.cardBorder, borderLeftWidth: 3 },
    summaryValue: { fontSize: isNative ? 20 : 22, fontWeight: '700', color: c.text, marginBottom: 2 },
    summaryLabel: { fontSize: 12, color: c.textSecondary },
    allClear: { alignItems: 'center', padding: 48, backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.cardBorder },
    allClearTitle: { fontSize: 17, fontWeight: '600', color: c.text, marginTop: 14, marginBottom: 4 },
    allClearText: { fontSize: 13, color: c.textSecondary },
    alertRow: { paddingVertical: 12, paddingHorizontal: isNative ? 0 : 8, borderRadius: 8 },
    alertRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
    alertMain: { flexDirection: 'row', alignItems: 'center' },
    alertIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    alertInfo: { flex: 1, minWidth: 0, marginRight: 12 },
    alertVendor: { fontSize: 14, fontWeight: '600', color: c.text },
    alertMessage: { fontSize: 12, color: c.textTertiary, marginTop: 2 },
    alertRight: { alignItems: 'flex-end' },
    alertAmount: { fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 4 },
    badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' },
    alertBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    alertBadgeText: { fontSize: 11, fontWeight: '600' },
    expanded: { marginTop: 12, marginLeft: 48, padding: 14, backgroundColor: c.inputBg, borderRadius: 10, borderWidth: 1, borderColor: c.border },
    expandedStats: { flexDirection: 'row', gap: 24, marginBottom: 14 },
    expandedLabel: { fontSize: 11, color: c.textTertiary, marginBottom: 2 },
    expandedValue: { fontSize: 15, fontWeight: '600', color: c.text },
    actionRow: { flexDirection: 'row', gap: 8 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: c.primary },
    actionBtnText: { fontSize: 13, fontWeight: '600', color: c.primary },
    actionBtnFilled: { backgroundColor: c.primary, borderColor: c.primary },
    actionBtnFilledText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  });
}
