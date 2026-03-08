import React from 'react';
import { View, Image, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import theme from '../../constants/theme';
import Typography from './ui/Typography';

const alfredLogo = require('../../assets/alfred-logo.png');

type Props = {
  userName: string;
  activeNav: string;
  onNavPress: (tab: string) => void;
  onMonthPress: () => void;
  monthLabel: string;
  isNative?: boolean;
  onLogout?: () => void;
};

const NAV_ITEMS = [
  { key: 'Home', icon: 'home' as const },
  { key: 'Spending', icon: 'bar-chart-2' as const },
  { key: 'Savings', icon: 'trending-down' as const },
] as const;

export default function TopBar({
  userName,
  activeNav,
  onNavPress,
  onMonthPress,
  monthLabel,
  isNative,
  onLogout,
}: Props) {
  const t = theme;

  const accentFor = (key: string) =>
    key === 'Spending' ? t.colors.primary :
    key === 'Savings' ? t.colors.success :
    t.colors.text;

  if (isNative) {
    return (
      <View style={styles.nativeBar}>
        <View style={styles.nativeBrand}>
          <Image source={alfredLogo} style={styles.nativeBrandLogo} resizeMode="contain" />
          <Typography variant="title" style={styles.nativeBrandName}>Alfred</Typography>
        </View>
        <View style={styles.nativeRight}>
          <Pressable onPress={onMonthPress} style={styles.nativeMonthBtn}>
            <Feather name="calendar" size={14} color={t.colors.primary} />
            <Typography variant="caption" style={styles.nativeMonthText} numberOfLines={1}>
              {monthLabel}
            </Typography>
          </Pressable>
          {onLogout && (
            <Pressable onPress={onLogout} style={styles.nativeIconBtn} hitSlop={8}>
              <Feather name="log-out" size={18} color={t.colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.bar}>
      {/* ──── Left: Brand ──── */}
      <Pressable
        onPress={() => onNavPress('Home')}
        style={({ pressed, hovered }) => [
          styles.brandBtn,
          hovered && styles.brandBtnHover,
          pressed && styles.pressDown,
        ]}
      >
        <Image source={alfredLogo} style={styles.brandLogo} resizeMode="contain" />
        <Typography variant="title" style={styles.brandName}>Alfred</Typography>
      </Pressable>

      {/* ──── Center: All 4 nav items grouped ──── */}
      <View style={styles.navGroup}>
        {NAV_ITEMS.map(item => {
          const active = activeNav === item.key;
          const accent = accentFor(item.key);
          const hasDefaultAccent = item.key === 'Spending' || item.key === 'Savings';
          return (
            <Pressable
              key={item.key}
              onPress={() => onNavPress(item.key)}
              style={({ pressed, hovered }) => [
                styles.navPill,
                hasDefaultAccent && !active && styles.navPillTinted,
                hasDefaultAccent && !active && (item.key === 'Spending' ? styles.navPillSpendDefault : styles.navPillSaveDefault),
                active && styles.navPillActive,
                active && { borderColor: accent, shadowColor: accent },
                hovered && !active && styles.navPillHover,
                pressed && styles.pressDown,
              ]}
            >
              <Feather
                name={item.icon}
                size={15}
                color={active ? accent : hasDefaultAccent ? accent : t.colors.textSecondary}
              />
              <Typography
                variant="bodySmall"
                style={[
                  styles.navText,
                  hasDefaultAccent && !active && { color: accent },
                  active && { color: accent, fontFamily: 'Jost_700Bold' },
                ]}
              >
                {item.key}
              </Typography>
            </Pressable>
          );
        })}
        <View style={styles.navDivider} />
        <Pressable
          onPress={onMonthPress}
          style={({ pressed, hovered }) => [
            styles.monthPill,
            hovered && styles.monthPillHover,
            pressed && styles.pressDown,
          ]}
        >
          <Feather name="calendar" size={15} color={t.colors.primary} />
          <Typography variant="bodySmall" style={styles.monthText}>{monthLabel}</Typography>
          <Feather name="chevron-down" size={13} color={t.colors.textSecondary} />
        </Pressable>
      </View>

      {/* ──── Right: Account ──── */}
      <View style={styles.accountRow}>
        <View style={styles.avatar}>
          <Typography variant="caption" style={styles.avatarText}>
            {(userName || 'U')[0].toUpperCase()}
          </Typography>
        </View>
        {onLogout && (
          <Pressable onPress={onLogout} style={({ hovered }) => [styles.logoutBtn, hovered && styles.logoutBtnHover]}>
            <Feather name="log-out" size={14} color={t.colors.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const t = theme;
const styles = StyleSheet.create({
  nativeBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing.lg,
  },
  nativeBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nativeBrandName: {
    color: t.colors.text,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  nativeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  nativeMonthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: t.colors.white,
    borderWidth: 1,
    borderColor: t.colors.border,
    maxWidth: 140,
  },
  nativeMonthText: {
    color: t.colors.text,
    fontFamily: 'Jost_500Medium',
  },
  nativeIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  brandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  brandBtnHover: {
    opacity: 0.8,
  },
  brandLogo: {
    width: 52,
    height: 52,
  },
  brandName: {
    color: t.colors.text,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  nativeBrandLogo: {
    width: 42,
    height: 42,
  },
  navGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: t.colors.white,
  },
  navPillTinted: {
    borderWidth: 1,
  },
  navPillSpendDefault: {
    borderColor: 'rgba(231, 116, 73, 0.25)',
  },
  navPillSaveDefault: {
    borderColor: 'rgba(63, 150, 75, 0.25)',
  },
  navPillActive: {
    borderWidth: 1.5,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  navPillHover: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    transform: [{ translateY: -1 }],
  },
  navText: {
    color: t.colors.textSecondary,
    fontFamily: 'Jost_500Medium',
  },
  navDivider: {
    width: 1,
    height: 20,
    backgroundColor: t.colors.border,
    marginHorizontal: 4,
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: t.colors.white,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  monthPillHover: {
    borderColor: t.colors.primary,
    transform: [{ translateY: -1 }],
  },
  monthText: {
    color: t.colors.text,
    fontFamily: 'Jost_500Medium',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: t.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  avatarText: {
    color: t.colors.primary,
    fontFamily: 'Jost_700Bold',
  },
  logoutBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnHover: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  pressDown: {
    transform: [{ scale: 0.97 }],
  },
});
