import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Linking, Alert, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import { getContentStyles } from '../constants/contentStyles';
import Typography from '../components/ui/Typography';
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
  const [securedVendors, setSecuredVendors] = useState<string[]>([]);
  const [startedCallVendors, setStartedCallVendors] = useState<string[]>([]);
  const [hoveredVendor, setHoveredVendor] = useState<string | null>(null);
  const [justSecured, setJustSecured] = useState<string | null>(null);
  const c = useColors();
  const cs = useMemo(() => getContentStyles(c), [c]);
  const s = useMemo(() => createStyles(c), [c]);

  const { activeWorkspaceTransactions, activeWorkspaceId, workspaces } = useWorkspace();
  const { subscriptions, priceCreepSignals, isEmpty } = useWorkspaceData(activeWorkspaceTransactions);
  const resolvedWorkspaceId = activeWorkspaceId === 'all' ? (workspaces[0]?.id ?? null) : activeWorkspaceId;

  const duplicates = useMemo(() => subscriptions.filter(sub => sub.isDuplicate).sort((a, b) => b.totalAmount - a.totalAmount), [subscriptions]);
  const alerts = useMemo(() => {
    const byVendor = new Map<string, AlertRow>();
    for (const d of duplicates) {
      byVendor.set(d.vendor, {
        vendor: d.vendor, amount: d.totalAmount, count: d.count,
        message: `Charged ${d.count} times this period`,
        category: d.category, isDuplicate: true, isPriceCreep: false,
      });
    }
    for (const p of priceCreepSignals) {
      const existing = byVendor.get(p.vendor);
      if (existing) {
        existing.isPriceCreep = true;
        existing.message += p.message ? ` · ${p.message}` : '';
      } else {
        byVendor.set(p.vendor, {
          vendor: p.vendor, amount: p.totalAmount, count: p.count,
          message: p.message, category: 'Other', isDuplicate: false, isPriceCreep: true,
        });
      }
    }
    return Array.from(byVendor.values()).sort((a, b) => b.amount - a.amount);
  }, [duplicates, priceCreepSignals]);

  const cancellationQueue = useMemo(
    () => duplicates.map(item => ({
      vendor: item.vendor, category: item.category,
      monthlySpend: item.totalAmount, annualImpact: item.totalAmount * 12, count: item.count,
    })),
    [duplicates]
  );
  const negotiationQueue = useMemo(
    () => alerts.filter(a => a.isPriceCreep).map(a => {
      const annualSpend = a.amount * 12;
      return { vendor: a.vendor, category: a.category, annualSpend, possibleSavings: Math.round(annualSpend * 0.15), message: a.message };
    }),
    [alerts]
  );

  const totalCancellable = useMemo(
    () => cancellationQueue.reduce((sum, i) => sum + i.annualImpact, 0),
    [cancellationQueue]
  );
  const securedSavings = useMemo(
    () => cancellationQueue.filter(i => securedVendors.includes(i.vendor)).reduce((sum, i) => sum + i.annualImpact, 0),
    [cancellationQueue, securedVendors]
  );
  const totalNegotiable = useMemo(
    () => negotiationQueue.reduce((sum, i) => sum + i.possibleSavings, 0),
    [negotiationQueue]
  );
  const negotiatedSavings = useMemo(
    () => negotiationQueue.filter(i => startedCallVendors.includes(i.vendor)).reduce((sum, i) => sum + i.possibleSavings, 0),
    [negotiationQueue, startedCallVendors]
  );

  const cancelProgress = totalCancellable > 0 ? securedSavings / totalCancellable : 0;
  const negotiateProgress = totalNegotiable > 0 ? negotiatedSavings / totalNegotiable : 0;

  const sortedCancellations = useMemo(
    () => [...cancellationQueue].sort((a, b) => {
      const aDone = securedVendors.includes(a.vendor) ? 1 : 0;
      const bDone = securedVendors.includes(b.vendor) ? 1 : 0;
      return aDone - bDone || b.annualImpact - a.annualImpact;
    }),
    [cancellationQueue, securedVendors]
  );
  const sortedNegotiations = useMemo(
    () => [...negotiationQueue].sort((a, b) => {
      const aDone = startedCallVendors.includes(a.vendor) ? 1 : 0;
      const bDone = startedCallVendors.includes(b.vendor) ? 1 : 0;
      return aDone - bDone || b.possibleSavings - a.possibleSavings;
    }),
    [negotiationQueue, startedCallVendors]
  );

  if (isEmpty) {
    return (
      <>
        <Typography variant="display">Savings</Typography>
        <Typography variant="body" tone="secondary" style={{ marginBottom: 20, maxWidth: 540 }}>
          We flag duplicates and price increases — cancel or negotiate to lock in savings.
        </Typography>
        <WorkspaceEmptyState activeWorkspaceId={activeWorkspaceId} />
      </>
    );
  }

  const handleDraftEmail = (vendor: string, amount: number) => {
    const body = `Subject: Account review — ${vendor}\n\nHi,\n\nI'd like to review charges for ${vendor}. I noticed spend totaling $${amount.toLocaleString()} and want to discuss adjustments or consolidation.\n\nPlease let me know a convenient time for a call.\n\nBest regards`;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(body);
      Alert.alert('Copied', 'Email draft copied to clipboard.');
    } else {
      Linking.openURL(`mailto:?body=${encodeURIComponent(body)}`);
    }
  };

  const handleMarkSecured = (vendor: string) => {
    if (!securedVendors.includes(vendor)) {
      setSecuredVendors(prev => [...prev, vendor]);
      setJustSecured(vendor);
      setTimeout(() => setJustSecured(null), 600);
    }
  };

  const handleScheduleCall = (vendor: string, annualSpend?: number) => {
    setCallVendor(vendor);
    setCallAnnualSpend(annualSpend);
    setCallModalVisible(true);
  };

  const CIRCLE = isNative ? 120 : 140;

  return (
    <>
      {alerts.length === 0 ? (
        <View style={s.allClear}>
          <Feather name="check-circle" size={36} color={c.success} />
          <Text style={s.allClearTitle}>All clear!</Text>
          <Text style={s.allClearText}>No duplicate or price issues in this period.</Text>
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
                    <Text style={s.colCircleValue}>${securedSavings.toLocaleString()}</Text>
                    <Text style={s.colCircleCaption}>of ${totalCancellable.toLocaleString()}</Text>
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

              {sortedCancellations.map(item => {
                const isSecured = securedVendors.includes(item.vendor);
                const isHovered = hoveredVendor === `cancel-${item.vendor}`;
                return (
                  <View
                    key={item.vendor}
                    style={[s.vendorRow, isSecured && s.vendorRowDone]}
                  >
                    <View style={s.vendorTop}>
                      <View style={s.vendorInfo}>
                        <Text style={[s.vendorName, isSecured && { opacity: 0.5 }]}>{item.vendor}</Text>
                        <Text style={s.vendorMeta}>{item.category} · {item.count} charges</Text>
                      </View>
                      <View style={s.vendorSavings}>
                        <Text style={[s.vendorSavingsValue, isSecured && { color: c.success }]}>
                          ${item.annualImpact.toLocaleString()}
                        </Text>
                        <Text style={s.vendorSavingsSub}>{isSecured ? 'secured / yr' : 'save / yr'}</Text>
                      </View>
                    </View>
                    <View style={s.vendorActions}>
                      {!isSecured && (
                        <Pressable
                          onHoverIn={() => setHoveredVendor(`cancel-${item.vendor}`)}
                          onHoverOut={() => setHoveredVendor(null)}
                          onPress={() => handleDraftEmail(item.vendor, item.monthlySpend)}
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
                        onPress={() => handleMarkSecured(item.vendor)}
                        style={({ pressed }) => [
                          isSecured ? s.btnDone : s.btnPrimary,
                          pressed && s.pressDown,
                        ]}
                      >
                        <Feather name={isSecured ? 'check' : 'check-circle'} size={13} color={isSecured ? c.success : c.white} />
                        <Text style={isSecured ? s.btnDoneText : s.btnPrimaryText}>
                          {isSecured ? 'Secured' : 'Mark as done'}
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
                    <Text style={s.colCircleValue}>${negotiatedSavings.toLocaleString()}</Text>
                    <Text style={s.colCircleCaption}>of ${totalNegotiable.toLocaleString()}</Text>
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

              {sortedNegotiations.map(item => {
                const isStarted = startedCallVendors.includes(item.vendor);
                const isHovered = hoveredVendor === `negotiate-${item.vendor}`;
                return (
                  <View
                    key={item.vendor}
                    style={[s.vendorRow, isStarted && s.vendorRowStarted]}
                  >
                    <View style={s.vendorTop}>
                      <View style={s.vendorInfo}>
                        <Text style={[s.vendorName, isStarted && { opacity: 0.5 }]}>{item.vendor}</Text>
                        <Text style={s.vendorMeta} numberOfLines={1}>{item.message}</Text>
                      </View>
                      <View style={s.vendorSavings}>
                        <Text style={[s.vendorSavingsValue, { color: c.primary }]}>
                          ${item.possibleSavings.toLocaleString()}
                        </Text>
                        <Text style={s.vendorSavingsSub}>{isStarted ? 'in progress' : 'possible / yr'}</Text>
                      </View>
                    </View>
                    <View style={s.vendorActions}>
                      <Pressable
                        onHoverIn={() => setHoveredVendor(`negotiate-${item.vendor}`)}
                        onHoverOut={() => setHoveredVendor(null)}
                        onPress={() => handleScheduleCall(item.vendor, item.annualSpend)}
                        style={({ pressed }) => [
                          isStarted ? s.btnStarted : s.btnAccent,
                          isHovered && !isStarted && s.btnAccentHover,
                          pressed && s.pressDown,
                        ]}
                      >
                        <Feather name={isStarted ? 'loader' : 'radio'} size={13} color={isStarted ? c.primary : c.white} />
                        <Text style={isStarted ? s.btnStartedText : s.btnAccentText}>
                          {isStarted ? 'Call started' : 'Start AI call'}
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
          setStartedCallVendors(prev => (prev.includes(callVendor) ? prev : [...prev, callVendor]));
        }}
      />
    </>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
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
      fontFamily: 'Jost_700Bold',
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
