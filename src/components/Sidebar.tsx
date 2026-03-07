import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

type NavItem = {
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

const mainNav: NavItem[] = [
  { label: 'Dashboard', icon: 'grid' },
  { label: 'Subscriptions', icon: 'file-text' },
  { label: 'Price Creep', icon: 'trending-up' },
  { label: 'Spend Categories', icon: 'pie-chart' },
  { label: 'Vendor Analytics', icon: 'bar-chart-2' },
  { label: 'Vendor Negotiations', icon: 'phone-call' },
  { label: 'Automated Cancellation', icon: 'x-circle' },
  { label: 'AI Recommendations', icon: 'zap' },
  { label: 'Savings', icon: 'dollar-sign' },
];

const bottomNav: NavItem[] = [
  { label: 'Notifications', icon: 'bell' },
  { label: 'Settings', icon: 'settings' },
];

type Props = {
  activeItem: string;
  onItemPress?: (label: string) => void;
  onLogout?: () => void;
};

export default function Sidebar({ activeItem, onItemPress, onLogout }: Props) {
  const renderItem = (item: NavItem) => {
    const isActive = item.label === activeItem;
    return (
      <Pressable
        key={item.label}
        style={[styles.navItem, isActive && styles.navItemActive]}
        onPress={() => onItemPress?.(item.label)}
      >
        <Feather
          name={item.icon}
          size={20}
          color={isActive ? Colors.sidebarActive : Colors.sidebarText}
        />
        <Text style={[styles.navLabel, isActive && styles.navLabelActive]} numberOfLines={1}>
          {item.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoSection}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoLetter}>F</Text>
        </View>
        <View style={styles.logoTextWrap}>
          <Text style={styles.logoTitle}>FinOptima</Text>
          <Text style={styles.logoSubtitle}>Cost Intelligence</Text>
        </View>
      </View>

      <View style={styles.mainNav}>
        {mainNav.map(renderItem)}
      </View>

      <View style={styles.bottomNav}>
        {bottomNav.map(renderItem)}
        <Pressable style={styles.navItem} onPress={onLogout}>
          <Feather name="log-out" size={20} color={Colors.sidebarText} />
          <Text style={styles.navLabel}>Log Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    backgroundColor: Colors.sidebar,
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.sidebarActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoTextWrap: { flex: 1, minWidth: 0 },
  logoLetter: {
    color: Colors.sidebarActive,
    fontSize: Typography.cardTitle.fontSize + 2,
    fontWeight: '700',
  },
  logoTitle: {
    color: Colors.sidebarActive,
    fontSize: Typography.cardTitle.fontSize + 2,
    fontWeight: '700',
  },
  logoSubtitle: {
    color: Colors.sidebarText,
    fontSize: Typography.chart.centerSecondary,
    marginTop: 1,
  },
  mainNav: {
    flex: 1,
  },
  bottomNav: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: Colors.sidebarActiveBg,
  },
  navLabel: {
    color: Colors.sidebarText,
    fontSize: Typography.body.fontSize,
    marginLeft: 14,
    fontWeight: '500',
    flex: 1,
  },
  navLabelActive: {
    color: Colors.sidebarActive,
  },
});
