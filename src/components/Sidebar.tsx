import React, { useState, useMemo } from 'react';
import { View, Image, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWorkspace, workspaceLabel, OVERVIEW_ID } from '../context/WorkspaceContext';
import NewWorkspaceModal from './NewWorkspaceModal';
import theme from '../../constants/theme';
import Typography from './ui/Typography';

const alfredLogo = require('../../assets/alfred-logo.png');

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

type NavItem = { label: string; key: string; icon: keyof typeof Feather.glyphMap };

const mainNav: NavItem[] = [
  { label: 'Home', key: 'Dashboard', icon: 'home' },
  { label: 'Spending', key: 'Spending', icon: 'pie-chart' },
  { label: 'Alerts', key: 'Alerts', icon: 'alert-circle' },
  { label: 'What If', key: 'What If', icon: 'git-branch' },
];

type Props = {
  activeItem: string;
  onItemPress?: (label: string) => void;
  onLogout?: () => void;
  onClose?: () => void;
};

export default function Sidebar({ activeItem, onItemPress, onLogout, onClose }: Props) {
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const { isDark, toggle } = useTheme();
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, createWorkspace, overviewRange, setOverviewRange } = useWorkspace();
  const isAllMonths = activeWorkspaceId === OVERVIEW_ID;
  const s = useMemo(() => createStyles(), []);

  return (
    <View style={[s.container, isNative && s.containerNative]}>
      <View style={[s.logoSection, isNative && s.logoSectionNative]}>
        <Image source={alfredLogo} style={s.logoImg} resizeMode="contain" />
        <View style={s.logoTextWrap}>
          <Typography variant="title">Alfred</Typography>
          <Typography variant="caption" tone="muted" style={s.logoSubtitle}>Business finances</Typography>
        </View>
        {isNative && onClose && (
          <Pressable onPress={onClose} style={s.closeBtn}>
            <Feather name="x" size={22} color={theme.colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <View style={[s.workspaceSection, isNative && s.workspaceSectionNative]}>
        <Typography variant="label" tone="muted" style={s.sectionLabel}>MONTHS</Typography>
        <ScrollView style={s.workspaceList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          <Pressable
            style={[s.workspaceItem, isAllMonths && s.workspaceItemActive]}
            onPress={() => setActiveWorkspaceId(OVERVIEW_ID)}
          >
            <Feather name="layers" size={14} color={isAllMonths ? theme.colors.primary : theme.colors.textSecondary} />
            <Typography variant="bodySmall" style={[s.workspaceLabel, isAllMonths && s.workspaceLabelActive]}>All months</Typography>
          </Pressable>
          {isAllMonths && (
            <View style={s.rangeFilter}>
              {(['all', 'last3', 'last6'] as const).map((range) => (
                <Pressable
                  key={range}
                  style={[s.rangeChip, overviewRange === range && s.rangeChipActive]}
                  onPress={() => setOverviewRange(range)}
                >
                  <Typography variant="caption" style={[s.rangeChipText, overviewRange === range && s.rangeChipTextActive]}>
                    {range === 'all' ? 'All' : range === 'last3' ? 'Last 3' : 'Last 6'}
                  </Typography>
                </Pressable>
              ))}
            </View>
          )}
          {workspaces.map((w) => {
            const active = w.id === activeWorkspaceId;
            return (
              <Pressable
                key={w.id}
                style={[s.workspaceItem, active && s.workspaceItemActive]}
                onPress={() => setActiveWorkspaceId(w.id)}
              >
                <Feather name="calendar" size={14} color={active ? theme.colors.primary : theme.colors.textSecondary} />
                <Typography variant="bodySmall" style={[s.workspaceLabel, active && s.workspaceLabelActive]}>
                  {workspaceLabel(w)}
                </Typography>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable style={s.addMonthBtn} onPress={() => setShowNewWorkspace(true)}>
          <Feather name="plus" size={14} color={theme.colors.primary} />
          <Typography variant="bodySmall" tone="accent" style={s.addMonthText}>Add a month</Typography>
        </Pressable>
      </View>

      <Typography variant="label" tone="muted" style={s.sectionLabel}>MENU</Typography>
      {mainNav.map((item) => {
        const isActive = item.key === activeItem;
        return (
          <Pressable
            key={item.key}
            onPress={() => onItemPress?.(item.key)}
            style={({ pressed }) => [
              s.navItem,
              isNative && s.navItemNative,
              isActive && s.navItemActive,
              pressed && s.navItemPressed,
            ]}
          >
            <Feather
              name={item.icon}
              size={isNative ? 20 : 18}
              color={isActive ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Typography variant="bodySmall" style={[s.navLabel, isNative && s.navLabelNative, isActive && s.navLabelActive]}>
              {item.label}
            </Typography>
          </Pressable>
        );
      })}

      <View style={s.spacer} />

      <Pressable style={s.themeBtn} onPress={toggle}>
        <Feather name={isDark ? 'sun' : 'moon'} size={16} color={theme.colors.textSecondary} />
        <Typography variant="bodySmall" tone="secondary" style={s.themeBtnText}>
          {isDark ? 'Light mode' : 'Dark mode'}
        </Typography>
      </Pressable>

      <Pressable style={[s.logoutBtn, isNative && s.logoutBtnNative]} onPress={onLogout}>
        <Feather name="log-out" size={isNative ? 20 : 16} color={theme.colors.textSecondary} />
        <Typography variant="bodySmall" tone="secondary" style={s.logoutText}>Log out</Typography>
      </Pressable>

      <NewWorkspaceModal
        visible={showNewWorkspace}
        onClose={() => setShowNewWorkspace(false)}
        onCreate={(month, year) => createWorkspace(month, year)}
      />
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    container: {
      width: '100%',
      minWidth: 220,
      flex: 1,
      backgroundColor: theme.colors.surfaceElevated,
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.md,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
    },
    containerNative: {
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRightWidth: 0,
    },
    logoSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.xs,
    },
    logoSectionNative: { marginBottom: 20, paddingTop: 4 },
    logoImg: {
      width: 40,
      height: 40,
      marginRight: theme.spacing.sm,
    },
    logoTextWrap: { flex: 1, minWidth: 0 },
    logoSubtitle: { marginTop: 1 },
    closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    sectionLabel: {
      letterSpacing: 1.2,
      marginBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
    },
    workspaceSection: {
      marginBottom: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    workspaceSectionNative: { marginBottom: 20, paddingBottom: 16 },
    workspaceList: { maxHeight: 140 },
    workspaceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.sm,
      marginBottom: 4,
    },
    workspaceItemActive: { backgroundColor: theme.colors.primarySoft },
    workspaceLabel: { marginLeft: theme.spacing.sm, flex: 1, color: theme.colors.textSecondary },
    workspaceLabelActive: { color: theme.colors.primary, fontWeight: theme.typography.weights.semibold },
    rangeFilter: { flexDirection: 'row', gap: 4, marginLeft: 28, marginBottom: 6 },
    rangeChip: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    rangeChipActive: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primarySoft },
    rangeChipText: { color: theme.colors.textMuted },
    rangeChipTextActive: { color: theme.colors.primary, fontWeight: theme.typography.weights.semibold },
    addMonthBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      marginTop: theme.spacing.xs,
      borderRadius: theme.radius.sm,
    },
    addMonthText: { marginLeft: 6, fontWeight: theme.typography.weights.medium },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: theme.radius.sm,
      marginBottom: 4,
    },
    navItemNative: { paddingVertical: 14, paddingHorizontal: 12, borderRadius: theme.radius.md, marginBottom: 4 },
    navItemActive: { backgroundColor: theme.colors.primarySoft },
    navItemPressed: { opacity: 0.7 },
    navLabel: { color: theme.colors.textSecondary, marginLeft: 10, fontWeight: theme.typography.weights.semibold },
    navLabelNative: { fontSize: 16, marginLeft: 14, lineHeight: 22 },
    navLabelActive: { color: theme.colors.primary },
    spacer: { flex: 1 },
    themeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: 10,
      borderRadius: theme.radius.sm,
      marginBottom: 4,
      backgroundColor: theme.colors.surface,
    },
    themeBtnText: { marginLeft: theme.spacing.sm, fontWeight: theme.typography.weights.medium },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: theme.radius.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 12,
    },
    logoutBtnNative: { paddingVertical: 14, paddingHorizontal: 10 },
    logoutText: { marginLeft: 10, fontWeight: theme.typography.weights.medium },
  });
}
