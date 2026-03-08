import React, { useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import type { ColorScheme } from '../constants/colors';

type Props = {
  onFile: (text: string, fileName: string) => void;
  accept?: string;
  disabled?: boolean;
};

export default function UploadZone({ onFile, accept = '.csv', disabled }: Props) {
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please choose a CSV file. You can export one from your bank or from Excel/Sheets.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      onFile(text, file.name);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handlePress = () => {
    if (Platform.OS !== 'web' || disabled) return;
    const input = inputRef.current;
    if (input) input.click();
  };

  const setInputRef = (el: HTMLInputElement | null) => {
    inputRef.current = el;
  };

  return (
    <View style={s.wrap}>
      {Platform.OS === 'web' && (
        <input
          ref={setInputRef}
          type="file"
          accept={accept}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
      )}
      <Pressable
        style={[s.zone, disabled && s.zoneDisabled]}
        onPress={handlePress}
        disabled={disabled}
      >
        <Feather name="upload-cloud" size={32} color={c.primary} />
        <Text style={s.zoneText}>Add your bank or card statement</Text>
        <Text style={s.zoneSub}>Tap to choose a CSV file (export from your bank or spreadsheet)</Text>
      </Pressable>
      {error && (
        <View style={s.errorRow}>
          <Feather name="alert-circle" size={14} color={c.danger} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (c: ColorScheme) =>
  StyleSheet.create({
    wrap: { marginBottom: 16 },
    zone: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: c.border,
      borderRadius: 12,
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.inputBg,
    },
    zoneDisabled: { opacity: 0.5 },
    zoneText: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
      marginTop: 12,
    },
    zoneSub: {
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 4,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    errorText: {
      fontSize: 13,
      color: c.danger,
      marginLeft: 6,
    },
  });
