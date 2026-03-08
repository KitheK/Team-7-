import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import type { ColorScheme } from '../constants/colors';
import type { UploadAnalysis } from '../utils/uploadAnalysis';

type Props = {
  fileName: string;
  analysis: UploadAnalysis;
  inserted: number;
  rejected: number;
};

export default function UploadAnalysisCard({ fileName, analysis, inserted, rejected }: Props) {
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);
  const { totalAmount, uniqueVendors, issues, rows } = analysis;

  return (
    <View style={s.card}>
      <View style={s.header}>
        <Feather name="file-text" size={20} color={c.primary} />
        <Text style={s.title}>What we found in {fileName}</Text>
      </View>

      <View style={s.summaryRow}>
        <View style={s.summaryItem}>
          <Text style={s.summaryValue}>{inserted}</Text>
          <Text style={s.summaryLabel}>Lines added</Text>
        </View>
        {rejected > 0 && (
          <View style={s.summaryItem}>
            <Text style={[s.summaryValue, s.rejected]}>{rejected}</Text>
            <Text style={s.summaryLabel}>Skipped (bad format)</Text>
          </View>
        )}
        <View style={s.summaryItem}>
          <Text style={s.summaryValue}>{uniqueVendors}</Text>
          <Text style={s.summaryLabel}>Different companies</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={[s.summaryValue, s.total]}>${totalAmount.toLocaleString()}</Text>
          <Text style={s.summaryLabel}>Total</Text>
        </View>
      </View>

      {issues.length > 0 && (
        <View style={s.issuesBlock}>
          <Text style={s.issuesTitle}>Worth a look</Text>
          {issues.map((issue, i) => (
            <View key={i} style={s.issueRow}>
              <Feather
                name={issue.type === 'duplicate_vendor' ? 'copy' : issue.type === 'high_spend' ? 'trending-up' : 'alert-circle'}
                size={14}
                color={c.warning}
              />
              <Text style={s.issueText}>{issue.message}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={s.tableTitle}>Lines we added</Text>
      <View style={s.table}>
        <View style={s.tableHeader}>
          <Text style={[s.cell, s.cellVendor]}>Company / Description</Text>
          <Text style={[s.cell, s.cellDate]}>Date</Text>
          <Text style={[s.cell, s.cellAmount]}>Amount</Text>
        </View>
        {rows.slice(0, 15).map((r, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={[s.cell, s.cellVendor]} numberOfLines={1}>
              {r.vendor_name || r.description || '—'}
            </Text>
            <Text style={[s.cell, s.cellDate]}>{r.transaction_date || '—'}</Text>
            <Text style={[s.cell, s.cellAmount]}>${r.amount.toLocaleString()}</Text>
          </View>
        ))}
        {rows.length > 15 && (
          <Text style={s.more}>+ {rows.length - 15} more</Text>
        )}
      </View>
    </View>
  );
}

const createStyles = (c: ColorScheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: 20,
      marginTop: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
      marginLeft: 10,
    },
    summaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 20,
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    summaryItem: {},
    summaryValue: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
    },
    summaryLabel: {
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 2,
    },
    rejected: { color: c.danger },
    total: { color: c.success },
    issuesBlock: {
      marginBottom: 16,
      padding: 12,
      borderRadius: 10,
      backgroundColor: 'rgba(234,179,8,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(234,179,8,0.2)',
    },
    issuesTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: c.warning,
      marginBottom: 8,
    },
    issueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    issueText: {
      fontSize: 13,
      color: c.textSecondary,
      marginLeft: 8,
      flex: 1,
    },
    tableTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textSecondary,
      marginBottom: 8,
    },
    table: {},
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      marginBottom: 4,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    cell: {
      fontSize: 13,
      color: c.textSecondary,
    },
    cellVendor: { flex: 1.5, minWidth: 0 },
    cellDate: { flex: 0.6, width: 90 },
    cellAmount: { flex: 0.5, textAlign: 'right', fontWeight: '600', color: c.text },
    more: {
      fontSize: 12,
      color: c.textTertiary,
      marginTop: 8,
    },
  });
