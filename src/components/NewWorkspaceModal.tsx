import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear + 2 - i);

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (month: number, year: number) => void;
};

export default function NewWorkspaceModal({ visible, onClose, onCreate }: Props) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear);

  const handleCreate = () => {
    onCreate(month, year);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Add a month</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <Text style={styles.label}>Month</Text>
          <View style={styles.row}>
            {MONTHS.map((m, i) => (
              <Pressable
                key={m}
                style={[styles.chip, (i + 1) === month && styles.chipActive]}
                onPress={() => setMonth(i + 1)}
              >
                <Text style={[(i + 1) === month ? styles.chipTextActive : styles.chipText]}>{m}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.label, { marginTop: 16 }]}>Year (e.g. 2026)</Text>
          <View style={styles.row}>
            {YEARS.map(y => (
              <Pressable
                key={y}
                style={[styles.chip, y === year && styles.chipActive]}
                onPress={() => setYear(y)}
              >
                <Text style={[y === year ? styles.chipTextActive : styles.chipText]}>{y}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.createBtn} onPress={handleCreate}>
              <Text style={styles.createText}>Create</Text>
            </Pressable>
          </View>
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
    maxWidth: 420,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  chipText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  createBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  createText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
