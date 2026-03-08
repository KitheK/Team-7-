import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { OVERVIEW_ID, useWorkspace, type NegotiationTone } from '../context/WorkspaceContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  vendorName?: string;
  workspaceId?: string | null;
  annualSpend?: number;
  onCallStarted?: (negotiationId: string) => Promise<void> | void;
};

type Step = 'form' | 'loading-brief' | 'brief-preview' | 'calling' | 'success' | 'error';

const TONES: { key: NegotiationTone; label: string; desc: string }[] = [
  { key: 'collaborative', label: 'Collaborative', desc: 'Warm, partnership-oriented' },
  { key: 'assertive', label: 'Assertive', desc: 'Direct, data-driven' },
  { key: 'firm', label: 'Firm', desc: 'Professional, uncompromising' },
];

const AI_FLOW_STEPS = [
  { icon: 'search', title: 'Analyze spend', desc: 'Pull workspace context and vendor history.' },
  { icon: 'radio', title: 'Build brief', desc: 'Generate a negotiation plan with target pricing.' },
  { icon: 'phone-call', title: 'Place the call', desc: 'Launch the AI agent and track the outcome.' },
] as const;

export default function ScheduleAICallModal({
  visible,
  onClose,
  vendorName = '',
  workspaceId,
  annualSpend,
  onCallStarted,
}: Props) {
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);
  const { isDemoMode } = useWorkspace();
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

  const hasValidWorkspace = Boolean(workspaceId && workspaceId !== OVERVIEW_ID);
  const normalizedPhone = normalizePhoneNumber(phone);

  const handleGenerateBrief = async () => {
    if (!supabase) {
      setErrorMsg('Supabase is not configured. Check your .env file.');
      setStep('error');
      return;
    }
    if (isDemoMode) {
      setErrorMsg('AI calls require a signed-in account. Sign in first, then try again.');
      setStep('error');
      return;
    }
    if (!vendor.trim()) {
      setErrorMsg('Enter a vendor name to generate the negotiation brief.');
      setStep('error');
      return;
    }
    if (!hasValidWorkspace) {
      setErrorMsg('Select a specific month on the left before starting an AI call.');
      setStep('error');
      return;
    }

    setStep('loading-brief');

    try {
      const { data, error } = await supabase.functions.invoke('negotiations-brief', {
        body: {
          vendor_name: vendor,
          workspace_id: workspaceId,
          threshold: 1000,
        },
      });

      if (error) {
        setErrorMsg(await extractFunctionError(error, 'Failed to generate brief'));
        setStep('error');
        return;
      }

      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      setBrief(parsed.brief);
      if (parsed.negotiations?.[0]?.id) {
        setNegotiationId(parsed.negotiations[0].id);
      }
      setStep('brief-preview');
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Failed to generate brief');
      setStep('error');
    }
  };

  const createNegotiationFallback = async () => {
    if (!supabase) throw new Error('Supabase is not configured.');
    if (!hasValidWorkspace || !workspaceId) {
      throw new Error('Select a specific month before starting an AI call.');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error(userError?.message ?? 'You must be signed in to start a call.');
    }

    const fallbackBrief = briefVendor ?? brief ?? {};
    const { data, error } = await supabase
      .from('negotiations')
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        vendor_name: vendor.trim(),
        vendor_phone: normalizedPhone,
        tone,
        target_discount: fallbackBrief.discount_target_pct ?? 15,
        annual_spend: fallbackBrief.annual_spend ?? annualSpend ?? null,
        brief: fallbackBrief,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error || !data?.id) {
      throw new Error(error?.message ?? 'Failed to create the negotiation record.');
    }

    setNegotiationId(data.id);
    return data.id as string;
  };

  const handleStartCall = async () => {
    if (!supabase) {
      setErrorMsg('Supabase is not configured. Check your .env file.');
      setStep('error');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Enter the vendor phone number to call.');
      setStep('error');
      return;
    }
    if (!isValidPhoneNumber(phone)) {
      setErrorMsg('Enter a valid phone number, e.g. +14155550123.');
      setStep('error');
      return;
    }

    setStep('calling');

    try {
      const resolvedNegotiationId = negotiationId ?? await createNegotiationFallback();

      const { data, error } = await supabase.functions.invoke('negotiations-start', {
        body: {
          negotiation_id: resolvedNegotiationId,
          vendor_name: vendor,
          vendor_phone: normalizedPhone,
          tone,
        },
      });

      if (error) {
        setErrorMsg(await extractFunctionError(error, 'Failed to start call'));
        setStep('error');
        return;
      }

      setStep('success');
      onCallStarted?.(resolvedNegotiationId);
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Failed to start call');
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={handleClose}>
        <Pressable style={s.card} onPress={e => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false}>

            {step === 'form' && (
              <>
                <View style={s.header}>
                  <View style={s.iconWrap}>
                    <Feather name="radio" size={20} color={c.primary} />
                  </View>
                  <View style={s.headerText}>
                    <Text style={s.title}>AI vendor call</Text>
                    <Text style={s.subtitle}>{vendor ? vendor : 'Select a vendor to prepare the call'}</Text>
                  </View>
                  <Pressable onPress={handleClose} hitSlop={12}>
                    <Feather name="x" size={20} color={c.textTertiary} />
                  </Pressable>
                </View>

                <View style={s.heroPanel}>
                  <View style={s.heroTopRow}>
                    <View style={s.heroIconWrap}>
                      <Feather name="phone-call" size={22} color={c.white} />
                    </View>
                    <View style={s.heroCopy}>
                      <Text style={s.heroEyebrow}>FLAGSHIP FEATURE</Text>
                      <Text style={s.heroTitle}>Alfred can negotiate live on your behalf</Text>
                      <Text style={s.heroText}>
                        We generate a brief from the selected month, then the AI agent calls the vendor using your preferred tone.
                      </Text>
                    </View>
                  </View>
                  <View style={s.heroMetaRow}>
                    <View style={s.heroMetaPill}>
                      <Feather name={hasValidWorkspace ? 'calendar' : 'alert-circle'} size={14} color={hasValidWorkspace ? c.success : c.warning} />
                      <Text style={s.heroMetaText}>{hasValidWorkspace ? 'Month selected' : 'Select a month first'}</Text>
                    </View>
                    {annualSpend != null && (
                      <View style={s.heroMetaPill}>
                        <Feather name="bar-chart-2" size={14} color={c.primary} />
                        <Text style={s.heroMetaText}>Annual spend ${Number(annualSpend).toLocaleString()}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text style={s.label}>Vendor name</Text>
                <TextInput
                  style={s.input}
                  value={vendor}
                  onChangeText={setVendor}
                  placeholder="e.g. AWS, Salesforce"
                  placeholderTextColor={c.textTertiary}
                />

                <Text style={[s.label, s.labelSpaced]}>Vendor phone number</Text>
                <TextInput
                  style={s.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor={c.textTertiary}
                  keyboardType="phone-pad"
                />

                {isDemoMode && (
                  <Text style={s.warningText}>
                    AI calls require a signed-in account. Sign out of demo mode and log in first.
                  </Text>
                )}

                <Text style={[s.label, s.labelSpaced]}>Negotiation tone</Text>
                <View style={s.toneRow}>
                  {TONES.map(t => (
                    <Pressable
                      key={t.key}
                      style={[s.toneChip, tone === t.key && s.toneChipActive]}
                      onPress={() => setTone(t.key)}
                    >
                      <Text style={[s.toneLabel, tone === t.key && s.toneLabelActive]}>{t.label}</Text>
                      <Text style={[s.toneDesc, tone === t.key && s.toneDescActive]}>{t.desc}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={s.flowCard}>
                  {AI_FLOW_STEPS.map(item => (
                    <View key={item.title} style={s.flowRow}>
                      <View style={s.flowIconWrap}>
                        <Feather name={item.icon} size={15} color={c.primary} />
                      </View>
                      <View style={s.flowCopy}>
                        <Text style={s.flowTitle}>{item.title}</Text>
                        <Text style={s.flowDesc}>{item.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <Text style={s.note}>Your brief is generated first so you can review the plan before the AI places the call.</Text>
                <Pressable
                  style={[s.scheduleBtn, !vendor.trim() && s.disabledBtn]}
                  onPress={handleGenerateBrief}
                >
                  <Feather name="zap" size={16} color="#fff" />
                  <Text style={s.scheduleBtnText}>Build AI call brief</Text>
                </Pressable>
              </>
            )}

            {step === 'loading-brief' && (
              <View style={s.centeredState}>
                <ActivityIndicator size="large" color={c.primary} />
                <Text style={s.loadingTitle}>Preparing the AI call plan...</Text>
                <Text style={s.loadingSubtitle}>Analyzing vendor context, pricing signals, and negotiation angles.</Text>
              </View>
            )}

            {step === 'brief-preview' && (
              <>
                <View style={s.header}>
                  <View style={[s.iconWrap, s.iconWrapSuccess]}>
                    <Feather name="radio" size={20} color={c.primary} />
                  </View>
                  <View style={s.headerText}>
                    <Text style={s.title}>Brief ready to call</Text>
                    <Text style={s.subtitle}>{vendor}</Text>
                  </View>
                  <Pressable onPress={handleClose} hitSlop={12}>
                    <Feather name="x" size={20} color={c.textTertiary} />
                  </Pressable>
                </View>

                {briefVendor && (
                  <View style={s.briefCard}>
                    <View style={s.briefBanner}>
                      <View style={s.briefBannerIcon}>
                        <Feather name="mic" size={16} color={c.primary} />
                      </View>
                      <View style={s.briefBannerCopy}>
                        <Text style={s.briefBannerTitle}>AI call summary</Text>
                        <Text style={s.briefBannerText}>Review the goal and talking points before launching the live negotiation.</Text>
                      </View>
                    </View>
                    <View style={s.briefRow}>
                      <Text style={s.briefLabel}>Target discount</Text>
                      <Text style={s.briefValue}>{briefVendor.discount_target_pct ?? 15}%</Text>
                    </View>
                    {briefVendor.target_price != null && (
                      <View style={s.briefRow}>
                        <Text style={s.briefLabel}>Target price</Text>
                        <Text style={s.briefValue}>${Number(briefVendor.target_price).toLocaleString()}</Text>
                      </View>
                    )}
                    {talkingPoints.length > 0 && (
                      <>
                        <Text style={[s.briefLabel, s.briefLabelBlock]}>Talking points</Text>
                        {talkingPoints.map((pt, i) => (
                          <View key={i} style={s.talkingPoint}>
                            <Text style={s.tpNumber}>{i + 1}</Text>
                            <Text style={s.tpText}>{pt}</Text>
                          </View>
                        ))}
                      </>
                    )}
                  </View>
                )}

                {!phone.trim() && (
                  <>
                    <Text style={[s.label, s.labelSpaced]}>Vendor phone number</Text>
                    <TextInput
                      style={s.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="+1 (555) 123-4567"
                      placeholderTextColor={c.textTertiary}
                      keyboardType="phone-pad"
                    />
                  </>
                )}

                <View style={s.footer}>
                  <Pressable style={s.cancelBtn} onPress={() => setStep('form')}>
                    <Text style={s.cancelText}>Back</Text>
                  </Pressable>
                  <Pressable
                    style={[s.scheduleBtn, !phone.trim() && s.disabledBtn]}
                    onPress={handleStartCall}
                  >
                    <Feather name="phone-call" size={16} color="#fff" />
                    <Text style={s.scheduleBtnText}>Launch AI call</Text>
                  </Pressable>
                </View>
              </>
            )}

            {step === 'calling' && (
              <View style={s.centeredState}>
                <ActivityIndicator size="large" color={c.primary} />
                <Text style={s.loadingTitle}>Connecting the AI agent...</Text>
                <Text style={s.loadingSubtitle}>Generating the live script and dialing {vendor} now.</Text>
              </View>
            )}

            {step === 'success' && (
              <View style={s.successState}>
                <View style={s.successIconWrap}>
                  <Feather name="phone-call" size={28} color={c.success} />
                </View>
                <Text style={s.successTitle}>Call started</Text>
                <Text style={s.successText}>
                  The AI agent is now negotiating with {vendor}. Watch the live transcript below.
                </Text>
                <Pressable style={s.doneBtn} onPress={handleClose}>
                  <Text style={s.doneText}>Done</Text>
                </Pressable>
              </View>
            )}

            {step === 'error' && (
              <View style={s.centeredState}>
                <View style={[s.iconWrap, s.iconWrapError]}>
                  <Feather name="alert-circle" size={32} color={c.danger} />
                </View>
                <Text style={s.errorTitle}>Something went wrong</Text>
                <Text style={s.errorSubtitle}>{errorMsg}</Text>
                <Pressable style={s.retryBtn} onPress={() => setStep('form')}>
                  <Text style={s.retryText}>Try again</Text>
                </Pressable>
              </View>
            )}

          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type ColorScheme = ReturnType<typeof useColors>;

function createStyles(c: ColorScheme) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    card: { width: '100%', maxWidth: 520, maxHeight: '85%', backgroundColor: c.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: c.cardBorder },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    iconWrapSuccess: { backgroundColor: c.primaryLight },
    iconWrapError: { backgroundColor: c.dangerLight },
    headerText: { flex: 1 },
    title: { fontSize: 17, fontFamily: 'Jost_500Medium', color: c.text },
    subtitle: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
    heroPanel: {
      backgroundColor: c.inputBg,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 18,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    heroIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroCopy: {
      flex: 1,
    },
    heroEyebrow: {
      fontSize: 11,
      fontFamily: 'Jost_700Bold',
      letterSpacing: 1.5,
      color: c.primary,
      marginBottom: 4,
    },
    heroTitle: {
      fontSize: 18,
      fontFamily: 'Jost_500Medium',
      color: c.text,
      marginBottom: 6,
    },
    heroText: {
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 19,
    },
    heroMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 14,
    },
    heroMetaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    heroMetaText: {
      fontSize: 12,
      fontFamily: 'Jost_500Medium',
      color: c.textSecondary,
    },
    label: { fontSize: 13, fontFamily: 'Jost_500Medium', color: c.text, marginBottom: 6 },
    labelSpaced: { marginTop: 16 },
    input: { backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: c.text, marginBottom: 14 },
    note: { fontSize: 12, color: c.textTertiary, lineHeight: 18, marginBottom: 20 },
    warningText: { fontSize: 12, color: c.danger, marginTop: 8, lineHeight: 18 },
    toneRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    toneChip: {
      flex: 1, padding: 12, borderRadius: 10, borderWidth: 1,
      borderColor: c.border, backgroundColor: c.inputBg,
    },
    toneChipActive: { borderColor: c.primary, backgroundColor: c.primaryLight },
    toneLabel: { fontSize: 13, fontFamily: 'Jost_500Medium', color: c.textSecondary },
    toneLabelActive: { color: c.primary },
    toneDesc: { fontSize: 11, color: c.textTertiary, marginTop: 2 },
    toneDescActive: { color: c.primary },
    flowCard: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: c.cardBorder,
      marginTop: 10,
      marginBottom: 12,
      gap: 12,
    },
    flowRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    flowIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 999,
      backgroundColor: c.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    flowCopy: {
      flex: 1,
    },
    flowTitle: {
      fontSize: 13,
      fontFamily: 'Jost_500Medium',
      color: c.text,
      marginBottom: 2,
    },
    flowDesc: {
      fontSize: 12,
      color: c.textSecondary,
      lineHeight: 18,
    },
    scheduleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.primary, paddingVertical: 14, borderRadius: 10 },
    scheduleBtnText: { fontSize: 15, fontFamily: 'Jost_500Medium', color: '#fff' },
    disabledBtn: { opacity: 0.5 },
    footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
    cancelBtn: { paddingVertical: 10 },
    cancelText: { fontSize: 14, color: c.textSecondary },
    centeredState: { alignItems: 'center', paddingVertical: 32 },
    loadingTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: c.text, marginTop: 20 },
    loadingSubtitle: { fontSize: 13, color: c.textSecondary, textAlign: 'center', marginTop: 8 },
    briefCard: { backgroundColor: c.inputBg, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: c.border },
    briefBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingBottom: 14,
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    briefBannerIcon: {
      width: 30,
      height: 30,
      borderRadius: 999,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    briefBannerCopy: {
      flex: 1,
    },
    briefBannerTitle: {
      fontSize: 13,
      fontFamily: 'Jost_500Medium',
      color: c.text,
      marginBottom: 2,
    },
    briefBannerText: {
      fontSize: 12,
      color: c.textSecondary,
      lineHeight: 18,
    },
    briefRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    briefLabel: { fontSize: 13, color: c.textSecondary },
    briefLabelBlock: { marginTop: 12, marginBottom: 6 },
    briefValue: { fontSize: 15, fontFamily: 'Jost_700Bold', color: c.text },
    talkingPoint: { flexDirection: 'row', gap: 10, paddingVertical: 6 },
    tpNumber: {
      width: 22, height: 22, borderRadius: 11, backgroundColor: c.primary,
      color: c.white, fontSize: 12, fontFamily: 'Jost_700Bold', textAlign: 'center', lineHeight: 22,
    },
    tpText: { flex: 1, fontSize: 13, color: c.text, lineHeight: 20 },
    successState: { alignItems: 'center', paddingVertical: 24 },
    successIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 18,
      backgroundColor: c.successLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: c.text, marginTop: 14, marginBottom: 6 },
    successText: { fontSize: 13, color: c.textSecondary, textAlign: 'center' },
    doneBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: c.primary },
    doneText: { fontSize: 14, fontFamily: 'Jost_500Medium', color: c.primary },
    errorTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: c.danger, marginTop: 16 },
    errorSubtitle: { fontSize: 13, color: c.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 16 },
    retryBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: c.primary },
    retryText: { fontSize: 14, fontFamily: 'Jost_500Medium', color: c.primary },
  });
}

async function extractFunctionError(error: any, fallback: string): Promise<string> {
  try {
    if (error?.context instanceof Response) {
      const text = await error.context.text();
      try {
        const json = JSON.parse(text);
        if (json.error && json.details) return `${json.error}: ${json.details}`;
        if (json.error) return json.error;
      } catch {
        if (text) return text;
      }
    }
    if (error?.message) return error.message;
  } catch {
    // no-op
  }
  return fallback;
}

function normalizePhoneNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const hasPlusPrefix = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlusPrefix ? `+${digits}` : digits;
}

function isValidPhoneNumber(value: string) {
  const normalized = normalizePhoneNumber(value);
  return /^\+?[1-9]\d{7,14}$/.test(normalized);
}
