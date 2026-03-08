import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Linking, Animated, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import { getContentStyles } from '../constants/contentStyles';
import Typography from '../components/ui/Typography';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import ScheduleAICallModal from '../components/ScheduleAICallModal';
import { useWorkspace } from '../context/WorkspaceContext';
import type { Opportunity } from '../types/opportunity';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

function buildCancellationEmailBody(
  companyOrService: string,
  category: string,
  monthlyAmount: number,
  chargeCount: number
): string {
  const period = chargeCount > 1 ? ` (${chargeCount} charges in this period)` : '';
  return `Hello,

I am writing to request cancellation of my ${companyOrService} subscription${period}.

${category ? `This is for the ${category} plan. ` : ''}${monthlyAmount > 0 ? `My current plan is billed at $${monthlyAmount.toLocaleString()}/month. ` : ''}I would like to cancel effective at the end of my current billing period (or as soon as your process allows).

Please confirm once the cancellation has been processed and let me know if any further steps are required on my side.

Thank you,
[Your name]`;
}

type AlertRow = {
  vendor: string;
  amount: number;
  count: number;
  message: string;
  category: string;
  isDuplicate: boolean;
  isPriceCreep: boolean;
};

function RewardFlash({ active, color }: { active: boolean; color: string }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      scale.setValue(0.3);
      opacity.setValue(0.7);
      Animated.parallel([
        Animated.timing(scale, { toValue: 2.2, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [active]);

  if (!active) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', top: -10, left: -10, right: -10, bottom: -10,
        borderRadius: 999, borderWidth: 3, borderColor: color,
        transform: [{ scale }], opacity,
      }}
    />
  );
}

export default function AlertsContent() {
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [callVendor, setCallVendor] = useState('');
  const [callAnnualSpend, setCallAnnualSpend] = useState<number | undefined>(undefined);
  const [hoveredVendor, setHoveredVendor] = useState<string | null>(null);
  const [justSecured, setJustSecured] = useState<string | null>(null);
  const c = useColors();
  const cs = useMemo(() => getContentStyles(c), [c]);
  const s = useMemo(() => createStyles(c), [c]);

  const {
    activeWorkspaceId,
    workspaces,
    opportunities,
    opportunitySummary,
    updateOpportunityStatus,
    refreshAnalytics,
  } = useWorkspace();

  const resolvedWorkspaceId = activeWorkspaceId === 'all' ? (workspaces[0]?.id ?? null) : activeWorkspaceId;

  const cancellationQueue = useMemo(
    () => opportunities.filter(o => o.type === 'email_cancellation')
      .sort((a, b) => {
        const aResolved = a.status === 'resolved' ? 1 : 0;
        const bResolved = b.status === 'resolved' ? 1 : 0;
        return aResolved - bResolved || b.estimated_annual_savings - a.estimated_annual_savings;
      }),
    [opportunities]
  );

  const negotiationQueue = useMemo(
    () => opportunities.filter(o => o.type === 'ai_negotiation')
      .sort((a, b) => {
        const aDone = ['ai_call_started', 'ai_call_completed', 'resolved'].includes(a.status) ? 1 : 0;
        const bDone = ['ai_call_started', 'ai_call_completed', 'resolved'].includes(b.status) ? 1 : 0;
        return aDone - bDone || b.estimated_annual_savings - a.estimated_annual_savings;
      }),
    [opportunities]
  );

  const totalCancellable = useMemo(
    () => cancellationQueue.reduce((sum, o) => sum + o.estimated_annual_savings, 0),
    [cancellationQueue]
  );
  const securedCancelSavings = useMemo(
    () => cancellationQueue.filter(o => o.status === 'resolved').reduce((sum, o) => sum + o.secured_annual_savings, 0),
    [cancellationQueue]
  );
  const totalNegotiable = useMemo(
    () => negotiationQueue.reduce((sum, o) => sum + o.estimated_annual_savings, 0),
    [negotiationQueue]
  );
  const negotiatedSavings = useMemo(
    () => negotiationQueue.filter(o => o.status === 'resolved').reduce((sum, o) => sum + o.secured_annual_savings, 0),
    [negotiationQueue]
  );

  const cancelProgress = totalCancellable > 0 ? securedCancelSavings / totalCancellable : 0;
  const negotiateProgress = totalNegotiable > 0 ? negotiatedSavings / totalNegotiable : 0;

  const hasOpportunities = cancellationQueue.length > 0 || negotiationQueue.length > 0;

  if (!hasOpportunities && opportunities.length === 0) {
    return (
      <>
        <Typography variant="display">Savings</Typography>
        <Typography variant="body" tone="secondary" style={{ marginBottom: 20, maxWidth: 540 }}>
          Upload spending data and refresh analytics to discover savings opportunities.
        </Typography>
        <Pressable
          onPress={refreshAnalytics}
          style={({ pressed }) => [s.refreshBtn, pressed && s.pressDown]}
        >
          <Feather name="refresh-cw" size={14} color={c.white} />
          <Text style={s.refreshBtnText}>Refresh analytics</Text>
        </Pressable>
        <WorkspaceEmptyState activeWorkspaceId={activeWorkspaceId} />
      </>
    );
  }

  const handleDraftEmail = async (opp: Opportunity) => {
    const body = `Subject: Account review — ${opp.vendor_name}\n\nHi,\n\nI'd like to review charges for ${opp.vendor_name}. I noticed spend totaling $${Math.round(opp.annualized_spend).toLocaleString()}/yr and want to discuss adjustments or cancellation.\n\nPlease let me know a convenient time for a call.\n\nBest regards`;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(body);
      Alert.alert('Copied', 'Email draft copied to clipboard.');
    } else {
      Linking.openURL(`mailto:?body=${encodeURIComponent(body)}`);
    }
    if (opp.status === 'recommended' || opp.status === 'detected') {
      await updateOpportunityStatus(opp.id, 'email_drafted');
    }
  };

  const handleMarkSecured = async (opp: Opportunity) => {
    await updateOpportunityStatus(opp.id, 'resolved', opp.estimated_annual_savings);
    setJustSecured(opp.id);
    setTimeout(() => setJustSecured(null), 600);
  };

  const handleScheduleCall = (opp: Opportunity) => {
    setCallVendor(opp.vendor_name);
    setCallAnnualSpend(opp.annualized_spend);
    setCallModalVisible(true);
  };

  const isResolved = (o: Opportunity) => o.status === 'resolved';
  const isCallStarted = (o: Opportunity) =>
    ['ai_call_started', 'ai_call_completed', 'resolved'].includes(o.status);

  const statusLabel = (o: Opportunity): string => {
    switch (o.status) {
      case 'email_drafted': return 'Email drafted';
      case 'email_sent': return 'Email sent';
      case 'resolved': return 'Secured';
      default: return '';
    }
  };

  const CIRCLE = isNative ? 120 : 140;

  return (
    <>
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Typography variant="display">Savings</Typography>
          <Typography variant="body" tone="secondary" style={{ maxWidth: 540 }}>
            We flag duplicates and price increases — cancel or negotiate to lock in savings.
          </Typography>
        </View>
        <Pressable
          onPress={refreshAnalytics}
          style={({ pressed }) => [s.refreshBtn, pressed && s.pressDown]}
        >
          <Feather name="refresh-cw" size={14} color={c.white} />
          <Text style={s.refreshBtnText}>Refresh</Text>
        </Pressable>
      </View>

      {!hasOpportunities ? (
        <View style={s.allClear}>
          <Feather name="check-circle" size={36} color={c.success} />
          <Text style={s.allClearTitle}>All clear!</Text>
          <Text style={s.allClearText}>No savings opportunities detected yet.</Text>
        </View>
      ) : (
        <View style={s.columnsWrap}>
          {/* ──── Left column: Cancellations ──── */}
          {cancellationQueue.length > 0 && (
            <View style={s.column}>
              <View style={s.colHeader}>
                <View style={[s.colCircleOuter, { width: CIRCLE, height: CIRCLE, borderRadius: CIRCLE / 2, borderColor: c.success }]}>
                  <View style={[s.colCircleFill, { height: `${Math.max(8, cancelProgress * 100)}%`, backgroundColor: c.success }]} />
                  <View style={s.colCircleInner}>
                    <Text style={[s.colCircleLabel, { color: c.success }]}>SECURED</Text>
                    <Text style={s.colCircleValue}>${Math.round(securedCancelSavings).toLocaleString()}</Text>
                    <Text style={s.colCircleCaption}>of ${Math.round(totalCancellable).toLocaleString()}</Text>
                  </View>
                  <RewardFlash active={justSecured !== null} color={c.success} />
                </View>
                <View style={s.colHeaderCopy}>
                  <View style={s.colTitleRow}>
                    <Feather name="mail" size={16} color={c.success} />
                    <Text style={s.colTitle}>Cancel & save</Text>
                  </View>
                  <Text style={s.colSubtitle}>Draft a cancellation email, then mark it done to lock in savings.</Text>
                </View>
              </View>

              {cancellationQueue.map(opp => {
                const done = isResolved(opp);
                const isHovered = hoveredVendor === `cancel-${opp.id}`;
                return (
                  <View
                    key={opp.id}
                    style={[s.vendorRow, done && s.vendorRowDone]}
                  >
                    <View style={s.vendorTop}>
                      <View style={s.vendorInfo}>
                        <Text style={[s.vendorName, done && { opacity: 0.5 }]}>{opp.vendor_name}</Text>
                        <Text style={s.vendorMeta} numberOfLines={2}>{opp.explanation}</Text>
                      </View>
                      <View style={s.vendorSavings}>
                        <Text style={[s.vendorSavingsValue, done && { color: c.success }]}>
                          ${Math.round(opp.estimated_annual_savings).toLocaleString()}
                        </Text>
                        <Text style={s.vendorSavingsSub}>{done ? 'secured / yr' : 'save / yr'}</Text>
                      </View>
                    </View>
                    {statusLabel(opp) && !done ? (
                      <Text style={s.vendorStatus}>{statusLabel(opp)}</Text>
                    ) : null}
                    <View style={s.vendorActions}>
                      {!done && (
                        <Pressable
                          onHoverIn={() => setHoveredVendor(`cancel-${opp.id}`)}
                          onHoverOut={() => setHoveredVendor(null)}
                          onPress={() => handleDraftEmail(opp)}
                          style={({ pressed }) => [
                            s.btnOutline,
                            isHovered && s.btnOutlineHover,
                            pressed && s.pressDown,
                          ]}
                        >
                          <Feather name="edit-3" size={13} color={c.text} />
                          <Text style={s.btnOutlineText}>Draft email</Text>
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => handleMarkSecured(opp)}
                        style={({ pressed }) => [
                          done ? s.btnDone : s.btnPrimary,
                          pressed && s.pressDown,
                        ]}
                      >
                        <Feather name={done ? 'check' : 'check-circle'} size={13} color={done ? c.success : c.white} />
                        <Text style={done ? s.btnDoneText : s.btnPrimaryText}>
                          {done ? 'Secured' : 'Mark as done'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ──── Right column: AI Negotiations ──── */}
          {negotiationQueue.length > 0 && (
            <View style={s.column}>
              <View style={s.colHeader}>
                <View style={[s.colCircleOuter, { width: CIRCLE, height: CIRCLE, borderRadius: CIRCLE / 2, borderColor: c.primary }]}>
                  <View style={[s.colCircleFill, { height: `${Math.max(8, negotiateProgress * 100)}%`, backgroundColor: c.primary }]} />
                  <View style={s.colCircleInner}>
                    <Text style={[s.colCircleLabel, { color: c.primary }]}>POTENTIAL</Text>
                    <Text style={s.colCircleValue}>${Math.round(negotiatedSavings).toLocaleString()}</Text>
                    <Text style={s.colCircleCaption}>of ${Math.round(totalNegotiable).toLocaleString()}</Text>
                  </View>
                </View>
                <View style={s.colHeaderCopy}>
                  <View style={s.colTitleRow}>
                    <Feather name="phone-call" size={16} color={c.primary} />
                    <Text style={s.colTitle}>Negotiate with AI</Text>
                  </View>
                  <Text style={s.colSubtitle}>Start an AI call to negotiate better rates on these vendors.</Text>
                </View>
              </View>

              {negotiationQueue.map(opp => {
                const started = isCallStarted(opp);
                const done = isResolved(opp);
                const isHovered = hoveredVendor === `negotiate-${opp.id}`;
                return (
                  <View
                    key={opp.id}
                    style={[s.vendorRow, started && s.vendorRowStarted]}
                  >
                    <View style={s.vendorTop}>
                      <View style={s.vendorInfo}>
                        <Text style={[s.vendorName, started && { opacity: 0.5 }]}>{opp.vendor_name}</Text>
                        <Text style={s.vendorMeta} numberOfLines={2}>{opp.explanation}</Text>
                      </View>
                      <View style={s.vendorSavings}>
                        <Text style={[s.vendorSavingsValue, { color: c.primary }]}>
                          ${Math.round(opp.estimated_annual_savings).toLocaleString()}
                        </Text>
                        <Text style={s.vendorSavingsSub}>
                          {done ? 'secured / yr' : started ? 'in progress' : 'possible / yr'}
                        </Text>
                      </View>
                    </View>
                    <View style={s.vendorActions}>
                      <Pressable
                        onHoverIn={() => setHoveredVendor(`negotiate-${opp.id}`)}
                        onHoverOut={() => setHoveredVendor(null)}
                        onPress={() => handleScheduleCall(opp)}
                        style={({ pressed }) => [
                          started ? s.btnStarted : s.btnAccent,
                          isHovered && !started && s.btnAccentHover,
                          pressed && s.pressDown,
                        ]}
                      >
                        <Feather name={started ? 'loader' : 'radio'} size={13} color={started ? c.primary : c.white} />
                        <Text style={started ? s.btnStartedText : s.btnAccentText}>
                          {started ? 'Call started' : 'Start AI call'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      <ScheduleAICallModal
        visible={callModalVisible}
        onClose={() => setCallModalVisible(false)}
        vendorName={callVendor}
        workspaceId={resolvedWorkspaceId}
        annualSpend={callAnnualSpend}
        onCallStarted={async () => {
          const opp = opportunities.find(o => o.vendor_name === callVendor);
          if (opp) {
            await updateOpportunityStatus(opp.id, 'ai_call_started');
          }
        }}
      />
    </>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 16,
      gap: 12,
    },
    refreshBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: c.text,
    },
    refreshBtnText: {
      fontSize: 13,
      fontFamily: 'Jost_500Medium',
      color: c.white,
    },
    columnsWrap: {
      flexDirection: isNative ? 'column' : 'row',
      gap: 20,
      alignItems: 'flex-start',
    },
    column: {
      flex: isNative ? undefined : 1,
      width: isNative ? '100%' : undefined,
      gap: 10,
    },
    colHeader: {
      alignItems: 'center',
      gap: 14,
      marginBottom: 10,
    },
    colCircleOuter: {
      borderWidth: 3,
      backgroundColor: c.white,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    colCircleFill: {
      position: 'absolute',
      left: 0, right: 0, bottom: 0,
      opacity: 0.15,
    },
    colCircleInner: {
      alignItems: 'center',
      gap: 1,
    },
    colCircleLabel: {
      fontSize: 9,
      fontFamily: 'Jost_500Medium',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    colCircleValue: {
      fontSize: isNative ? 20 : 24,
      fontFamily: 'Jost_400Regular',
      color: c.text,
      letterSpacing: -0.5,
    },
    colCircleCaption: {
      fontSize: 11,
      color: c.textSecondary,
    },
    colHeaderCopy: {
      alignItems: 'center',
      gap: 4,
    },
    colTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    colTitle: {
      fontSize: 17,
      fontFamily: 'Jost_500Medium',
      color: c.text,
    },
    colSubtitle: {
      fontSize: 13,
      color: c.textSecondary,
      textAlign: 'center',
      maxWidth: 320,
      lineHeight: 19,
    },

    vendorRow: {
      backgroundColor: c.white,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: 10,
      padding: 14,
      gap: 10,
    },
    vendorRowDone: {
      borderColor: c.success,
      opacity: 0.65,
    },
    vendorRowStarted: {
      borderColor: c.primary,
      opacity: 0.65,
    },
    vendorTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    vendorInfo: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    vendorName: {
      fontSize: 14,
      fontFamily: 'Jost_500Medium',
      color: c.text,
    },
    vendorMeta: {
      fontSize: 12,
      color: c.textSecondary,
      lineHeight: 17,
    },
    vendorStatus: {
      fontSize: 11,
      fontFamily: 'Jost_500Medium',
      color: c.textSecondary,
      paddingLeft: 2,
    },
    vendorSavings: {
      alignItems: 'flex-end',
    },
    vendorSavingsValue: {
      fontSize: 18,
      fontFamily: 'Jost_700Bold',
      color: c.text,
      letterSpacing: -0.3,
    },
    vendorSavingsSub: {
      fontSize: 11,
      color: c.textSecondary,
    },
    vendorActions: {
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'flex-end',
    },

    btnOutline: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.white,
    },
    btnOutlineHover: {
      borderColor: c.text,
    },
    btnOutlineText: {
      fontSize: 12, fontFamily: 'Jost_500Medium', color: c.text,
    },
    btnPrimary: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
      backgroundColor: c.success,
    },
    btnPrimaryText: {
      fontSize: 12, fontFamily: 'Jost_500Medium', color: c.white,
    },
    btnDone: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
      backgroundColor: c.successLight, borderWidth: 1, borderColor: c.success,
    },
    btnDoneText: {
      fontSize: 12, fontFamily: 'Jost_500Medium', color: c.success,
    },
    btnAccent: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
      backgroundColor: c.primary,
    },
    btnAccentHover: {
      opacity: 0.9,
    },
    btnAccentText: {
      fontSize: 12, fontFamily: 'Jost_500Medium', color: c.white,
    },
    btnStarted: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
      backgroundColor: c.primaryLight, borderWidth: 1, borderColor: c.primary,
    },
    btnStartedText: {
      fontSize: 12, fontFamily: 'Jost_500Medium', color: c.primary,
    },

    pressDown: { transform: [{ scale: 0.98 }] },
    allClear: { alignItems: 'center', padding: 48, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.cardBorder },
    allClearTitle: { fontSize: 17, fontFamily: 'Jost_500Medium', color: c.text, marginTop: 14, marginBottom: 4 },
    allClearText: { fontSize: 13, fontFamily: 'Jost_400Regular', color: c.textSecondary },
  });
}
