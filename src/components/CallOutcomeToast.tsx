import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export type CallOutcomeData = {
  vendorName: string;
  outcome: 'success' | 'partial' | 'rejected' | 'no_answer' | 'error';
  agreedDiscount?: number | null;
  annualSpend?: number | null;
};

type Props = {
  data: CallOutcomeData | null;
  onDismiss: () => void;
};

export default function CallOutcomeToast({ data, onDismiss }: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!data) return;

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [data]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  if (!data) return null;

  const isSuccess = data.outcome === 'success' || data.outcome === 'partial';
  const savings = data.annualSpend && data.agreedDiscount
    ? Math.round(data.annualSpend * (data.agreedDiscount / 100))
    : null;

  let icon: 'trending-up' | 'minus-circle' | 'alert-circle' = 'trending-up';
  let color = Colors.success;
  let title = '';
  let message = '';

  switch (data.outcome) {
    case 'success':
      title = 'Negotiation successful!';
      message = data.agreedDiscount
        ? `${data.vendorName} agreed to a ${data.agreedDiscount}% discount${savings ? ` — saving ~$${savings.toLocaleString()}/yr` : ''}`
        : `${data.vendorName} agreed to your terms`;
      break;
    case 'partial':
      icon = 'trending-up';
      color = Colors.warning;
      title = 'Partial agreement';
      message = data.agreedDiscount
        ? `${data.vendorName} offered ${data.agreedDiscount}% (below target)${savings ? ` — ~$${savings.toLocaleString()}/yr` : ''}`
        : `${data.vendorName} offered a partial discount`;
      break;
    case 'rejected':
      icon = 'minus-circle';
      color = Colors.danger;
      title = 'Discount declined';
      message = `${data.vendorName} did not agree to a discount this time`;
      break;
    case 'no_answer':
      icon = 'alert-circle';
      color = Colors.textTertiary;
      title = 'No answer';
      message = `Could not reach ${data.vendorName} — try again later`;
      break;
    default:
      icon = 'alert-circle';
      color = Colors.danger;
      title = 'Call ended with error';
      message = `Something went wrong during the ${data.vendorName} call`;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + '1A' }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      <Pressable
        onPress={handleDismiss}
        hitSlop={16}
        style={styles.closeBtn}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
      >
        <Feather name="x" size={18} color={Colors.textTertiary} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 24 : 60,
    right: 24,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    maxWidth: 420,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  message: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  closeBtn: {
    padding: 4,
  },
});
