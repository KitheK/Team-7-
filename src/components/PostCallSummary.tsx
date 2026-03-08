import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Alert, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import StatusPill from './StatusPill';
import type { Negotiation } from '../context/WorkspaceContext';

type Props = {
  negotiation: Negotiation;
  onViewTranscript: () => void;
};

const OUTCOME_CONFIG: Record<string, { label: string; variant: 'active' | 'priceAlert' | 'cancelled' }> = {
  success: { label: 'Success', variant: 'active' },
  partial: { label: 'Partial agreement', variant: 'priceAlert' },
  rejected: { label: 'Rejected', variant: 'cancelled' },
  no_answer: { label: 'No answer', variant: 'cancelled' },
  error: { label: 'Error', variant: 'cancelled' },
};

export default function PostCallSummary({ negotiation, onViewTranscript }: Props) {
  const outcome = OUTCOME_CONFIG[negotiation.outcome ?? 'error'] ?? OUTCOME_CONFIG.error;
  const savings = negotiation.annual_spend && negotiation.agreed_discount
    ? Math.round(negotiation.annual_spend * (negotiation.agreed_discount / 100))
    : null;

  const handleCopyEmail = () => {
    if (!negotiation.follow_up_email) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(negotiation.follow_up_email);
      Alert.alert('Copied', 'Follow-up email copied to clipboard.');
    } else {
      Linking.openURL(`mailto:?body=${encodeURIComponent(negotiation.follow_up_email)}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.vendorName}>{negotiation.vendor_name}</Text>
          <Text style={styles.date}>
            {new Date(negotiation.updated_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
        <StatusPill label={outcome.label} variant={outcome.variant} />
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Target discount</Text>
          <Text style={styles.gridValue}>{negotiation.target_discount ?? '—'}%</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Agreed discount</Text>
          <Text style={[styles.gridValue, negotiation.agreed_discount ? styles.successText : undefined]}>
            {negotiation.agreed_discount != null ? `${negotiation.agreed_discount}%` : '—'}
          </Text>
        </View>
        {savings != null && (
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Annual savings</Text>
            <Text style={[styles.gridValue, styles.successText]}>${savings.toLocaleString()}</Text>
          </View>
        )}
      </View>

      {savings != null && negotiation.outcome === 'success' && (
        <View style={styles.savingsBanner}>
          <Feather name="trending-up" size={16} color={Colors.success} />
          <Text style={styles.savingsText}>
            ${savings.toLocaleString()} logged to your ROI tracker
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={onViewTranscript}>
          <Feather name="file-text" size={14} color={Colors.primary} />
          <Text style={styles.actionBtnText}>View transcript</Text>
        </Pressable>
        {negotiation.follow_up_email && (
          <Pressable style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={handleCopyEmail}>
            <Feather name="mail" size={14} color={Colors.white} />
            <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>Copy follow-up email</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  vendorName: { fontSize: 17, fontWeight: '700', color: Colors.text },
  date: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  grid: { flexDirection: 'row', marginBottom: 16 },
  gridItem: { flex: 1, marginRight: 12 },
  gridLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  gridValue: { fontSize: 18, fontWeight: '700', color: Colors.text },
  successText: { color: Colors.success },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    marginBottom: 16,
  },
  savingsText: { fontSize: 13, fontWeight: '600', color: Colors.success },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  actionBtnTextPrimary: { color: Colors.white },
});
