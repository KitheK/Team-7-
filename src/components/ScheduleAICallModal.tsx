import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  vendorName?: string;
  defaultDate?: string;
};

const NEXT_DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return d.toISOString().slice(0, 10);
});

export default function ScheduleAICallModal({
  visible,
  onClose,
  vendorName = '',
  defaultDate = NEXT_DAYS[0],
}: Props) {
  const [vendor, setVendor] = useState(vendorName);
  const [date, setDate] = useState(defaultDate);
  const [scheduled, setScheduled] = useState(false);

  useEffect(() => {
    if (visible) {
      setVendor(vendorName);
      setDate(defaultDate);
      setScheduled(false);
    }
  }, [visible, vendorName, defaultDate]);

  const handleSchedule = () => {
    setScheduled(true);
  };

  const handleClose = () => {
    setScheduled(false);
    setVendor(vendorName);
    setDate(defaultDate);
    onClose();
  };

  const displayDate = date ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) : '';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          {!scheduled ? (
            <>
              <View style={styles.header}>
                <View style={styles.iconWrap}>
                  <Feather name="phone-call" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.title}>Schedule AI negotiation call</Text>
                <Text style={styles.subtitle}>
                  Our AI will join the call and suggest talking points in real time.
                </Text>
              </View>
              <Text style={styles.label}>Vendor</Text>
              <TextInput
                style={styles.input}
                value={vendor}
                onChangeText={setVendor}
                placeholder="e.g. AWS, Salesforce"
                placeholderTextColor={Colors.textTertiary}
              />
              <Text style={[styles.label, { marginTop: 16 }]}>Call date</Text>
              <View style={styles.dateRow}>
                {NEXT_DAYS.map(d => (
                  <Pressable
                    key={d}
                    style={[styles.dateChip, date === d && styles.dateChipActive]}
                    onPress={() => setDate(d)}
                  >
                    <Text style={[styles.dateChipText, date === d && styles.dateChipTextActive]}>
                      {new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.footer}>
                <Pressable style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.scheduleBtn} onPress={handleSchedule}>
                  <Feather name="calendar" size={16} color={Colors.white} />
                  <Text style={styles.scheduleText}>Schedule call</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.successWrap}>
              <View style={[styles.iconWrap, styles.iconWrapSuccess]}>
                <Feather name="check" size={32} color={Colors.success} />
              </View>
              <Text style={styles.successTitle}>AI call scheduled</Text>
              <Text style={styles.successDetail}>
                {displayDate}
              </Text>
              <Text style={styles.successSub}>
                You'll receive AI-generated talking points and a script 24 hours before the call.
              </Text>
              <Pressable style={styles.doneBtn} onPress={handleClose}>
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 24,
  },
  header: { alignItems: 'center', marginBottom: 24 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconWrapSuccess: { backgroundColor: 'rgba(34,197,94,0.15)' },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
  },
  dateChipActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dateChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  dateChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: { paddingVertical: 10 },
  cancelText: { fontSize: 14, color: Colors.textSecondary },
  scheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  scheduleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  successWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
  },
  successDetail: {
    fontSize: 16,
    color: Colors.primary,
    marginTop: 8,
  },
  successSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  doneBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  doneText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
