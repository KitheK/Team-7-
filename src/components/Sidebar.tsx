import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors, useTheme } from '../context/ThemeContext';
import { useWorkspace, workspaceLabel, OVERVIEW_ID } from '../context/WorkspaceContext';
import NewWorkspaceModal from './NewWorkspaceModal';

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
  const c = useColors();
  const { isDark, toggle } = useTheme();
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, createWorkspace, overviewRange, setOverviewRange } = useWorkspace();
  const isAllMonths = activeWorkspaceId === OVERVIEW_ID;
  const s = useMemo(() => createStyles(c), [c]);

  return (
    <View style={[s.container, isNative && s.containerNative]}>
      <View style={[s.logoSection, isNative && s.logoSectionNative]}>
        <View style={s.logoIcon}>
          <Feather name="layers" size={isNative ? 20 : 18} color={c.primary} />
        </View>
        <View style={s.logoTextWrap}>
          <Text style={s.logoTitle}>LeanLedger</Text>
          <Text style={s.logoSubtitle}>Business finances</Text>
        </View>
        {isNative && onClose && (
          <Pressable onPress={onClose} style={s.closeBtn}>
            <Feather name="x" size={22} color={c.sidebarText} />
          </Pressable>
        )}
      </View>

      <View style={[s.workspaceSection, isNative && s.workspaceSectionNative]}>
        <Text style={s.sectionLabel}>MONTHS</Text>
        <ScrollView style={s.workspaceList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          <Pressable
            style={[s.workspaceItem, isAllMonths && s.workspaceItemActive]}
            onPress={() => setActiveWorkspaceId(OVERVIEW_ID)}
          >
            <Feather name="layers" size={14} color={isAllMonths ? c.primary : c.sidebarText} />
            <Text style={[s.workspaceLabel, isAllMonths && s.workspaceLabelActive]}>All months</Text>
          </Pressable>
          {isAllMonths && (
            <View style={s.rangeFilter}>
              {(['all', 'last3', 'last6'] as const).map((range) => (
                <Pressable
                  key={range}
                  style={[s.rangeChip, overviewRange === range && s.rangeChipActive]}
                  onPress={() => setOverviewRange(range)}
                >
                  <Text style={[s.rangeChipText, overviewRange === range && s.rangeChipTextActive]}>
                    {range === 'all' ? 'All' : range === 'last3' ? 'Last 3' : 'Last 6'}
                  </Text>
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
                <Feather name="calendar" size={14} color={active ? c.primary : c.sidebarText} />
                <Text style={[s.workspaceLabel, active && s.workspaceLabelActive]}>{workspaceLabel(w)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable style={s.addMonthBtn} onPress={() => setShowNewWorkspace(true)}>
          <Feather name="plus" size={14} color={c.primary} />
          <Text style={s.addMonthText}>Add a month</Text>
        </Pressable>
      </View>

      <Text style={s.sectionLabel}>MENU</Text>
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
              color={isActive ? c.primary : c.sidebarText}
            />
            <Text style={[s.navLabel, isNative && s.navLabelNative, isActive && s.navLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}

      <View style={s.spacer} />

      <Pressable style={s.themeBtn} onPress={toggle}>
        <Feather name={isDark ? 'sun' : 'moon'} size={16} color={c.sidebarText} />
        <Text style={s.themeBtnText}>{isDark ? 'Light mode' : 'Dark mode'}</Text>
      </Pressable>

      <Pressable style={[s.logoutBtn, isNative && s.logoutBtnNative]} onPress={onLogout}>
        <Feather name="log-out" size={isNative ? 20 : 16} color={c.sidebarText} />
        <Text style={s.logoutText}>Log out</Text>
      </Pressable>

      <NewWorkspaceModal
        visible={showNewWorkspace}
        onClose={() => setShowNewWorkspace(false)}
        onCreate={(month, year) => createWorkspace(month, year)}
      />
    </View>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      width: '100%', minWidth: 200, flex: 1, backgroundColor: c.sidebar,
      paddingVertical: 20, paddingHorizontal: 14, borderRightWidth: 1, borderRightColor: c.border,
    },
    containerNative: { paddingTop: 8, paddingBottom: 12, paddingHorizontal: 16, borderRightWidth: 0 },
    logoSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingHorizontal: 4 },
    logoSectionNative: { marginBottom: 20, paddingTop: 4 },
    logoIcon: {
      width: 36, height: 36, borderRadius: 10, backgroundColor: c.primaryLight,
      alignItems: 'center', justifyContent: 'center', marginRight: 10,
    },
    logoTextWrap: { flex: 1, minWidth: 0 },
    logoTitle: { color: c.text, fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
    logoSubtitle: { color: c.textTertiary, fontSize: 11, marginTop: 1 },
    closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    sectionLabel: {
      fontSize: 10, fontWeight: '700', color: c.textTertiary,
      letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 8,
    },
    workspaceSection: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: c.border },
    workspaceSectionNative: { marginBottom: 20, paddingBottom: 16 },
    workspaceList: { maxHeight: 140 },
    workspaceItem: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 8,
      borderRadius: 8, marginBottom: 2,
    },
    workspaceItemActive: { backgroundColor: c.primaryLight },
    workspaceLabel: { fontSize: 12, color: c.sidebarText, marginLeft: 8, flex: 1 },
    workspaceLabelActive: { color: c.primary, fontWeight: '600' },
    rangeFilter: { flexDirection: 'row', gap: 4, marginLeft: 28, marginBottom: 6 },
    rangeChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: c.inputBg },
    rangeChipActive: { backgroundColor: c.primaryLight },
    rangeChipText: { fontSize: 11, color: c.textTertiary },
    rangeChipTextActive: { color: c.primary, fontWeight: '600' },
    addMonthBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 8, marginTop: 4 },
    addMonthText: { fontSize: 12, color: c.primary, marginLeft: 6, fontWeight: '500' },
    navItem: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10,
      borderRadius: 10, marginBottom: 2,
    },
    navItemNative: { paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4 },
    navItemActive: { backgroundColor: c.primaryLight },
    navItemPressed: { opacity: 0.7 },
    navLabel: { color: c.sidebarText, fontSize: 13, fontWeight: '600', marginLeft: 10 },
    navLabelNative: { fontSize: 16, marginLeft: 14 },
    navLabelActive: { color: c.primary },
    spacer: { flex: 1 },
    themeBtn: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10,
      borderRadius: 8, marginBottom: 4,
    },
    themeBtnText: { color: c.sidebarText, fontSize: 12, marginLeft: 8, fontWeight: '500' },
    logoutBtn: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8,
      borderRadius: 8, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 12,
    },
    logoutBtnNative: { paddingVertical: 14, paddingHorizontal: 10 },
    logoutText: { color: c.sidebarText, fontSize: 13, marginLeft: 10, fontWeight: '500' },
  });
}
