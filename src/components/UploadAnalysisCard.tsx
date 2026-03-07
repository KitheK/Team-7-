import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import type { UploadAnalysis } from '../utils/uploadAnalysis';

type Props = {
  fileName: string;
  analysis: UploadAnalysis;
  inserted: number;
  rejected: number;
};

export default function UploadAnalysisCard({ fileName, analysis, inserted, rejected }: Props) {
  const { totalAmount, uniqueVendors, issues, rows } = analysis;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Feather name="file-text" size={20} color={Colors.primary} />
        <Text style={styles.title}>What we found in {fileName}</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{inserted}</Text>
          <Text style={styles.summaryLabel}>Lines added</Text>
        </View>
        {rejected > 0 && (
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, styles.rejected]}>{rejected}</Text>
            <Text style={styles.summaryLabel}>Skipped (bad format)</Text>
          </View>
        )}
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{uniqueVendors}</Text>
          <Text style={styles.summaryLabel}>Different companies</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, styles.total]}>${totalAmount.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      {issues.length > 0 && (
        <View style={styles.issuesBlock}>
          <Text style={styles.issuesTitle}>Worth a look</Text>
          {issues.map((issue, i) => (
            <View key={i} style={styles.issueRow}>
              <Feather
                name={issue.type === 'duplicate_vendor' ? 'copy' : issue.type === 'high_spend' ? 'trending-up' : 'alert-circle'}
                size={14}
                color={Colors.warning}
              />
              <Text style={styles.issueText}>{issue.message}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.tableTitle}>Lines we added</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.cell, styles.cellVendor]}>Company / Description</Text>
          <Text style={[styles.cell, styles.cellDate]}>Date</Text>
          <Text style={[styles.cell, styles.cellAmount]}>Amount</Text>
        </View>
        {rows.slice(0, 15).map((r, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.cell, styles.cellVendor]} numberOfLines={1}>
              {r.vendor_name || r.description || '—'}
            </Text>
            <Text style={[styles.cell, styles.cellDate]}>{r.transaction_date || '—'}</Text>
            <Text style={[styles.cell, styles.cellAmount]}>${r.amount.toLocaleString()}</Text>
          </View>
        ))}
        {rows.length > 15 && (
          <Text style={styles.more}>+ {rows.length - 15} more</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
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
    color: Colors.text,
    marginLeft: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItem: {},
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rejected: { color: Colors.danger },
  total: { color: Colors.success },
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
    color: Colors.warning,
    marginBottom: 8,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  issueText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  tableTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  table: {},
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cell: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  cellVendor: { flex: 1.5, minWidth: 0 },
  cellDate: { flex: 0.6, width: 90 },
  cellAmount: { flex: 0.5, textAlign: 'right', fontWeight: '600', color: Colors.text },
  more: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 8,
  },
});
