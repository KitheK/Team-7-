import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, Alert } from 'react-native';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';
import UploadZone from '../components/UploadZone';
import UploadAnalysisCard from '../components/UploadAnalysisCard';
import { useWorkspace, workspaceLabel, OVERVIEW_ID } from '../context/WorkspaceContext';
import { parseCsvToTransactions } from '../utils/parseCsv';
import { analyzeUpload } from '../utils/uploadAnalysis';
import DonutChart from '../components/charts/DonutChart';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

type LastUploadResult = {
  workspaceId: string;
  fileName: string;
  analysis: ReturnType<typeof analyzeUpload>;
  inserted: number;
  rejected: number;
  error?: string;
};

export default function DashboardContent() {
  const [uploading, setUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<LastUploadResult | null>(null);
  const [donutW, setDonutW] = useState(0);

  const {
    activeWorkspace,
    activeWorkspaceId,
    activeWorkspaceTransactions,
    insertTransactions,
    workspaces,
  } = useWorkspace();

  const isOverview = activeWorkspaceId === OVERVIEW_ID || !activeWorkspaceId;

  const viewTotal = useMemo(() => {
    return activeWorkspaceTransactions.reduce((s, t) => s + Number(t.amount), 0);
  }, [activeWorkspaceTransactions]);

  const byVendor = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of activeWorkspaceTransactions) {
      const v = t.vendor_name || t.description || 'Unknown';
      map[v] = (map[v] ?? 0) + Number(t.amount);
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, color: Colors.chart[Object.keys(map).indexOf(name) % Colors.chart.length] }))
      .sort((a, b) => b.value - a.value);
  }, [activeWorkspaceTransactions]);

  const handleCsv = async (csvText: string, fileName: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === OVERVIEW_ID) {
      return;
    }
    setUploading(true);
    setLastUpload(null);
    try {
      const { rows, rejected } = parseCsvToTransactions(csvText);
      const result = await insertTransactions(activeWorkspaceId, rows);
      const analysis = analyzeUpload(rows);
      setLastUpload({
        workspaceId: activeWorkspaceId,
        fileName,
        analysis,
        inserted: result.inserted,
        rejected,
        error: result.error,
      });
      if (result.error) {
        Alert.alert('Upload problem', result.error);
      }
    } catch (e) {
      setLastUpload(null);
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  const showUploadAnalysis = lastUpload && !isOverview && lastUpload.workspaceId === activeWorkspaceId;
  const txnLimit = isNative ? 15 : 20;

  return (
    <>
      <Text style={contentStyles.pageTitle}>Home</Text>
      <Text style={contentStyles.pageSubtitle}>
        {isOverview
          ? "See all your spending in one place. Tap the menu to pick a month."
          : activeWorkspace
            ? `${workspaceLabel(activeWorkspace)} — add your statement below.`
            : "Tap the menu to pick a month, or choose \"All months\"."}
      </Text>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>
          {isOverview ? 'Total spending in view' : 'Spending this month'}
        </Text>
        <Text style={styles.totalValue}>${viewTotal.toLocaleString()}</Text>
      </View>

      {!isOverview && activeWorkspace && (
        <View style={contentStyles.card}>
          <Text style={styles.uploadTitle}>Add your statement</Text>
          <Text style={styles.uploadSubtitle}>
            {isNative ? 'Upload a CSV from your bank' : 'Export from your bank or card as CSV, or use a spreadsheet with date, description, and amount'}
          </Text>
          {uploading ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.uploadingText}>Processing…</Text>
            </View>
          ) : (
            <UploadZone onFile={handleCsv} disabled={uploading} />
          )}
        </View>
      )}

      {showUploadAnalysis && lastUpload && (
        <UploadAnalysisCard
          fileName={lastUpload.fileName}
          analysis={lastUpload.analysis}
          inserted={lastUpload.inserted}
          rejected={lastUpload.rejected}
        />
      )}

      {(activeWorkspaceTransactions.length > 0 || isOverview) && (
        <View style={contentStyles.card}>
          <Text style={styles.sectionTitle}>
            {isOverview ? 'All transactions' : 'Transactions'}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {activeWorkspaceTransactions.length} line(s) · ${viewTotal.toLocaleString()} total
          </Text>
          {activeWorkspaceTransactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet.</Text>
          ) : isNative ? (
            <>
              {activeWorkspaceTransactions.slice(0, txnLimit).map((t, i) => (
                <View key={t.id ?? i} style={styles.txnCard}>
                  <View style={styles.txnLeft}>
                    <Text style={styles.txnVendor} numberOfLines={1}>
                      {t.vendor_name || t.description || '—'}
                    </Text>
                    <Text style={styles.txnDate}>{t.transaction_date || '—'}</Text>
                  </View>
                  <Text style={styles.txnAmount}>${Number(t.amount).toLocaleString()}</Text>
                </View>
              ))}
              {activeWorkspaceTransactions.length > txnLimit && (
                <Text style={styles.more}>+ {activeWorkspaceTransactions.length - txnLimit} more</Text>
              )}
            </>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.cell, styles.cellVendor]}>Vendor</Text>
                <Text style={[styles.cell, styles.cellDate]}>Date</Text>
                <Text style={[styles.cell, styles.cellAmount]}>Amount</Text>
              </View>
              {activeWorkspaceTransactions.slice(0, 20).map((t, i) => (
                <View key={t.id ?? i} style={styles.tableRow}>
                  <Text style={[styles.cell, styles.cellVendor]} numberOfLines={1}>
                    {t.vendor_name || t.description || '—'}
                  </Text>
                  <Text style={[styles.cell, styles.cellDate]}>{t.transaction_date || '—'}</Text>
                  <Text style={[styles.cell, styles.cellAmount]}>${Number(t.amount).toLocaleString()}</Text>
                </View>
              ))}
              {activeWorkspaceTransactions.length > 20 && (
                <Text style={styles.more}>+ {activeWorkspaceTransactions.length - 20} more</Text>
              )}
            </View>
          )}
        </View>
      )}

      {byVendor.length > 0 && (
        <View style={[contentStyles.card, { marginTop: isNative ? 0 : 24 }]} onLayout={e => setDonutW(e.nativeEvent.layout.width)}>
          <Text style={styles.sectionTitle}>Spending by company</Text>
          <Text style={styles.sectionSubtitle}>{isOverview ? 'All months' : 'This month'}</Text>
          {donutW > 0 && (
            <View style={contentStyles.donutContainer}>
              <DonutChart width={donutW - (isNative ? 32 : 48)} height={isNative ? 200 : 220} data={byVendor} />
            </View>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  totalCard: {
    backgroundColor: Colors.card,
    borderRadius: isNative ? 14 : 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: isNative ? 16 : 20,
    marginBottom: 16,
    alignSelf: isNative ? 'stretch' : ('flex-start' as any),
  },
  totalLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: isNative ? 26 : 28,
    fontWeight: '700',
    color: Colors.success,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  uploadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  txnCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  txnLeft: {
    flex: 1,
    marginRight: 12,
  },
  txnVendor: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  txnDate: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  table: {},
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
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
  cellDate: { flex: 0.6 },
  cellAmount: { flex: 0.5, textAlign: 'right', fontWeight: '600', color: Colors.text },
  more: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 10,
    textAlign: 'center',
  },
});
