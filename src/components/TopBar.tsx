import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';

type Props = {
  userName: string;
  userRole: string;
  viewingLabel?: string;
  sidebarOpen?: boolean;
  onMenuPress?: () => void;
  isNative?: boolean;
};

export default function TopBar({ userName, viewingLabel, sidebarOpen = true, onMenuPress, isNative }: Props) {
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);

  if (isNative) {
    return (
      <View style={s.nativeBar}>
        <Pressable style={s.nativeMenuBtn} onPress={onMenuPress} hitSlop={12} accessibilityLabel="Open menu">
          <Feather name="menu" size={24} color={c.text} />
        </Pressable>
        <View style={s.nativeCenter}>
          <Text style={s.nativeTitle} numberOfLines={1}>{viewingLabel ?? 'LeanLedger'}</Text>
        </View>
        <View style={s.nativeAvatar}>
          <Text style={s.avatarText}>{(userName || 'U')[0].toUpperCase()}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Pressable style={s.menuBtn} onPress={onMenuPress} accessibilityLabel={sidebarOpen ? 'Close menu' : 'Open menu'}>
        <Feather name={sidebarOpen ? 'chevron-left' : 'menu'} size={20} color={c.text} />
      </Pressable>
      {viewingLabel ? (
        <View style={s.viewingChip}>
          <Feather name="calendar" size={14} color={c.primary} />
          <Text style={s.viewingText}>{viewingLabel}</Text>
        </View>
      ) : null}
      <View style={s.spacer} />
      <View style={s.profile}>
        <Text style={s.greeting}>Hey, {userName}</Text>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(userName || 'U')[0].toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    nativeBar: {
      height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
      backgroundColor: c.background, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border,
    },
    nativeMenuBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    nativeCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
    nativeTitle: { fontSize: 17, fontWeight: '600', color: c.text },
    nativeAvatar: {
      width: 32, height: 32, borderRadius: 16, backgroundColor: c.primaryLight,
      alignItems: 'center', justifyContent: 'center',
    },
    container: {
      height: 60, backgroundColor: c.background, flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    menuBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    viewingChip: {
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 8, backgroundColor: c.primaryLight,
    },
    viewingText: { fontSize: 13, fontWeight: '600', color: c.primary, marginLeft: 6 },
    spacer: { flex: 1 },
    profile: { flexDirection: 'row', alignItems: 'center' },
    greeting: { fontSize: 14, fontWeight: '500', color: c.textSecondary, marginRight: 10 },
    avatar: {
      width: 34, height: 34, borderRadius: 17, backgroundColor: c.primaryLight,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: 14, fontWeight: '700', color: c.primary },
  });
}
