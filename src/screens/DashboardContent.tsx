import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';
import Card from '../components/ui/Card';
import Typography from '../components/ui/Typography';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Props = {
  onOpenMonth?: () => void;
};

export default function DashboardContent({ onOpenMonth }: Props) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);

  const {
    activeWorkspaceId,
    setActiveWorkspaceId,
    createWorkspace,
    workspaces,
    opportunitySummary,
  } = useWorkspace();
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const values = new Set<number>([currentYear, currentYear - 1, currentYear + 1]);
    workspaces.forEach(workspace => values.add(workspace.year));
    return Array.from(values).sort((a, b) => a - b);
  }, [workspaces]);
  const selectedYearWorkspaces = useMemo(
    () => workspaces.filter(workspace => workspace.year === selectedYear).sort((a, b) => a.month - b.month),
    [workspaces, selectedYear]
  );
  const annualTrackedSpend = selectedYearWorkspaces.reduce((sum, workspace) => sum + Number(workspace.total_saved ?? 0), 0);
  const annualSaved = opportunitySummary.securedSavings;
  const activeMonthCount = selectedYearWorkspaces.length;

  const monthCards = useMemo(
    () =>
      MONTH_NAMES.map((label, index) => {
        const month = index + 1;
        const workspace = selectedYearWorkspaces.find(entry => entry.month === month) ?? null;
        const trackedSpend = Number(workspace?.total_saved ?? 0);
        const shareOfYear = annualTrackedSpend > 0 ? trackedSpend / annualTrackedSpend : 0;
        return { label, month, workspace, trackedSpend, shareOfYear };
      }),
    [selectedYearWorkspaces, annualTrackedSpend]
  );

  const handleOpenMonth = async (month: number) => {
    const existing = workspaces.find(workspace => workspace.year === selectedYear && workspace.month === month);
    if (existing) {
      setActiveWorkspaceId(existing.id);
      onOpenMonth?.();
      return;
    }
    const created = await createWorkspace(month, selectedYear);
    if (created?.id) {
      setActiveWorkspaceId(created.id);
      onOpenMonth?.();
    }
  };

  const BUBBLE = isNative ? 80 : 96;

  return (
    <>
      {/* ──── Hero: Your 2026 left, bubbles centered, years right; all one row above the grid ──── */}
      <View style={s.heroSection}>
        <View style={s.heroLeft}>
          <Typography variant="display" style={s.heroTitle}>{`Your ${selectedYear}`}</Typography>
          <Typography variant="bodySmall" tone="secondary" style={s.heroSub}>
            {activeMonthCount > 0
              ? `${activeMonthCount} month${activeMonthCount > 1 ? 's' : ''} tracked so far`
              : 'Start by opening a month below'}
          </Typography>
        </View>
        <View style={s.heroBubbles}>
          <View style={[s.heroBubble, { width: BUBBLE, height: BUBBLE, borderRadius: BUBBLE / 2, borderColor: c.primary }]}>
            <View style={[s.heroBubbleFill, { backgroundColor: c.primary, height: activeMonthCount > 0 ? '100%' : '0%' }]} />
            <View style={s.heroBubbleInner}>
              <Text style={[s.heroBubbleLabel, { color: c.primary }]}>SPENT</Text>
              <Text style={s.heroBubbleValue}>
                {annualTrackedSpend > 0 ? `$${(annualTrackedSpend / 1000).toFixed(0)}K` : '$0'}
              </Text>
            </View>
          </View>
          <View style={[s.heroBubble, { width: BUBBLE, height: BUBBLE, borderRadius: BUBBLE / 2, borderColor: c.success }]}>
            <View style={[s.heroBubbleFill, { backgroundColor: c.success, height: annualSaved > 0 ? '30%' : '8%' }]} />
            <View style={s.heroBubbleInner}>
              <Text style={[s.heroBubbleLabel, { color: c.success }]}>SAVED</Text>
              <Text style={s.heroBubbleValue}>
                {annualSaved > 0 ? `$${(annualSaved / 1000).toFixed(0)}K` : '$0'}
              </Text>
            </View>
          </View>
        </View>
        <View style={s.heroRight}>
          {years.map(year => (
            <Pressable
              key={year}
              onPress={() => setSelectedYear(year)}
              style={({ pressed }) => [
                s.yearChip,
                selectedYear === year && s.yearChipActive,
                pressed && s.pressDown,
              ]}
            >
              <Typography variant="bodySmall" style={selectedYear === year ? s.yearChipTextActive : s.yearChipText}>
                {year}
              </Typography>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ──── Month grid (same width as hero; year chips sit in hero row so they don’t pass card margins) ──── */}
      <View style={s.monthSection}>
        <View style={s.monthGrid}>
        {monthCards.map(card => {
          const isHovered = hoveredMonth === card.month;
          const fillPct = card.workspace ? Math.max(8, Math.round(card.shareOfYear * 100)) : 0;
          const CIRCLE_SIZE = isNative ? 56 : 64;
          return (
            <Pressable
              key={`${selectedYear}-${card.month}`}
              onPress={() => void handleOpenMonth(card.month)}
              onHoverIn={() => setHoveredMonth(card.month)}
              onHoverOut={() => setHoveredMonth(cur => (cur === card.month ? null : cur))}
              style={({ pressed }) => [
                s.monthCardWrap,
                isHovered && s.monthCardWrapHovered,
                pressed && s.pressDown,
              ]}
            >
              <Card
                padding="md"
                shadow="subtle"
                style={[
                  s.monthCard,
                  card.workspace && s.monthCardActive,
                  activeWorkspaceId === card.workspace?.id && s.monthCardSelected,
                  isHovered && s.monthCardHovered,
                ]}
              >
                <Typography variant="title" style={s.monthLabel}>{card.label}</Typography>

                <View style={s.monthBody}>
                  <View style={s.monthLeft}>
                    <Typography variant="h1" style={s.monthSpend}>
                      {card.workspace
                        ? isNative && card.trackedSpend >= 1000
                          ? `$${(card.trackedSpend / 1000).toFixed(card.trackedSpend >= 10000 ? 0 : 1)}K`
                          : `$${card.trackedSpend.toLocaleString()}`
                        : '--'}
                    </Typography>
                    <Typography variant="caption" tone="secondary">
                      {card.workspace ? 'spent this month' : 'no data yet'}
                    </Typography>
                  </View>

                  <View style={[s.monthCircle, { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2 }, card.workspace ? s.monthCircleActive : s.monthCircleEmpty]}>
                    <View style={[s.monthCircleFill, card.workspace ? { height: `${fillPct}%` } : { height: '0%' }]} />
                    <View style={s.monthCircleContent}>
                      {card.workspace ? (
                        <Text style={s.monthCircleValue}>{Math.round(card.shareOfYear * 100)}%</Text>
                      ) : (
                        <Feather name="plus" size={18} color={c.textTertiary} />
                      )}
                    </View>
                  </View>
                </View>

                <View style={s.monthCta}>
                  <Typography variant="caption" style={s.monthCtaText}>
                    {card.workspace ? 'Open' : 'Create'}
                  </Typography>
                  <Feather name="arrow-right" size={13} color={c.primary} />
                </View>
              </Card>
            </Pressable>
          );
        })}
        </View>
      </View>

      {monthCards.every(card => !card.workspace) && (
        <View style={s.emptyState}>
          <Feather name="calendar" size={40} color={c.textTertiary} />
          <Text style={s.emptyTitle}>Start with a month</Text>
          <Text style={s.emptyText}>Tap any card above to create a workspace and begin tracking.</Text>
        </View>
      )}
    </>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    heroSection: {
      flexDirection: isNative ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: isNative ? 'center' : ('space-between' as const),
      marginBottom: isNative ? 20 : 18,
      gap: isNative ? 12 : 0,
    },
    heroLeft: {
      flex: isNative ? 0 : 1,
      alignItems: isNative ? 'center' : ('flex-start' as const),
      justifyContent: 'center',
      gap: 4,
    },
    heroTitle: {
      fontSize: isNative ? 44 : 60,
      lineHeight: isNative ? 50 : 66,
      letterSpacing: -0.5,
      fontFamily: 'PlayfairDisplay_700Bold',
      textAlign: isNative ? 'center' : ('left' as const),
    },
    heroSub: {
      textAlign: isNative ? 'center' : ('left' as const),
      fontFamily: 'Jost_400Regular',
    },
    heroBubbles: {
      flexDirection: 'row',
      gap: 14,
      flexShrink: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    heroRight: {
      flex: isNative ? 0 : 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: isNative ? 'center' : ('flex-end' as const),
      gap: 8,
      marginTop: isNative ? 4 : 0,
    },
    heroBubble: {
      borderWidth: 2,
      backgroundColor: c.white,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative' as const,
    },
    heroBubbleFill: {
      position: 'absolute' as const,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.12,
    },
    heroBubbleInner: {
      alignItems: 'center',
      gap: 0,
    },
    heroBubbleLabel: {
      fontSize: 9,
      fontFamily: 'Jost_500Medium',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    heroBubbleValue: {
      fontSize: isNative ? 20 : 24,
      fontFamily: 'Jost_400Regular',
      color: c.text,
      letterSpacing: -0.5,
    },
    monthSection: { marginBottom: 20 },
    yearChip: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.cardBorder,
    },
    yearChipActive: { borderColor: c.primary, backgroundColor: c.white },
    yearChipHover: { borderColor: c.textSecondary, transform: [{ translateY: -1 }] },
    yearChipText: { color: c.textSecondary, fontFamily: 'Jost_500Medium', letterSpacing: 0.3 },
    yearChipTextActive: { color: c.primary, fontFamily: 'Jost_700Bold' },
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: isNative ? 12 : 14,
      marginBottom: 20,
      justifyContent: isNative ? 'center' : ('center' as const),
    },
    monthCardWrap: { width: isNative ? '100%' : '23.5%', minWidth: isNative ? undefined : 200 },
    monthCardWrapHovered: { transform: [{ translateY: -4 }] },
    monthCard: { borderRadius: 12, minHeight: isNative ? 140 : 170 },
    monthCardActive: { borderColor: c.primaryLight },
    monthCardSelected: { borderColor: c.primary, borderWidth: 1.5 },
    monthCardHovered: {
      borderColor: c.primary,
      shadowColor: c.primary,
      shadowOpacity: 0.14,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    monthLabel: { fontSize: 22, lineHeight: 26, letterSpacing: 0.5, marginBottom: 8, fontFamily: 'Jost_700Bold' },
    monthBody: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1,
    },
    monthLeft: { flex: 1, minWidth: 0, marginRight: 10 },
    monthSpend: { letterSpacing: -0.3, marginBottom: 2, fontSize: isNative ? 20 : 24, fontFamily: 'Jost_400Regular' },
    monthCircle: {
      borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', position: 'relative' as const,
    },
    monthCircleActive: { borderColor: c.primary, backgroundColor: c.white },
    monthCircleEmpty: { borderColor: c.cardBorder, backgroundColor: c.inputBg },
    monthCircleFill: {
      position: 'absolute' as const, left: 0, right: 0, bottom: 0,
      backgroundColor: c.primary, opacity: 0.18,
    },
    monthCircleContent: { alignItems: 'center', justifyContent: 'center' },
    monthCircleValue: { fontSize: 16, fontFamily: 'Jost_700Bold', color: c.primary, letterSpacing: -0.2 },
    monthCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 10 },
    monthCtaText: { color: c.primary, fontFamily: 'Jost_500Medium' },
    pressDown: { transform: [{ scale: 0.97 }] },
    emptyState: { alignItems: 'center', padding: 48, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.cardBorder },
    emptyTitle: { fontSize: 17, fontFamily: 'Jost_500Medium', color: c.text, marginTop: 16, marginBottom: 6 },
    emptyText: { fontSize: 13, fontFamily: 'Jost_400Regular', color: c.textSecondary, textAlign: 'center', maxWidth: 320, lineHeight: 20 },
  });
}
