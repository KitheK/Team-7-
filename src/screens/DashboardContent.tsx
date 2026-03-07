import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, ActivityIndicator, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { contentStyles } from '../constants/contentStyles';
import UploadZone from '../components/UploadZone';
import UploadAnalysisCard from '../components/UploadAnalysisCard';
import { useWorkspace, workspaceLabel, OVERVIEW_ID } from '../context/WorkspaceContext';
import { parseCsvToTransactions } from '../utils/parseCsv';
import { analyzeUpload } from '../utils/uploadAnalysis';
import DonutChart from '../components/charts/DonutChart';

type LastUploadResult = {
  workspaceId: string;
  fileName: string;
  analysis: ReturnType<typeof analyzeUpload>;
  inserted: number;
  rejected: number;
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
      const { inserted } = await insertTransactions(activeWorkspaceId, rows);
      const analysis = analyzeUpload(rows);
      setLastUpload({ workspaceId: activeWorkspaceId, fileName, analysis, inserted, rejected });
    } catch {
      setLastUpload(null);
    } finally {
      setUploading(false);
    }
  };

  const showUploadAnalysis = lastUpload && !isOverview && lastUpload.workspaceId === activeWorkspaceId;

  return (
    <>
      <Text style={contentStyles.pageTitle}>Home</Text>
      <Text style={contentStyles.pageSubtitle}>
        {isOverview
          ? "See all your spending in one place. Pick a month on the left to add that month's statement or see just that month."
          : activeWorkspace
            ? `${workspaceLabel(activeWorkspace)} — add your statement for this month below.`
            : "Pick a month on the left to get started, or choose \"See everything\" for the big picture."}
      </Text>

      <View style={styles.workspaceBlock}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>
            {isOverview ? 'Total spending in view' : 'Spending we found (this month)'}
          </Text>
          <Text style={styles.totalValue}>${viewTotal.toLocaleString()}</Text>
        </View>

        {!isOverview && activeWorkspace && (
          <View style={contentStyles.card}>
            <Text style={styles.uploadTitle}>Add your statement for this month</Text>
            <Text style={styles.uploadSubtitle}>Export from your bank or card as CSV, or use a spreadsheet with date, description, and amount</Text>
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
      </View>

      {(activeWorkspaceTransactions.length > 0 || isOverview) && (
        <View style={contentStyles.card}>
          <Text style={styles.sectionTitle}>
            {isOverview ? 'All your transactions' : 'Transactions this month'}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {activeWorkspaceTransactions.length} line(s) · ${viewTotal.toLocaleString()} total
          </Text>
          {activeWorkspaceTransactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet. Add a statement for a month using the area above (when a month is selected).</Text>
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
        <View style={[contentStyles.card, { marginTop: 24 }]} onLayout={e => setDonutW(e.nativeEvent.layout.width)}>
          <Text style={styles.sectionTitle}>Spending by company</Text>
          <Text style={styles.sectionSubtitle}>{isOverview ? 'All months' : 'This month'}</Text>
          {donutW > 0 && (
            <View style={contentStyles.donutContainer}>
              <DonutChart width={donutW - 48} height={220} data={byVendor} />
            </View>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  workspaceBlock: { marginBottom: 24 },
  totalCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 20,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  totalLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 28,
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
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 8,
  },
});
