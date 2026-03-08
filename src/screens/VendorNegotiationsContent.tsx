import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Linking, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';
import StatusPill from '../components/StatusPill';
import ScheduleAICallModal from '../components/ScheduleAICallModal';
import LiveTranscript from '../components/LiveTranscript';
import PostCallSummary from '../components/PostCallSummary';
import VendorPreferencesPanel from '../components/VendorPreferencesPanel';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import { useWorkspace } from '../context/WorkspaceContext';
import type { Negotiation } from '../context/WorkspaceContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { supabase } from '../../lib/supabase';

function draftNegotiationEmail(vendor: string, currentCost: number, targetCost: number, strategy: string): string {
  return `Subject: Contract renewal discussion – ${vendor}

Hi,

We're reaching out ahead of our renewal to discuss pricing and terms.

Current spend: $${currentCost.toLocaleString()}/mo
Target: $${targetCost.toLocaleString()}/mo

Our approach: ${strategy}

Please let us know a convenient time for a call.

Best regards`;
}

export default function VendorNegotiationsContent() {
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduleVendor, setScheduleVendor] = useState('');
  const [prefsVendor, setPrefsVendor] = useState<string | null>(null);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [activeTranscriptNeg, setActiveTranscriptNeg] = useState<Negotiation | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const { activeWorkspaceTransactions, activeWorkspaceId, workspaces } = useWorkspace();
  const { subscriptions, priceCreepSignals, totalAmount, isEmpty } = useWorkspaceData(activeWorkspaceTransactions);
  const resolvedWorkspaceId = activeWorkspaceId === 'all' ? (workspaces[0]?.id ?? null) : activeWorkspaceId;

  // Get current user ID
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id ?? null));
  }, []);

  // Fetch existing negotiations for this workspace
  const fetchNegotiations = useCallback(async () => {
    if (!supabase || !resolvedWorkspaceId) return;
    const { data } = await supabase
      .from('negotiations')
      .select('*')
      .eq('workspace_id', resolvedWorkspaceId)
      .order('created_at', { ascending: false });
    if (data) setNegotiations(data as Negotiation[]);
  }, [resolvedWorkspaceId]);

  useEffect(() => { fetchNegotiations(); }, [fetchNegotiations]);

  // Realtime subscription for negotiation updates
  useEffect(() => {
    if (!supabase || !resolvedWorkspaceId) return;

    const channel = supabase
      .channel(`negotiations-${resolvedWorkspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'negotiations',
          filter: `workspace_id=eq.${resolvedWorkspaceId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNegotiations(prev => [payload.new as Negotiation, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Negotiation;
            setNegotiations(prev => prev.map(n => n.id === updated.id ? updated : n));
            if (activeTranscriptNeg?.id === updated.id) {
              setActiveTranscriptNeg(updated);
            }
          }
        }
      )
      .subscribe();

    return () => { supabase!.removeChannel(channel); };
  }, [resolvedWorkspaceId, activeTranscriptNeg?.id]);

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

  const handleCallStarted = useCallback(async (negotiationId: string) => {
    if (!supabase) return;

    const { data } = await supabase
      .from('negotiations')
      .select('*')
      .eq('id', negotiationId)
      .single();

    if (data) {
      const startedNegotiation = data as Negotiation;
      setNegotiations(prev => {
        const existingIndex = prev.findIndex(n => n.id === startedNegotiation.id);
        if (existingIndex === -1) return [startedNegotiation, ...prev];

        const next = [...prev];
        next[existingIndex] = startedNegotiation;
        return next;
      });
      setActiveTranscriptNeg(startedNegotiation);
      return;
    }

    fetchNegotiations();
  }, [fetchNegotiations]);

  const handleDraftEmail = (vendor: string, currentCost: number, targetCost: number, strategy: string) => {
    const body = draftNegotiationEmail(vendor, currentCost, targetCost, strategy);
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(body);
      Alert.alert('Copied', 'Negotiation email draft copied to clipboard.');
    } else {
      Linking.openURL(`mailto:?body=${encodeURIComponent(body)}`);
    }
  };

  const activeNegotiations = negotiations.filter(n => n.status === 'calling');
  const completedNegotiations = negotiations.filter(n => n.status === 'completed' && n.outcome);

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
        AI-powered vendor negotiation — generate briefs, launch calls, and track savings in real time.
      </Text>

      {/* KPI row */}
      <View style={contentStyles.kpiRow}>
        <View style={[contentStyles.kpiItem, contentStyles.kpiItemFirst]}>
          <View style={styles.kpiCard}>
            <Feather name="phone-call" size={22} color="#3b82f6" />
            <Text style={styles.kpiValue}>{negotiationCandidates.length}</Text>
            <Text style={styles.kpiLabel}>Candidates</Text>
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
            <Feather name="activity" size={22} color="#7c3aed" />
            <Text style={styles.kpiValue}>{activeNegotiations.length}</Text>
            <Text style={[styles.kpiLabel, { color: '#7c3aed' }]}>Active calls</Text>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={styles.kpiCard}>
            <Feather name="trending-up" size={22} color="#14b8a6" />
            <Text style={styles.kpiValue}>${(totalAmount / 1000).toFixed(1)}K</Text>
            <Text style={styles.kpiLabel}>Total spend</Text>
          </View>
        </View>
      </View>

      {/* Live transcript for active calls */}
      {activeTranscriptNeg && (
        <LiveTranscript
          negotiation={activeTranscriptNeg}
          onClose={() => setActiveTranscriptNeg(null)}
        />
      )}

      {/* Active calls banner */}
      {activeNegotiations.length > 0 && !activeTranscriptNeg && (
        <View style={styles.activeBanner}>
          <View style={styles.activeBannerLeft}>
            <View style={styles.pulseDot} />
            <Text style={styles.activeBannerText}>
              {activeNegotiations.length} call{activeNegotiations.length > 1 ? 's' : ''} in progress
            </Text>
          </View>
          <Pressable
            style={styles.viewCallBtn}
            onPress={() => setActiveTranscriptNeg(activeNegotiations[0])}
          >
            <Text style={styles.viewCallBtnText}>View live</Text>
          </Pressable>
        </View>
      )}

      {/* Completed negotiations with outcomes */}
      {completedNegotiations.length > 0 && (
        <>
          <Text style={[contentStyles.cardTitle, { marginBottom: 12 }]}>Recent results</Text>
          {completedNegotiations.slice(0, 3).map(neg => (
            <PostCallSummary
              key={neg.id}
              negotiation={neg}
              onViewTranscript={() => setActiveTranscriptNeg(neg)}
            />
          ))}
        </>
      )}

      {/* Vendor preferences panel */}
      {prefsVendor && userId && (
        <VendorPreferencesPanel
          vendorName={prefsVendor}
          userId={userId}
          onClose={() => setPrefsVendor(null)}
        />
      )}

      {/* Negotiation pipeline header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={contentStyles.cardTitle}>Negotiation pipeline</Text>
          <Text style={contentStyles.cardSubtitle}>High-spend and duplicate-charge vendors</Text>
        </View>
        <Pressable style={styles.primaryBtn} onPress={() => handleScheduleAICall()}>
          <Feather name="phone-call" size={16} color={Colors.primary} />
          <Text style={styles.primaryBtnText}>Start AI call</Text>
        </Pressable>
      </View>

      {/* Vendor cards */}
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
              <Pressable style={styles.outlineBtn} onPress={() => setPrefsVendor(n.vendor)}>
                <Feather name="settings" size={14} color={Colors.textSecondary} />
                <Text style={[styles.outlineBtnText, { color: Colors.textSecondary }]}>Preferences</Text>
              </Pressable>
              <Pressable style={styles.outlineBtn} onPress={() => handleDraftEmail(n.vendor, n.currentCost, n.targetCost, n.strategy)}>
                <Feather name="mail" size={14} color={Colors.primary} />
                <Text style={styles.outlineBtnText}>Draft email</Text>
              </Pressable>
              <Pressable style={[styles.outlineBtn, styles.primaryOutlineBtn]} onPress={() => handleScheduleAICall(n.vendor)}>
                <Feather name="phone-call" size={14} color={Colors.primary} />
                <Text style={styles.outlineBtnText}>Start AI call</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      <ScheduleAICallModal
        visible={scheduleModalVisible}
        onClose={() => setScheduleModalVisible(false)}
        vendorName={scheduleVendor}
        workspaceId={resolvedWorkspaceId}
        onCallStarted={handleCallStarted}
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
  activeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.15)',
    marginBottom: 24,
  },
  activeBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.danger },
  activeBannerText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  viewCallBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.danger,
  },
  viewCallBtnText: { fontSize: 13, fontWeight: '600', color: Colors.white },
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
    backgroundColor: 'rgba(30, 64, 175, 0.04)',
  },
});
