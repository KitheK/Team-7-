import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import type { ColorScheme } from '../constants/colors';
import { OVERVIEW_ID } from '../context/WorkspaceContext';

type Props = {
  activeWorkspaceId: string | null;
  message?: string;
};

export default function WorkspaceEmptyState({
  activeWorkspaceId,
  message = "You don't have any data here yet. Pick a month on the left and add your bank or card statement (CSV file) to get started.",
}: Props) {
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);

  const isOverview = activeWorkspaceId === OVERVIEW_ID || !activeWorkspaceId;
  const hint = isOverview
    ? "Add statements in each month (e.g. January, February) to see your spending here."
    : "Add your statement for this month using the Home page. We'll show you where your money went and where you might save.";

  return (
    <View style={s.wrap}>
      <View style={s.iconWrap}>
        <Feather name="inbox" size={40} color={c.textTertiary} />
      </View>
      <Text style={s.title}>Nothing here yet</Text>
      <Text style={s.message}>{message}</Text>
      <Text style={s.hint}>{hint}</Text>
    </View>
  );
}

const createStyles = (c: ColorScheme) =>
  StyleSheet.create({
    wrap: {
      padding: 48,
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    iconWrap: { marginBottom: 16 },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: c.text,
      marginBottom: 8,
    },
    message: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    hint: {
      fontSize: 13,
      color: c.textTertiary,
      textAlign: 'center',
    },
  });
