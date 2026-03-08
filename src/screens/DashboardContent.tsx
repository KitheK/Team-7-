import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import { getContentStyles } from '../constants/contentStyles';
import UploadZone from '../components/UploadZone';
import UploadAnalysisCard from '../components/UploadAnalysisCard';
import { useWorkspace, workspaceLabel, OVERVIEW_ID } from '../context/WorkspaceContext';
import { parseCsvToTransactions } from '../utils/parseCsv';
import { analyzeUpload } from '../utils/uploadAnalysis';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import DonutChart from '../components/charts/DonutChart';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

type UploadResult = {
  workspaceId: string;
  fileName: string;
  analysis: ReturnType<typeof analyzeUpload>;
  inserted: number;
  rejected: number;
};

export default function DashboardContent() {
  const [uploading, setUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<UploadResult | null>(null);
  const [donutW, setDonutW] = useState(0);
  const c = useColors();
  const cs = useMemo(() => getContentStyles(c), [c]);
  const s = useMemo(() => createStyles(c), [c]);

  const { activeWorkspace, activeWorkspaceId, activeWorkspaceTransactions, insertTransactions, workspaces } = useWorkspace();
  const { subscriptionCount, duplicateOrAlertCount, priceCreepSignals } = useWorkspaceData(activeWorkspaceTransactions);
  const isOverview = activeWorkspaceId === OVERVIEW_ID || !activeWorkspaceId;

  const viewTotal = useMemo(() => activeWorkspaceTransactions.reduce((sum, t) => sum + Number(t.amount), 0), [activeWorkspaceTransactions]);

  const byVendor = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of activeWorkspaceTransactions) {
      const v = t.vendor_name || t.description || 'Unknown';
      map[v] = (map[v] ?? 0) + Number(t.amount);
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, color: c.chart[Object.keys(map).indexOf(name) % c.chart.length] }))
      .sort((a, b) => b.value - a.value);
  }, [activeWorkspaceTransactions, c.chart]);

  const handleCsv = async (csvText: string, fileName: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === OVERVIEW_ID) return;
    setUploading(true);
    setLastUpload(null);
    try {
      const { rows, rejected } = parseCsvToTransactions(csvText);
      const { inserted } = await insertTransactions(activeWorkspaceId, rows);
      setLastUpload({ workspaceId: activeWorkspaceId, fileName, analysis: analyzeUpload(rows), inserted, rejected });
    } catch { setLastUpload(null); }
    finally { setUploading(false); }
  };

  const showAnalysis = lastUpload && !isOverview && lastUpload.workspaceId === activeWorkspaceId;
  const alertCount = duplicateOrAlertCount + priceCreepSignals.length;

  return (
    <>
      <Text style={cs.pageTitle}>{isOverview ? 'Overview' : activeWorkspace ? workspaceLabel(activeWorkspace) : 'Home'}</Text>
      <Text style={cs.pageSubtitle}>{isOverview ? 'Your business at a glance.' : 'Upload a statement to get started.'}</Text>

      <View style={s.kpiStrip}>
        {[
          { icon: 'dollar-sign' as const, value: `$${viewTotal.toLocaleString()}`, label: isOverview ? 'Total spend' : 'This month', bg: c.primaryLight, fg: c.primary },
          { icon: 'users' as const, value: `${subscriptionCount}`, label: 'Vendors', bg: c.successLight, fg: c.success },
          { icon: (alertCount > 0 ? 'alert-triangle' : 'check-circle') as any, value: `${alertCount}`, label: 'Alerts', bg: alertCount > 0 ? c.warningLight : c.successLight, fg: alertCount > 0 ? c.warning : c.success },
          ...(workspaces.length > 0 ? [{ icon: 'calendar' as const, value: `${workspaces.length}`, label: 'Months', bg: c.primaryLight, fg: c.primary }] : []),
        ].map((kpi, i) => (
          <View key={i} style={s.kpiCard}>
            <View style={[s.kpiIconWrap, { backgroundColor: kpi.bg }]}>
              <Feather name={kpi.icon} size={18} color={kpi.fg} />
            </View>
            <View>
              <Text style={s.kpiValue}>{kpi.value}</Text>
              <Text style={s.kpiLabel}>{kpi.label}</Text>
            </View>
          </View>
        ))}
      </View>

      {!isOverview && activeWorkspace && (
        <View style={cs.card}>
          <View style={s.uploadHeader}>
            <Feather name="upload" size={18} color={c.primary} />
            <Text style={s.uploadTitle}>Add your statement</Text>
          </View>
          <Text style={s.uploadSub}>Drop a CSV from your bank or card.</Text>
          {uploading ? (
            <View style={s.uploadingRow}>
              <ActivityIndicator size="small" color={c.primary} />
              <Text style={s.uploadingText}>Processing...</Text>
            </View>
          ) : (
            <UploadZone onFile={handleCsv} disabled={uploading} />
          )}
        </View>
      )}

      {showAnalysis && lastUpload && (
        <UploadAnalysisCard fileName={lastUpload.fileName} analysis={lastUpload.analysis} inserted={lastUpload.inserted} rejected={lastUpload.rejected} />
      )}

      {activeWorkspaceTransactions.length > 0 && (
        <View style={s.twoCol}>
          <View style={[cs.card, s.txnCard]}>
            <Text style={s.sectionTitle}>Recent transactions</Text>
            <Text style={s.sectionSub}>{activeWorkspaceTransactions.length} total &middot; ${viewTotal.toLocaleString()}</Text>
            {activeWorkspaceTransactions.slice(0, isNative ? 10 : 15).map((t, i) => (
              <View key={t.id ?? i} style={s.txnRow}>
                <View style={s.txnVendorWrap}>
                  <View style={s.txnDot} />
                  <View style={s.txnInfo}>
                    <Text style={s.txnVendor} numberOfLines={1}>{t.vendor_name || t.description || '—'}</Text>
                    <Text style={s.txnDate}>{t.transaction_date || '—'}</Text>
                  </View>
                </View>
                <Text style={s.txnAmount}>${Number(t.amount).toLocaleString()}</Text>
              </View>
            ))}
          </View>
          {byVendor.length > 0 && (
            <View style={[cs.card, s.chartCard]} onLayout={e => setDonutW(e.nativeEvent.layout.width)}>
              <Text style={s.sectionTitle}>Spending breakdown</Text>
              <Text style={s.sectionSub}>{isOverview ? 'All months' : 'This month'}</Text>
              {donutW > 0 && (
                <View style={cs.donutContainer}>
                  <DonutChart width={donutW - (isNative ? 32 : 48)} height={isNative ? 200 : 220} data={byVendor.slice(0, 8)} />
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {activeWorkspaceTransactions.length === 0 && !uploading && (
        <View style={s.emptyState}>
          <Feather name="inbox" size={40} color={c.textTertiary} />
          <Text style={s.emptyTitle}>No data yet</Text>
          <Text style={s.emptyText}>{isOverview ? 'Select a month and upload a bank statement.' : 'Upload a CSV above to get started.'}</Text>
        </View>
      )}
    </>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    kpiStrip: { flexDirection: isNative ? 'column' : 'row', gap: 12, marginBottom: 20 },
    kpiCard: {
      flex: isNative ? 0 : 1, flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.card, borderRadius: 14, padding: isNative ? 14 : 16,
      borderWidth: 1, borderColor: c.cardBorder, gap: 12,
    },
    kpiIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    kpiValue: { fontSize: isNative ? 20 : 22, fontWeight: '700', color: c.text },
    kpiLabel: { fontSize: 12, color: c.textSecondary, marginTop: 1 },
    uploadHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    uploadTitle: { fontSize: 15, fontWeight: '600', color: c.text },
    uploadSub: { fontSize: 13, color: c.textSecondary, marginBottom: 12 },
    uploadingRow: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    uploadingText: { fontSize: 14, color: c.textSecondary, marginLeft: 10 },
    twoCol: { flexDirection: isNative ? 'column' : 'row', gap: isNative ? 0 : 20 },
    txnCard: { flex: isNative ? 0 : 1.2 },
    chartCard: { flex: isNative ? 0 : 1 },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: c.text, marginBottom: 2 },
    sectionSub: { fontSize: 12, color: c.textTertiary, marginBottom: 14 },
    txnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
    txnVendorWrap: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
    txnDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary, marginRight: 10, opacity: 0.4 },
    txnInfo: { flex: 1, minWidth: 0 },
    txnVendor: { fontSize: 14, fontWeight: '500', color: c.text },
    txnDate: { fontSize: 11, color: c.textTertiary, marginTop: 2 },
    txnAmount: { fontSize: 14, fontWeight: '600', color: c.text },
    emptyState: { alignItems: 'center', padding: 48, backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.cardBorder },
    emptyTitle: { fontSize: 17, fontWeight: '600', color: c.text, marginTop: 16, marginBottom: 6 },
    emptyText: { fontSize: 13, color: c.textSecondary, textAlign: 'center', maxWidth: 320, lineHeight: 20 },
  });
}
