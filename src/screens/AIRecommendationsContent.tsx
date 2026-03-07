import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';
import {
  aiRecommendationsKpis,
  quickWins,
  allRecommendations,
} from '../constants/dummyData';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export default function AIRecommendationsContent() {
  return (
    <>
      <Text style={contentStyles.pageTitle}>AI Recommendations</Text>
      <Text style={contentStyles.pageSubtitle}>
        Cost optimization suggestions powered by AI.
      </Text>

      <View style={contentStyles.kpiRow}>
        <View style={[contentStyles.kpiItem, contentStyles.kpiItemFirst]}>
          <View style={styles.kpiCard}>
            <Feather name="zap" size={22} color="#22c55e" />
            <Text style={styles.kpiValue}>{aiRecommendationsKpis.activeRecommendations}</Text>
            <Text style={[styles.kpiLabel, { color: '#22c55e' }]}>Insights</Text>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={styles.kpiCard}>
            <Feather name="dollar-sign" size={22} color="#3b82f6" />
            <Text style={styles.kpiValue}>${(aiRecommendationsKpis.totalOpportunity / 1000).toFixed(1)}K</Text>
            <Text style={[styles.kpiLabel, { color: '#3b82f6' }]}>Monthly savings</Text>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={styles.kpiCard}>
            <Feather name="zap" size={22} color="#eab308" />
            <Text style={styles.kpiValue}>{aiRecommendationsKpis.quickWins}</Text>
            <Text style={[styles.kpiLabel, { color: '#eab308' }]}>Quick wins</Text>
          </View>
        </View>
        <View style={contentStyles.kpiItem}>
          <View style={styles.kpiCard}>
            <Feather name="trending-up" size={22} color="#a855f7" />
            <Text style={styles.kpiValue}>{aiRecommendationsKpis.avgConfidence}%</Text>
            <Text style={[styles.kpiLabel, { color: '#a855f7' }]}>Accuracy</Text>
          </View>
        </View>
      </View>

      <View style={contentStyles.card}>
        <View style={styles.quickWinsHeader}>
          <Feather name="zap" size={20} color="#22c55e" />
          <Text style={styles.quickWinsTitle}>Quick Wins</Text>
        </View>
        <Text style={contentStyles.cardSubtitle}>Low effort, immediate impact</Text>
        <View style={[styles.quickWinsGrid, isNative && styles.quickWinsGridNative]}>
          {quickWins.map((q, i) => (
            <View key={i} style={[styles.quickWinCard, isNative && styles.quickWinCardNative]}>
              <Text style={styles.quickWinTitle}>{q.title}</Text>
              <Text style={styles.quickWinDesc} numberOfLines={isNative ? 3 : undefined}>{q.description}</Text>
              <Text style={styles.quickWinSavings}>${q.savings.toLocaleString()}/mo</Text>
              <Pressable style={styles.implementBtn}>
                <Text style={styles.implementBtnText}>Implement</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <View style={contentStyles.card}>
        <Text style={contentStyles.cardTitle}>All Recommendations</Text>
        <Text style={contentStyles.cardSubtitle}>Sorted by priority and savings potential</Text>

        {!isNative && (
          <View style={styles.filters}>
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>All Categories</Text>
              <Feather name="chevron-down" size={14} color={Colors.textSecondary} />
            </View>
            <View style={[styles.dropdown, { marginLeft: 12 }]}>
              <Text style={styles.dropdownText}>All Priorities</Text>
              <Feather name="chevron-down" size={14} color={Colors.textSecondary} />
            </View>
          </View>
        )}

        {allRecommendations.map((r, i) => (
          <View key={i} style={[styles.recRow, isNative && styles.recRowNative]}>
            <View style={styles.recInfo}>
              <Text style={styles.recTitle}>{r.title}</Text>
              <Text style={styles.recMeta}>{r.category} · {r.priority} priority</Text>
            </View>
            <View style={isNative ? styles.recRightNative : styles.recRight}>
              <Text style={styles.recSavings}>${r.savings.toLocaleString()}/mo</Text>
              <Pressable style={styles.implementBtn}>
                <Text style={styles.implementBtnText}>Implement</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  kpiCard: {
    padding: isNative ? 16 : 20,
    borderRadius: isNative ? 12 : 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  kpiValue: { fontSize: isNative ? 24 : 26, fontWeight: '700', color: Colors.text, marginTop: 10, marginBottom: 4 },
  kpiLabel: { fontSize: 12, color: Colors.textSecondary },
  quickWinsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  quickWinsTitle: { fontSize: 18, fontWeight: '600', color: '#22c55e', marginLeft: 8 },
  quickWinsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  quickWinsGridNative: { flexDirection: 'column', gap: 12 },
  quickWinCard: { width: '31%', minWidth: 200, marginRight: 16, marginBottom: 16, padding: 18, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.inputBg },
  quickWinCardNative: { width: '100%', minWidth: 0, marginRight: 0, marginBottom: 0, padding: 16 },
  quickWinTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  quickWinDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12, lineHeight: 18 },
  quickWinSavings: { fontSize: 16, fontWeight: '700', color: '#22c55e', marginBottom: 12 },
  implementBtn: { paddingHorizontal: 14, paddingVertical: isNative ? 12 : 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary, alignSelf: 'flex-start' },
  implementBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  filters: { flexDirection: 'row', marginBottom: 16 },
  dropdown: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.inputBg },
  dropdownText: { fontSize: 13, color: Colors.textSecondary, marginRight: 6 },
  recRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  recRowNative: { flexDirection: 'column', alignItems: 'flex-start', gap: 8 },
  recInfo: { flex: 1 },
  recRight: { flexDirection: 'row', alignItems: 'center' },
  recRightNative: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  recTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  recMeta: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  recSavings: { fontSize: 14, fontWeight: '600', color: '#22c55e', marginRight: 16 },
});
