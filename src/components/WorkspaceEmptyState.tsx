import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { OVERVIEW_ID } from '../context/WorkspaceContext';

type Props = {
  activeWorkspaceId: string | null;
  message?: string;
};

export default function WorkspaceEmptyState({
  activeWorkspaceId,
  message = "You don't have any data here yet. Pick a month on the left and add your bank or card statement (CSV file) to get started.",
}: Props) {
  const isOverview = activeWorkspaceId === OVERVIEW_ID || !activeWorkspaceId;
  const hint = isOverview
    ? "Add statements in each month (e.g. January, February) to see your spending here."
    : "Add your statement for this month using the Home page. We'll show you where your money went and where you might save.";

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Feather name="inbox" size={40} color={Colors.textTertiary} />
      </View>
      <Text style={styles.title}>Nothing here yet</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 48,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  iconWrap: { marginBottom: 16 },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
