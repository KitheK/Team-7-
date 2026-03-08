import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import DonutChart from '../components/charts/DonutChart';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import UploadZone from '../components/UploadZone';
import UploadAnalysisCard from '../components/UploadAnalysisCard';
import Typography from '../components/ui/Typography';
import { useWorkspace, type UploadBatch } from '../context/WorkspaceContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { parseCsvToTransactions } from '../utils/parseCsv';
import { analyzeUpload, type UploadAnalysis } from '../utils/uploadAnalysis';
import WhatIfContent from './WhatIfContent';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
type AnalyticsTab = 'categories' | 'vendors';

export default function SpendingContent() {
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>('categories');
  const [chartW, setChartW] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<{ fileName: string; analysis: UploadAnalysis; inserted: number; rejected: number } | null>(null);
  const [uploadExpanded, setUploadExpanded] = useState(true);
  const [whatIfExpanded, setWhatIfExpanded] = useState(false);
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);

  const { activeWorkspaceTransactions, activeWorkspaceId, uploadBatches, uploadCsv, deleteBatch, refreshAnalytics } = useWorkspace();
  const { totalAmount, byCategory, vendorAnalytics, byVendorChart, subscriptionCount, isEmpty } = useWorkspaceData(activeWorkspaceTransactions);

  const hasUploads = uploadBatches.length > 0;

  const handleFile = async (text: string, fileName: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === 'all') return;
    setUploading(true);
    try {
      const { rows, rejected: parseRejected } = parseCsvToTransactions(text);
      const analysis = analyzeUpload(rows);
      const batch = await uploadCsv(activeWorkspaceId, text, fileName, rows);
      setLastAnalysis({
        fileName,
        analysis,
        inserted: rows.length - parseRejected,
        rejected: parseRejected,
      });
      if (batch) {
        setUploadExpanded(false);
        refreshAnalytics();
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    await deleteBatch(batchId);
    setLastAnalysis(null);
    refreshAnalytics();
  };

  if (!activeWorkspaceId || activeWorkspaceId === 'all') {
    return (
      <>
        <Typography variant="display">Spending</Typography>
        <Typography variant="body" tone="secondary" style={s.pageSubtitle}>
          Select a specific month from the month picker to view spending data and upload files.
        </Typography>
        <WorkspaceEmptyState activeWorkspaceId={activeWorkspaceId} />
      </>
    );
  }

  const chartData = analyticsTab === 'categories' ? byCategory : byVendorChart.slice(0, 8);
  const topItem = chartData[0];

  return (
    <>
      <Typography variant="display">Spending</Typography>
      <Typography variant="body" tone="secondary" style={s.pageSubtitle}>
        Upload your expenses, then explore where every dollar goes.
      </Typography>

      {/* ──── Zone A: Hero Upload ──── */}
      <Pressable onPress={() => setUploadExpanded(!uploadExpanded)} style={s.sectionToggle}>
        <View style={s.sectionToggleLeft}>
          <Feather name="upload-cloud" size={16} color={c.primary} />
          <Text style={s.sectionToggleText}>Upload files</Text>
          {hasUploads && (
            <View style={s.countBadge}>
              <Text style={s.countBadgeText}>{uploadBatches.length}</Text>
            </View>
          )}
        </View>
        <Feather name={uploadExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={c.textSecondary} />
      </Pressable>

      {uploadExpanded && (
        <View style={s.uploadSection}>
          <UploadZone onFile={handleFile} disabled={uploading} />
          {lastAnalysis && (
            <UploadAnalysisCard
              fileName={lastAnalysis.fileName}
              analysis={lastAnalysis.analysis}
              inserted={lastAnalysis.inserted}
              rejected={lastAnalysis.rejected}
            />
          )}
        </View>
      )}

      {/* ──── Zone B: File Manager ──── */}
      {hasUploads && (
        <View style={s.fileManager}>
          <Text style={s.fileManagerLabel}>Uploaded files</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.fileChipsRow}>
            {uploadBatches.map(batch => (
              <View key={batch.id} style={s.fileChip}>
                <Feather name="file-text" size={14} color={c.primary} />
                <View style={s.fileChipInfo}>
                  <Text style={s.fileChipName} numberOfLines={1}>{batch.file_name}</Text>
                  <Text style={s.fileChipMeta}>
                    {batch.row_count} rows · {new Date(batch.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Pressable
                  onPress={() => void handleDeleteBatch(batch.id)}
                  style={({ hovered }) => [s.fileChipDelete, hovered && s.fileChipDeleteHover]}
                >
                  <Feather name="x" size={13} color={c.textSecondary} />
                </Pressable>
              </View>
            ))}
            <Pressable onPress={() => setUploadExpanded(true)} style={s.fileChipAdd}>
              <Feather name="plus" size={15} color={c.primary} />
              <Text style={s.fileChipAddText}>Add file</Text>
            </Pressable>
          </ScrollView>
        </View>
      )}

      {/* ──── Zone C + D: Analytics ──── */}
      {isEmpty ? (
        <View style={s.emptyAnalytics}>
          <Feather name="bar-chart-2" size={36} color={c.textTertiary} />
          <Text style={s.emptyTitle}>No spending data yet</Text>
          <Text style={s.emptyText}>Upload a CSV above to see your breakdown here.</Text>
        </View>
      ) : (
        <>
          {/* Summary stats */}
          <View style={s.statsRow}>
            {[
              { val: `$${(totalAmount / 1000).toFixed(1)}K`, label: 'Total spend', accent: c.primary },
              { val: `${subscriptionCount}`, label: 'Vendors', accent: c.text },
              { val: `${byCategory.length}`, label: 'Categories', accent: c.text },
              ...(topItem ? [{ val: topItem.name, label: `Top (${((topItem.value / totalAmount) * 100).toFixed(0)}%)`, accent: c.primary }] : []),
            ].map((item, i) => (
              <Pressable key={i} style={({ hovered }) => [s.statCard, hovered && s.statCardHover]}>
                <Text style={[s.statValue, { color: item.accent }]} numberOfLines={1}>{item.val}</Text>
                <Text style={s.statLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Analytics tabs */}
          <View style={s.tabRow}>
            {(['categories', 'vendors'] as AnalyticsTab[]).map(tab => (
              <Pressable
                key={tab}
                style={({ hovered }) => [s.tab, analyticsTab === tab && s.tabActive, hovered && analyticsTab !== tab && s.tabHover]}
                onPress={() => setAnalyticsTab(tab)}
              >
                <Feather name={tab === 'categories' ? 'pie-chart' : 'briefcase'} size={14} color={analyticsTab === tab ? c.primary : c.textTertiary} />
                <Text style={[s.tabText, analyticsTab === tab && s.tabTextActive]}>
                  {tab === 'categories' ? 'By Category' : 'By Vendor'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Chart + Breakdown */}
          <View style={s.analyticsGrid}>
            <View style={s.chartPanel} onLayout={(e: LayoutChangeEvent) => setChartW(e.nativeEvent.layout.width)}>
              {chartW > 0 && chartData.length > 0 && (
                <View style={s.chartCenter}>
                  <DonutChart width={chartW - (isNative ? 32 : 48)} height={isNative ? 200 : 240} data={chartData} />
                </View>
              )}
            </View>
            <View style={s.breakdownPanel}>
              <Text style={s.breakdownTitle}>Breakdown</Text>
              {analyticsTab === 'categories' ? byCategory.map((item, i) => (
                <Pressable key={i} style={({ hovered }) => [s.breakdownRow, hovered && s.breakdownRowHover]}>
                  <View style={[s.colorDot, { backgroundColor: item.color }]} />
                  <Text style={s.breakdownName} numberOfLines={1}>{item.name}</Text>
                  <Text style={s.breakdownPct}>{((item.value / totalAmount) * 100).toFixed(0)}%</Text>
                  <Text style={s.breakdownValue}>${item.value.toLocaleString()}</Text>
                </Pressable>
              )) : vendorAnalytics.slice(0, 12).map((v, i) => (
                <Pressable key={i} style={({ hovered }) => [s.breakdownRow, hovered && s.breakdownRowHover]}>
                  <View style={[s.colorDot, { backgroundColor: c.chart[i % c.chart.length] }]} />
                  <View style={s.vendorInfoCol}>
                    <Text style={s.breakdownName} numberOfLines={1}>{v.vendor}</Text>
                    <Text style={s.vendorMeta}>{v.category} · {v.count}x</Text>
                  </View>
                  <Text style={s.breakdownValue}>${v.total.toLocaleString()}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </>
      )}

      {/* ──── Zone E: What If ──── */}
      {!isEmpty && (
        <>
          <Pressable onPress={() => setWhatIfExpanded(!whatIfExpanded)} style={[s.sectionToggle, s.sectionToggleBottom]}>
            <View style={s.sectionToggleLeft}>
              <Feather name="sliders" size={16} color={c.primary} />
              <Text style={s.sectionToggleText}>What If scenarios</Text>
            </View>
            <Feather name={whatIfExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={c.textSecondary} />
          </Pressable>
          {whatIfExpanded && (
            <View style={s.whatIfWrap}>
              <WhatIfContent embedded />
            </View>
          )}
        </>
      )}
    </>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    pageSubtitle: { marginBottom: 20, maxWidth: 540 },

    sectionToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: c.white,
      borderWidth: 1,
      borderColor: c.cardBorder,
      marginBottom: 12,
    },
    sectionToggleBottom: {
      marginTop: 20,
    },
    sectionToggleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionToggleText: {
      fontSize: 14,
      fontFamily: 'Jost_500Medium',
      color: c.text,
    },
    countBadge: {
      backgroundColor: c.primary,
      borderRadius: 999,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    countBadgeText: {
      fontSize: 11,
      fontFamily: 'Jost_500Medium',
      color: c.white,
    },

    uploadSection: {
      marginBottom: 16,
    },

    fileManager: {
      marginBottom: 20,
      gap: 8,
    },
    fileManagerLabel: {
      fontSize: 12,
      fontFamily: 'Jost_500Medium',
      color: c.textSecondary,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    fileChipsRow: {
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 4,
    },
    fileChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: c.white,
      borderWidth: 1,
      borderColor: c.cardBorder,
      maxWidth: 240,
    },
    fileChipInfo: {
      flex: 1,
      minWidth: 0,
    },
    fileChipName: {
      fontSize: 13,
      fontFamily: 'Jost_500Medium',
      color: c.text,
    },
    fileChipMeta: {
      fontSize: 11,
      color: c.textSecondary,
    },
    fileChipDelete: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fileChipDeleteHover: {
      backgroundColor: 'rgba(0,0,0,0.06)',
    },
    fileChipAdd: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.primary,
      borderStyle: 'dashed',
    },
    fileChipAddText: {
      fontSize: 13,
      fontFamily: 'Jost_500Medium',
      color: c.primary,
    },

    statsRow: {
      flexDirection: isNative ? 'column' : 'row',
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      flex: isNative ? 0 : 1,
      backgroundColor: c.white,
      borderRadius: 10,
      padding: isNative ? 14 : 16,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    statCardHover: {
      borderColor: c.primary,
      transform: [{ translateY: -2 }],
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    statValue: {
      fontSize: isNative ? 18 : 22,
      fontFamily: 'Jost_700Bold',
      letterSpacing: -0.3,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: 'Jost_400Regular',
      color: c.textSecondary,
    },

    tabRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: c.white,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    tabActive: {
      borderColor: c.primary,
      backgroundColor: c.white,
    },
    tabHover: {
      borderColor: c.textSecondary,
    },
    tabText: {
      fontSize: 13,
      fontFamily: 'Jost_500Medium',
      color: c.textTertiary,
    },
    tabTextActive: {
      color: c.primary,
    },

    analyticsGrid: {
      flexDirection: isNative ? 'column' : 'row',
      gap: isNative ? 0 : 20,
      marginBottom: 20,
    },
    chartPanel: {
      flex: isNative ? 0 : 1,
      backgroundColor: c.white,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: isNative ? 16 : 22,
      marginBottom: isNative ? 16 : 0,
    },
    chartCenter: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },
    breakdownPanel: {
      flex: isNative ? 0 : 1.2,
      backgroundColor: c.white,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: isNative ? 16 : 22,
    },
    breakdownTitle: {
      fontSize: 15,
      fontFamily: 'Jost_500Medium',
      color: c.text,
      marginBottom: 14,
    },
    breakdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 8,
      marginBottom: 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    breakdownRowHover: {
      backgroundColor: c.inputBg,
      transform: [{ translateX: 2 }],
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 10,
    },
    breakdownName: {
      flex: 1,
      fontSize: 13,
      fontFamily: 'Jost_500Medium',
      color: c.text,
      minWidth: 0,
    },
    breakdownPct: {
      fontSize: 12,
      color: c.textTertiary,
      width: 40,
      textAlign: 'right',
      marginRight: 12,
    },
    breakdownValue: {
      fontSize: 13,
      fontFamily: 'Jost_700Bold',
      color: c.text,
      minWidth: 70,
      textAlign: 'right',
    },
    vendorInfoCol: {
      flex: 1,
      minWidth: 0,
    },
    vendorMeta: {
      fontSize: 11,
      color: c.textTertiary,
      marginTop: 2,
    },

    whatIfWrap: {
      marginTop: 4,
      marginBottom: 20,
    },

    emptyAnalytics: {
      alignItems: 'center',
      padding: 48,
      backgroundColor: c.white,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.cardBorder,
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 17,
      fontFamily: 'Jost_500Medium',
      color: c.text,
      marginTop: 14,
      marginBottom: 4,
    },
    emptyText: {
      fontSize: 13,
      fontFamily: 'Jost_400Regular',
      color: c.textSecondary,
      textAlign: 'center',
      maxWidth: 320,
    },
  });
}
