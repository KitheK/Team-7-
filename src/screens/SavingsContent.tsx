import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';
import { useWorkspace, workspaceLabel, OVERVIEW_ID } from '../context/WorkspaceContext';

export default function SavingsContent() {
  const { activeWorkspace, activeWorkspaceId, workspaces, activeWorkspaceTransactions } = useWorkspace();
  const isOverview = activeWorkspaceId === OVERVIEW_ID || !activeWorkspaceId;
  const viewTotal = activeWorkspaceTransactions.reduce((s, t) => s + Number(t.amount), 0);

  return (
    <>
      <Text style={contentStyles.pageTitle}>Your savings</Text>
      <Text style={contentStyles.pageSubtitle}>
        {isOverview ? 'All the spending we found across every month you added.' : 'Spending we found for this month.'}
      </Text>

      <View style={contentStyles.card}>
        <Text style={contentStyles.cardTitle}>
          {isOverview ? 'Total in view' : activeWorkspace ? workspaceLabel(activeWorkspace) : 'Total'}
        </Text>
        <Text style={contentStyles.cardSubtitle}>
          {isOverview ? 'Everything from the statements you added' : 'From the statement(s) you added for this month'}
        </Text>
        <View style={styles.totalWrap}>
          <Text style={styles.bigNumber}>${viewTotal.toLocaleString()}</Text>
          <Text style={styles.hint}>Spending we found</Text>
        </View>
      </View>

      {isOverview && workspaces.length > 0 && (
        <View style={contentStyles.card}>
          <Text style={contentStyles.cardTitle}>By month</Text>
          <Text style={contentStyles.cardSubtitle}>What we found in each month you added</Text>
          <View style={styles.workspaceList}>
            {workspaces.map((w) => (
              <View key={w.id} style={styles.workspaceRow}>
                <Text style={styles.workspaceName}>{workspaceLabel(w)}</Text>
                <Text style={styles.workspaceAmount}>${Number(w.total_saved).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  totalWrap: {
    paddingVertical: 16,
  },
  bigNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.success,
  },
  hint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  workspaceList: {},
  workspaceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  workspaceName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  workspaceAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
});
