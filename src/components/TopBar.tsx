import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

type Props = {
  userName: string;
  userRole: string;
  viewingLabel?: string;
  sidebarOpen?: boolean;
  onMenuPress?: () => void;
  isNative?: boolean;
};

export default function TopBar({ userName, userRole, viewingLabel, sidebarOpen = true, onMenuPress, isNative }: Props) {
  if (isNative) {
    return (
      <View style={nativeStyles.bar}>
        <Pressable
          style={nativeStyles.menuBtn}
          onPress={onMenuPress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Open menu"
        >
          <Feather name="menu" size={24} color={Colors.text} />
        </Pressable>
        <View style={nativeStyles.center}>
          <Text style={nativeStyles.title} numberOfLines={1}>
            {viewingLabel ?? 'LeanLedger'}
          </Text>
        </View>
        <Pressable style={nativeStyles.avatarBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="user" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>
    );
  }

  // Web layout (unchanged)
  return (
    <View style={styles.container}>
      <Pressable style={styles.menuBtn} onPress={onMenuPress} accessibilityLabel={sidebarOpen ? 'Close menu' : 'Open menu'}>
        <Feather name={sidebarOpen ? 'chevron-left' : 'menu'} size={22} color={Colors.text} />
      </Pressable>
      {viewingLabel ? (
        <View style={styles.viewingChip}>
          <Feather name="folder" size={14} color={Colors.primary} />
          <Text style={styles.viewingText}>{viewingLabel}</Text>
        </View>
      ) : null}
      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search subscriptions, vendors, or insights..."
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.iconBtn}>
          <Feather name="bell" size={20} color={Colors.textSecondary} />
          <View style={styles.badge} />
        </Pressable>
        <Pressable style={styles.iconBtn}>
          <Feather name="settings" size={20} color={Colors.textSecondary} />
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.profile}>
          <View>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userRole}>{userRole}</Text>
          </View>
          <View style={styles.avatar}>
            <Feather name="user" size={20} color={Colors.textSecondary} />
          </View>
        </View>
      </View>
    </View>
  );
}

const nativeStyles = StyleSheet.create({
  bar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  menuBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.inputBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const styles = StyleSheet.create({
  container: {
    height: 68,
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  viewingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
  },
  viewingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 480,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: Typography.body.fontSize,
    color: Colors.text,
    outlineStyle: 'none',
  } as any,
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'right',
  },
  userRole: {
    fontSize: Typography.chart.legend,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
