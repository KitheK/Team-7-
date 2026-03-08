import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { supabase } from '../../lib/supabase';
import type { NegotiationTone } from '../context/WorkspaceContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  vendorName?: string;
  workspaceId?: string | null;
  annualSpend?: number;
  onCallStarted?: (negotiationId: string) => void;
};

type Step = 'form' | 'loading-brief' | 'brief-preview' | 'calling' | 'success' | 'error';

const TONES: { key: NegotiationTone; label: string; desc: string }[] = [
  { key: 'collaborative', label: 'Collaborative', desc: 'Warm, partnership-oriented' },
  { key: 'assertive', label: 'Assertive', desc: 'Direct, data-driven' },
  { key: 'firm', label: 'Firm', desc: 'Professional, uncompromising' },
];

export default function ScheduleAICallModal({
  visible,
  onClose,
  vendorName = '',
  workspaceId,
  annualSpend,
  onCallStarted,
}: Props) {
  const [step, setStep] = useState<Step>('form');
  const [vendor, setVendor] = useState(vendorName);
  const [phone, setPhone] = useState('');
  const [tone, setTone] = useState<NegotiationTone>('collaborative');
  const [brief, setBrief] = useState<any>(null);
  const [negotiationId, setNegotiationId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible) {
      setVendor(vendorName);
      setPhone('');
      setTone('collaborative');
      setBrief(null);
      setNegotiationId(null);
      setErrorMsg('');
      setStep('form');
    }
  }, [visible, vendorName]);

  const handleGenerateBrief = async () => {
    if (!supabase || !vendor.trim()) return;
    setStep('loading-brief');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const url = process.env.EXPO_PUBLIC_SUPABASE_URL;

      const res = await fetch(`${url}/functions/v1/negotiations-brief`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vendor_name: vendor,
          workspace_id: workspaceId,
          threshold: 1000,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Failed to generate brief');
        setStep('error');
        return;
      }

      setBrief(data.brief);
      if (data.negotiations?.[0]?.id) {
        setNegotiationId(data.negotiations[0].id);
      }
      setStep('brief-preview');
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Network error');
      setStep('error');
    }
  };

  const handleStartCall = async () => {
    if (!supabase || !negotiationId || !phone.trim()) return;
    setStep('calling');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const url = process.env.EXPO_PUBLIC_SUPABASE_URL;

      const res = await fetch(`${url}/functions/v1/negotiations-start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          negotiation_id: negotiationId,
          vendor_name: vendor,
          vendor_phone: phone,
          tone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Failed to start call');
        setStep('error');
        return;
      }

      setStep('success');
      onCallStarted?.(negotiationId);
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Network error');
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('form');
    onClose();
  };

  const briefVendor = brief?.vendors?.[0] ?? brief;
  const talkingPoints: string[] = briefVendor?.talking_points ?? [];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false}>

            {/* ── Step 1: Form ── */}
            {step === 'form' && (
              <>
                <View style={styles.header}>
                  <View style={styles.iconWrap}>
                    <Feather name="phone-call" size={24} color={Colors.primary} />
                  </View>
                  <Text style={styles.title}>Start AI negotiation call</Text>
                  <Text style={styles.subtitle}>
                    Generate an AI brief, review talking points, then launch the call.
                  </Text>
                </View>

                <Text style={styles.label}>Vendor name</Text>
                <TextInput
                  style={styles.input}
                  value={vendor}
                  onChangeText={setVendor}
                  placeholder="e.g. AWS, Salesforce"
                  placeholderTextColor={Colors.textTertiary}
                />

                <Text style={[styles.label, { marginTop: 16 }]}>Vendor phone number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="phone-pad"
                />

                <Text style={[styles.label, { marginTop: 16 }]}>Negotiation tone</Text>
                <View style={styles.toneRow}>
                  {TONES.map(t => (
                    <Pressable
                      key={t.key}
                      style={[styles.toneChip, tone === t.key && styles.toneChipActive]}
                      onPress={() => setTone(t.key)}
                    >
                      <Text style={[styles.toneLabel, tone === t.key && styles.toneLabelActive]}>
                        {t.label}
                      </Text>
                      <Text style={[styles.toneDesc, tone === t.key && styles.toneDescActive]}>
                        {t.desc}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.footer}>
                  <Pressable style={styles.cancelBtn} onPress={handleClose}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.primaryButton, !vendor.trim() && styles.disabledBtn]}
                    onPress={handleGenerateBrief}
                    disabled={!vendor.trim()}
                  >
                    <Feather name="zap" size={16} color={Colors.white} />
                    <Text style={styles.primaryButtonText}>Generate brief</Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* ── Loading brief ── */}
            {step === 'loading-brief' && (
              <View style={styles.centeredState}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingTitle}>Analyzing vendor data...</Text>
                <Text style={styles.loadingSubtitle}>
                  Generating negotiation brief with AI
                </Text>
              </View>
            )}

            {/* ── Step 2: Brief preview ── */}
            {step === 'brief-preview' && (
              <>
                <View style={styles.header}>
                  <View style={[styles.iconWrap, styles.iconWrapSuccess]}>
                    <Feather name="check-circle" size={24} color={Colors.success} />
                  </View>
                  <Text style={styles.title}>Brief ready</Text>
                </View>

                {briefVendor && (
                  <View style={styles.briefCard}>
                    <View style={styles.briefRow}>
                      <Text style={styles.briefLabel}>Target discount</Text>
                      <Text style={styles.briefValue}>{briefVendor.discount_target_pct ?? 15}%</Text>
                    </View>
                    {briefVendor.target_price != null && (
                      <View style={styles.briefRow}>
                        <Text style={styles.briefLabel}>Target price</Text>
                        <Text style={styles.briefValue}>${Number(briefVendor.target_price).toLocaleString()}</Text>
                      </View>
                    )}
                    {talkingPoints.length > 0 && (
                      <>
                        <Text style={[styles.briefLabel, { marginTop: 12, marginBottom: 6 }]}>Talking points</Text>
                        {talkingPoints.map((pt, i) => (
                          <View key={i} style={styles.talkingPoint}>
                            <Text style={styles.tpNumber}>{i + 1}</Text>
                            <Text style={styles.tpText}>{pt}</Text>
                          </View>
                        ))}
                      </>
                    )}
                  </View>
                )}

                {!phone.trim() && (
                  <>
                    <Text style={[styles.label, { marginTop: 8 }]}>Vendor phone number</Text>
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="+1 (555) 123-4567"
                      placeholderTextColor={Colors.textTertiary}
                      keyboardType="phone-pad"
                    />
                  </>
                )}

                <View style={styles.footer}>
                  <Pressable style={styles.cancelBtn} onPress={() => setStep('form')}>
                    <Text style={styles.cancelText}>Back</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.primaryButton, !phone.trim() && styles.disabledBtn]}
                    onPress={handleStartCall}
                    disabled={!phone.trim()}
                  >
                    <Feather name="phone-call" size={16} color={Colors.white} />
                    <Text style={styles.primaryButtonText}>Start call now</Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* ── Calling ── */}
            {step === 'calling' && (
              <View style={styles.centeredState}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingTitle}>Placing call...</Text>
                <Text style={styles.loadingSubtitle}>
                  Generating script and connecting to {vendor}
                </Text>
              </View>
            )}

            {/* ── Success ── */}
            {step === 'success' && (
              <View style={styles.centeredState}>
                <View style={[styles.iconWrap, styles.iconWrapSuccess]}>
                  <Feather name="phone-call" size={32} color={Colors.success} />
                </View>
                <Text style={styles.successTitle}>Call started</Text>
                <Text style={styles.successSubtitle}>
                  The AI agent is now negotiating with {vendor}. Watch the live transcript below.
                </Text>
                <Pressable style={styles.doneBtn} onPress={handleClose}>
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              </View>
            )}

            {/* ── Error ── */}
            {step === 'error' && (
              <View style={styles.centeredState}>
                <View style={[styles.iconWrap, styles.iconWrapError]}>
                  <Feather name="alert-circle" size={32} color={Colors.danger} />
                </View>
                <Text style={styles.errorTitle}>Something went wrong</Text>
                <Text style={styles.errorSubtitle}>{errorMsg}</Text>
                <Pressable style={styles.retryBtn} onPress={() => setStep('form')}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            )}

          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 24,
  },
  header: { alignItems: 'center', marginBottom: 24 },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(30, 64, 175, 0.08)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  iconWrapSuccess: { backgroundColor: 'rgba(22, 163, 74, 0.1)' },
  iconWrapError: { backgroundColor: 'rgba(220, 38, 38, 0.1)' },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: Colors.inputBg, borderRadius: 10, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.text,
  },
  toneRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  toneChip: {
    flex: 1, padding: 12, borderRadius: 10, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.inputBg,
  },
  toneChipActive: { borderColor: Colors.primary, backgroundColor: 'rgba(30, 64, 175, 0.06)' },
  toneLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  toneLabelActive: { color: Colors.primary },
  toneDesc: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  toneDescActive: { color: Colors.primary },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  cancelBtn: { paddingVertical: 10 },
  cancelText: { fontSize: 14, color: Colors.textSecondary },
  primaryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  primaryButtonText: { fontSize: 14, fontWeight: '600', color: Colors.white },
  disabledBtn: { opacity: 0.5 },
  centeredState: { alignItems: 'center', paddingVertical: 32 },
  loadingTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 20 },
  loadingSubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
  briefCard: {
    backgroundColor: Colors.inputBg, borderRadius: 12, padding: 16, marginBottom: 16,
  },
  briefRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6,
  },
  briefLabel: { fontSize: 13, color: Colors.textSecondary },
  briefValue: { fontSize: 15, fontWeight: '700', color: Colors.text },
  talkingPoint: { flexDirection: 'row', gap: 10, paddingVertical: 6 },
  tpNumber: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary,
    color: Colors.white, fontSize: 12, fontWeight: '700',
    textAlign: 'center', lineHeight: 22,
  },
  tpText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 20 },
  successTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: 16 },
  successSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 16 },
  doneBtn: {
    marginTop: 24, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.primary,
  },
  doneText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  errorTitle: { fontSize: 20, fontWeight: '700', color: Colors.danger, marginTop: 16 },
  errorSubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 16 },
  retryBtn: {
    marginTop: 24, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.primary,
  },
  retryText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
