import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import theme from '../../constants/theme';
import { OVERVIEW_ID, useWorkspace, type OverviewRange } from '../context/WorkspaceContext';
import Button from './ui/Button';
import Typography from './ui/Typography';

type Props = {
  visible: boolean;
  onClose: () => void;
  isMobile?: boolean;
};

const RANGE_OPTIONS: { key: OverviewRange; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'all', label: 'All months', icon: 'layers' },
  { key: 'last3', label: 'Last 3', icon: 'clock' },
  { key: 'last6', label: 'Last 6', icon: 'calendar' },
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MonthRangeSelector({ visible, onClose, isMobile = false }: Props) {
  const {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    overviewRange,
    setActiveWorkspaceId,
    setOverviewRange,
    createWorkspace,
  } = useWorkspace();
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const values = new Set<number>([currentYear, currentYear - 1, currentYear + 1]);
    workspaces.forEach(workspace => values.add(workspace.year));
    return Array.from(values).sort((a, b) => a - b);
  }, [workspaces]);
  const [selectedYear, setSelectedYear] = useState(activeWorkspace?.year ?? currentYear);

  useEffect(() => {
    if (visible) setSelectedYear(activeWorkspace?.year ?? currentYear);
  }, [visible, activeWorkspace?.year, currentYear]);

  const selectRange = (range: OverviewRange) => {
    setActiveWorkspaceId(OVERVIEW_ID);
    setOverviewRange(range);
    onClose();
  };

  const selectMonth = async (monthNumber: number) => {
    const existing = workspaces.find(w => w.year === selectedYear && w.month === monthNumber);
    if (existing) { setActiveWorkspaceId(existing.id); onClose(); return; }
    const created = await createWorkspace(monthNumber, selectedYear);
    if (created?.id) setActiveWorkspaceId(created.id);
    onClose();
  };

  const t = theme;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.dropdownWrap, isMobile && styles.dropdownWrapMobile]}
          onPress={e => e.stopPropagation()}
        >
          <View style={[styles.dropdown, isMobile && styles.dropdownMobile]}>
            {/* ──── Header ──── */}
            <View style={styles.header}>
              <Typography variant="h2" style={styles.headerTitle}>Select a month</Typography>
              <Pressable onPress={onClose} style={({ hovered }) => [styles.closeBtn, hovered && styles.closeBtnHover]}>
                <Feather name="x" size={16} color={t.colors.textSecondary} />
              </Pressable>
            </View>

            {/* ──── Range pills ──── */}
            <View style={styles.rangePills}>
              {RANGE_OPTIONS.map(opt => {
                const active = activeWorkspaceId === OVERVIEW_ID && overviewRange === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => selectRange(opt.key)}
                    style={({ pressed, hovered }) => [
                      styles.rangePill,
                      active && styles.rangePillActive,
                      hovered && !active && styles.rangePillHover,
                      pressed && styles.pressDown,
                    ]}
                  >
                    <Feather name={opt.icon} size={13} color={active ? t.colors.primary : t.colors.textSecondary} />
                    <Typography variant="caption" style={active ? styles.rangePillTextActive : styles.rangePillText}>
                      {opt.label}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>

            {/* ──── Year selector ──── */}
            <View style={styles.yearRow}>
              {years.map(year => (
                <Pressable
                  key={year}
                  onPress={() => setSelectedYear(year)}
                  style={({ pressed }) => [
                    styles.yearChip,
                    selectedYear === year && styles.yearChipActive,
                    pressed && styles.pressDown,
                  ]}
                >
                  <Typography variant="caption" style={selectedYear === year ? styles.yearChipTextActive : styles.yearChipText}>
                    {year}
                  </Typography>
                </Pressable>
              ))}
            </View>

            {/* ──── Month grid ──── */}
            <View style={styles.monthGrid}>
              {MONTH_LABELS.map((label, i) => {
                const monthNum = i + 1;
                const existing = workspaces.find(w => w.year === selectedYear && w.month === monthNum);
                const isActive = existing ? activeWorkspaceId === existing.id : false;
                return (
                  <Pressable
                    key={`${selectedYear}-${monthNum}`}
                    onPress={() => void selectMonth(monthNum)}
                    style={({ pressed, hovered }) => [
                      styles.monthCell,
                      existing ? styles.monthCellExisting : styles.monthCellEmpty,
                      isActive && styles.monthCellActive,
                      hovered && !isActive && styles.monthCellHover,
                      pressed && styles.pressDown,
                    ]}
                  >
                    <Typography variant="subtitle" style={isActive ? styles.monthCellTextActive : existing ? styles.monthCellTextExisting : styles.monthCellText}>
                      {label}
                    </Typography>
                    {existing && <View style={[styles.monthDot, isActive && styles.monthDotActive]} />}
                  </Pressable>
                );
              })}
            </View>

            {isMobile && (
              <Button label="Close" variant="secondary" onPress={onClose} style={styles.mobileClose} />
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const t = theme;
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(27, 23, 21, 0.22)',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  dropdownWrap: {
    paddingTop: 72,
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 16,
  },
  dropdownWrapMobile: {
    paddingTop: 0,
    flex: 1,
    justifyContent: 'flex-end',
    maxWidth: '100%',
    paddingHorizontal: 0,
  },
  dropdown: {
    backgroundColor: t.colors.white,
    borderRadius: 14,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  dropdownMobile: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerTitle: {
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.surface,
  },
  closeBtnHover: {
    backgroundColor: t.colors.border,
  },
  rangePills: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  rangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  rangePillActive: {
    backgroundColor: t.colors.white,
    borderColor: t.colors.primary,
  },
  rangePillHover: {
    backgroundColor: t.colors.cardAlt,
  },
  rangePillText: {
    color: t.colors.textSecondary,
    fontFamily: 'Jost_500Medium',
  },
  rangePillTextActive: {
    color: t.colors.primary,
    fontFamily: 'Jost_700Bold',
  },
  yearRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  yearChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  yearChipActive: {
    backgroundColor: t.colors.white,
    borderColor: t.colors.primary,
  },
  yearChipText: {
    color: t.colors.textSecondary,
    fontFamily: 'Jost_500Medium',
  },
  yearChipTextActive: {
    color: t.colors.primary,
    fontFamily: 'Jost_700Bold',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthCell: {
    width: '23%',
    aspectRatio: 1.6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  monthCellExisting: {
    backgroundColor: t.colors.white,
    borderColor: t.colors.border,
  },
  monthCellEmpty: {
    backgroundColor: t.colors.surface,
    borderColor: t.colors.border,
  },
  monthCellActive: {
    backgroundColor: t.colors.white,
    borderColor: t.colors.primary,
    borderWidth: 1.5,
    shadowColor: t.colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  monthCellHover: {
    backgroundColor: t.colors.cardAlt,
    borderColor: t.colors.textSecondary,
  },
  monthCellText: {
    color: t.colors.textMuted,
    fontFamily: 'Jost_500Medium',
  },
  monthCellTextExisting: {
    color: t.colors.text,
    fontFamily: 'Jost_500Medium',
  },
  monthCellTextActive: {
    color: t.colors.primary,
    fontFamily: 'Jost_700Bold',
  },
  monthDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: t.colors.success,
  },
  monthDotActive: {
    backgroundColor: t.colors.primary,
  },
  pressDown: {
    transform: [{ scale: 0.97 }],
  },
  mobileClose: {
    marginTop: 18,
  },
});
