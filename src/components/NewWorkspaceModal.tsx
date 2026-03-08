import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import type { ColorScheme } from '../constants/colors';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear + 2 - i);

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (month: number, year: number) => void;
};

export default function NewWorkspaceModal({ visible, onClose, onCreate }: Props) {
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear);

  const handleCreate = () => {
    onCreate(month, year);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.card} onPress={e => e.stopPropagation()}>
          <View style={s.header}>
            <Text style={s.title}>Add a month</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={22} color={c.textSecondary} />
            </Pressable>
          </View>
          <Text style={s.label}>Month</Text>
          <View style={s.row}>
            {MONTHS.map((m, i) => (
              <Pressable
                key={m}
                style={[s.chip, (i + 1) === month && s.chipActive]}
                onPress={() => setMonth(i + 1)}
              >
                <Text style={[(i + 1) === month ? s.chipTextActive : s.chipText]}>{m}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[s.label, { marginTop: 16 }]}>Year (e.g. 2026)</Text>
          <View style={s.row}>
            {YEARS.map(y => (
              <Pressable
                key={y}
                style={[s.chip, y === year && s.chipActive]}
                onPress={() => setYear(y)}
              >
                <Text style={[y === year ? s.chipTextActive : s.chipText]}>{y}</Text>
              </Pressable>
            ))}
          </View>
          <View style={s.footer}>
            <Pressable style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={s.createBtn} onPress={handleCreate}>
              <Text style={s.createText}>Create</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (c: ColorScheme) =>
  StyleSheet.create({
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
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.cardBorder,
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
      color: c.text,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textSecondary,
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
      borderColor: c.border,
      backgroundColor: c.inputBg,
    },
    chipActive: {
      borderColor: c.primary,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    chipText: {
      fontSize: 13,
      color: c.textSecondary,
    },
    chipTextActive: {
      fontSize: 13,
      color: c.primary,
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
      color: c.textSecondary,
    },
    createBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.primary,
    },
    createText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.primary,
    },
  });
