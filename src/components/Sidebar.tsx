import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useWorkspace, workspaceLabel, OVERVIEW_ID } from '../context/WorkspaceContext';
import NewWorkspaceModal from './NewWorkspaceModal';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

type NavItem = {
  label: string;
  key: string;
  icon: keyof typeof Feather.glyphMap;
};

const mainNav: NavItem[] = [
  { label: 'Home', key: 'Dashboard', icon: 'grid' },
  { label: 'Recurring bills', key: 'Subscriptions', icon: 'file-text' },
  { label: 'Unexpected price increases', key: 'Price Creep', icon: 'trending-up' },
  { label: 'Where your money went', key: 'Spend Categories', icon: 'pie-chart' },
  { label: 'Who you pay', key: 'Vendor Analytics', icon: 'bar-chart-2' },
  { label: 'Negotiate & save', key: 'Vendor Negotiations', icon: 'phone-call' },
  { label: 'Cancel duplicates', key: 'Automated Cancellation', icon: 'x-circle' },
  { label: 'Ideas to save', key: 'AI Recommendations', icon: 'zap' },
  { label: 'Your savings', key: 'Savings', icon: 'dollar-sign' },
];

const bottomNav: NavItem[] = [
  { label: 'Notifications', key: 'Notifications', icon: 'bell' },
  { label: 'Settings', key: 'Settings', icon: 'settings' },
];

type Props = {
  activeItem: string;
  onItemPress?: (label: string) => void;
  onLogout?: () => void;
  onClose?: () => void;
};

export default function Sidebar({ activeItem, onItemPress, onLogout, onClose }: Props) {
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, createWorkspace, overviewRange, setOverviewRange } = useWorkspace();
  const isAllMonths = activeWorkspaceId === OVERVIEW_ID;

  const renderItem = (item: NavItem) => {
    const isActive = item.key === activeItem;
    return (
      <Pressable
        key={item.key}
        style={[styles.navItem, isNative && styles.navItemNative, isActive && styles.navItemActive]}
        onPress={() => onItemPress?.(item.key)}
      >
        <Feather
          name={item.icon}
          size={isNative ? 22 : 20}
          color={isActive ? Colors.sidebarActive : Colors.sidebarText}
        />
        <Text style={[styles.navLabel, isNative && styles.navLabelNative, isActive && styles.navLabelActive]} numberOfLines={1}>
          {item.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, isNative && styles.containerNative]}>
      <View style={[styles.logoSection, isNative && styles.logoSectionNative]}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoLetter}>L</Text>
        </View>
        <View style={styles.logoTextWrap}>
          <Text style={styles.logoTitle}>LeanLedger</Text>
          <Text style={styles.logoSubtitle}>Track spending, find savings</Text>
        </View>
      </View>

      <View style={[styles.workspaceSection, isNative && styles.workspaceSectionNative]}>
        <Text style={styles.workspaceSectionTitle}>Your months</Text>
        <ScrollView style={styles.workspaceList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          <Pressable
            style={[styles.workspaceItem, isAllMonths && styles.workspaceItemActive]}
            onPress={() => setActiveWorkspaceId(OVERVIEW_ID)}
          >
            <Feather
              name="layers"
              size={16}
              color={isAllMonths ? Colors.sidebarActive : Colors.sidebarText}
            />
            <Text style={[styles.workspaceLabel, isAllMonths && styles.workspaceLabelActive]} numberOfLines={1}>
              All months
            </Text>
          </Pressable>
          {isAllMonths && (
            <View style={styles.rangeFilter}>
              <Pressable style={[styles.rangeChip, overviewRange === 'all' && styles.rangeChipActive]} onPress={() => setOverviewRange('all')}>
                <Text style={[styles.rangeChipText, overviewRange === 'all' && styles.rangeChipTextActive]}>All</Text>
              </Pressable>
              <Pressable style={[styles.rangeChip, overviewRange === 'last3' && styles.rangeChipActive]} onPress={() => setOverviewRange('last3')}>
                <Text style={[styles.rangeChipText, overviewRange === 'last3' && styles.rangeChipTextActive]}>Last 3</Text>
              </Pressable>
              <Pressable style={[styles.rangeChip, overviewRange === 'last6' && styles.rangeChipActive]} onPress={() => setOverviewRange('last6')}>
                <Text style={[styles.rangeChipText, overviewRange === 'last6' && styles.rangeChipTextActive]}>Last 6</Text>
              </Pressable>
            </View>
          )}
          {workspaces.map((w) => {
            const isActive = w.id === activeWorkspaceId;
            return (
              <Pressable
                key={w.id}
                style={[styles.workspaceItem, isActive && styles.workspaceItemActive]}
                onPress={() => setActiveWorkspaceId(w.id)}
              >
                <Feather
                  name="folder"
                  size={16}
                  color={isActive ? Colors.sidebarActive : Colors.sidebarText}
                />
                <Text style={[styles.workspaceLabel, isActive && styles.workspaceLabelActive]} numberOfLines={1}>
                  {workspaceLabel(w)}
                </Text>
                {isActive && <Text style={styles.workspaceBadge}>${Number(w.total_saved).toLocaleString()}</Text>}
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable style={styles.newWorkspaceBtn} onPress={() => setShowNewWorkspace(true)}>
          <Feather name="plus" size={16} color={Colors.primary} />
          <Text style={styles.newWorkspaceText}>Add a month</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.mainNavScroll}
        contentContainerStyle={styles.mainNavScrollContent}
        showsVerticalScrollIndicator={true}
        bounces={false}
      >
        {mainNav.map(renderItem)}
      </ScrollView>

      <View style={[styles.bottomNav, isNative && styles.bottomNavNative]}>
        {bottomNav.map(renderItem)}
        {onClose && (
          <Pressable style={[styles.navItem, isNative && styles.navItemNative]} onPress={onClose}>
            <Feather name="x" size={isNative ? 22 : 20} color={Colors.sidebarText} />
            <Text style={[styles.navLabel, isNative && styles.navLabelNative]}>Close menu</Text>
          </Pressable>
        )}
        <Pressable style={[styles.navItem, isNative && styles.navItemNative]} onPress={onLogout}>
          <Feather name="log-out" size={isNative ? 22 : 20} color={Colors.sidebarText} />
          <Text style={[styles.navLabel, isNative && styles.navLabelNative]}>Log Out</Text>
        </Pressable>
      </View>

      <NewWorkspaceModal
        visible={showNewWorkspace}
        onClose={() => setShowNewWorkspace(false)}
        onCreate={(month, year) => createWorkspace(month, year)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minWidth: 200,
    flex: 1,
    backgroundColor: Colors.sidebar,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  containerNative: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderRightWidth: 0,
  },
  logoSectionNative: {
    marginBottom: 20,
    paddingTop: 4,
  },
  workspaceSectionNative: {
    marginBottom: 20,
    paddingBottom: 16,
  },
  rangeFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginLeft: 24,
    marginBottom: 8,
  },
  rangeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.inputBg,
  },
  rangeChipActive: {
    backgroundColor: Colors.sidebarActiveBg,
  },
  rangeChipText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  rangeChipTextActive: {
    color: Colors.sidebarActive,
    fontWeight: '600',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.sidebarActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoTextWrap: { flex: 1, minWidth: 0 },
  logoLetter: {
    color: Colors.sidebarActive,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: '700',
  },
  logoTitle: {
    color: Colors.sidebarActive,
    fontSize: 15,
    fontWeight: '700',
  },
  logoSubtitle: {
    color: Colors.sidebarText,
    fontSize: 11,
    marginTop: 1,
  },
  workspaceSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  workspaceSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  workspaceList: {
    maxHeight: 140,
  },
  workspaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2,
  },
  workspaceItemActive: {
    backgroundColor: Colors.sidebarActiveBg,
  },
  workspaceLabel: {
    fontSize: 12,
    color: Colors.sidebarText,
    marginLeft: 6,
    flex: 1,
  },
  workspaceLabelActive: {
    color: Colors.sidebarActive,
    fontWeight: '500',
  },
  workspaceBadge: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
  },
  newWorkspaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  newWorkspaceText: {
    fontSize: 13,
    color: Colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  mainNavScroll: {
    flex: 1,
    minHeight: 0,
  },
  mainNavScrollContent: {
    paddingBottom: 16,
  },
  bottomNav: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
    flexShrink: 0,
  },
  bottomNavNative: {
    paddingTop: 20,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 2,
  },
  navItemNative: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: Colors.sidebarActiveBg,
  },
  navLabel: {
    color: Colors.sidebarText,
    fontSize: 13,
    marginLeft: 10,
    fontWeight: '500',
    flex: 1,
  },
  navLabelNative: {
    fontSize: 16,
    marginLeft: 14,
  },
  navLabelActive: {
    color: Colors.sidebarActive,
  },
});
