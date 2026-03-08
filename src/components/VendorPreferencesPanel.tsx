import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Switch, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { supabase } from '../../lib/supabase';
import type { VendorPreference, NegotiationTone } from '../context/WorkspaceContext';

type Props = {
  vendorName: string;
  userId: string;
  onClose: () => void;
};

const TONES: { key: NegotiationTone; label: string; icon: string }[] = [
  { key: 'collaborative', label: 'Collaborative', icon: 'heart' },
  { key: 'assertive', label: 'Assertive', icon: 'bar-chart-2' },
  { key: 'firm', label: 'Firm', icon: 'shield' },
];

export default function VendorPreferencesPanel({ vendorName, userId, onClose }: Props) {
  const [pref, setPref] = useState<VendorPreference | null>(null);
  const [doNotCall, setDoNotCall] = useState(false);
  const [tone, setTone] = useState<NegotiationTone>('collaborative');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoaded(true); return; }
    (async () => {
      const { data } = await supabase
        .from('vendor_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('vendor_name', vendorName)
        .maybeSingle();
      if (data) {
        const vp = data as VendorPreference;
        setPref(vp);
        setDoNotCall(vp.do_not_call);
        setTone(vp.preferred_tone);
        setNotes(vp.notes ?? '');
      }
      setLoaded(true);
    })();
  }, [vendorName, userId]);

  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);
    const row = {
      user_id: userId,
      vendor_name: vendorName,
      do_not_call: doNotCall,
      preferred_tone: tone,
      notes: notes.trim() || null,
    };

    if (pref) {
      await supabase.from('vendor_preferences').update(row).eq('id', pref.id);
    } else {
      await supabase.from('vendor_preferences').insert(row);
    }
    setSaving(false);
    Alert.alert('Saved', `Preferences for ${vendorName} updated.`);
    onClose();
  };

  if (!loaded) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Preferences — {vendorName}</Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Feather name="x" size={18} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Feather name="phone-off" size={16} color={doNotCall ? Colors.danger : Colors.textTertiary} />
          <Text style={styles.rowLabelText}>Do Not Call</Text>
        </View>
        <Switch
          value={doNotCall}
          onValueChange={setDoNotCall}
          trackColor={{ false: Colors.border, true: 'rgba(220, 38, 38, 0.3)' }}
          thumbColor={doNotCall ? Colors.danger : Colors.textTertiary}
        />
      </View>

      <Text style={styles.sectionLabel}>Preferred negotiation tone</Text>
      <View style={styles.toneRow}>
        {TONES.map(t => (
          <Pressable
            key={t.key}
            style={[styles.toneChip, tone === t.key && styles.toneChipActive]}
            onPress={() => setTone(t.key)}
          >
            <Feather name={t.icon as any} size={14} color={tone === t.key ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.toneChipText, tone === t.key && styles.toneChipTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Notes</Text>
      <TextInput
        style={styles.notesInput}
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g. Always ask for net-60 terms"
        placeholderTextColor={Colors.textTertiary}
        multiline
        numberOfLines={3}
      />

      <View style={styles.footer}>
        <Pressable style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Feather name="check" size={14} color={Colors.white} />
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save preferences'}</Text>
        </Pressable>
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
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text },
  closeBtn: { padding: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    marginBottom: 16,
  },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabelText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  toneRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  toneChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
  },
  toneChipActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(30, 64, 175, 0.06)',
  },
  toneChipText: { fontSize: 13, color: Colors.textSecondary },
  toneChipTextActive: { color: Colors.primary, fontWeight: '600' },
  notesInput: {
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    textAlignVertical: 'top',
    minHeight: 72,
    marginBottom: 20,
  },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { paddingVertical: 10 },
  cancelText: { fontSize: 14, color: Colors.textSecondary },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  saveText: { fontSize: 14, fontWeight: '600', color: Colors.white },
});
