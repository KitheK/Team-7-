import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  vendorName?: string;
};

export default function ScheduleAICallModal({ visible, onClose, vendorName }: Props) {
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);
  const [scheduled, setScheduled] = useState(false);
  const [date, setDate] = useState('');

  const handleSchedule = () => {
    setScheduled(true);
    setTimeout(() => { setScheduled(false); onClose(); setDate(''); }, 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.card} onPress={e => e.stopPropagation()}>
          {scheduled ? (
            <View style={s.successState}>
              <Feather name="check-circle" size={40} color={c.success} />
              <Text style={s.successTitle}>Call scheduled!</Text>
              <Text style={s.successText}>AI will negotiate with {vendorName || 'the vendor'} on your behalf.</Text>
            </View>
          ) : (
            <>
              <View style={s.header}>
                <View style={s.iconWrap}>
                  <Feather name="phone-call" size={20} color={c.primary} />
                </View>
                <View style={s.headerText}>
                  <Text style={s.title}>Schedule AI negotiation</Text>
                  <Text style={s.subtitle}>{vendorName || 'Select vendor'}</Text>
                </View>
                <Pressable onPress={onClose} hitSlop={12}>
                  <Feather name="x" size={20} color={c.textTertiary} />
                </Pressable>
              </View>
              <Text style={s.label}>Preferred date</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. March 15, 2026"
                placeholderTextColor={c.textTertiary}
                value={date}
                onChangeText={setDate}
              />
              <Text style={s.note}>Our AI agent will call the vendor, negotiate pricing, and report back with the outcome.</Text>
              <Pressable style={s.scheduleBtn} onPress={handleSchedule}>
                <Feather name="phone-call" size={16} color="#fff" />
                <Text style={s.scheduleBtnText}>Schedule call</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    card: { width: '100%', maxWidth: 420, backgroundColor: c.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: c.cardBorder },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    headerText: { flex: 1 },
    title: { fontSize: 17, fontWeight: '700', color: c.text },
    subtitle: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
    label: { fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 6 },
    input: { backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: c.text, marginBottom: 14 },
    note: { fontSize: 12, color: c.textTertiary, lineHeight: 18, marginBottom: 20 },
    scheduleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.primary, paddingVertical: 14, borderRadius: 10 },
    scheduleBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
    successState: { alignItems: 'center', paddingVertical: 24 },
    successTitle: { fontSize: 18, fontWeight: '700', color: c.text, marginTop: 14, marginBottom: 6 },
    successText: { fontSize: 13, color: c.textSecondary, textAlign: 'center' },
  });
}
