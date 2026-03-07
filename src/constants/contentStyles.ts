import { StyleSheet, Platform } from 'react-native';
import { Colors } from './colors';
import { Typography } from './typography';

const n = Platform.OS === 'ios' || Platform.OS === 'android';

export const contentStyles = StyleSheet.create({
  pageTitle: {
    fontSize: n ? 22 : Typography.pageTitle.fontSize,
    fontWeight: Typography.pageTitle.fontWeight,
    color: Colors.text,
    marginBottom: n ? 6 : 4,
  },
  pageSubtitle: {
    fontSize: Typography.pageSubtitle.fontSize,
    fontWeight: Typography.pageSubtitle.fontWeight,
    color: Colors.textSecondary,
    marginBottom: n ? 16 : 24,
  },
  pageSubtitleMobile: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: n ? 14 : 16,
    padding: n ? 16 : 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: n ? 16 : 24,
  },
  cardMobile: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    color: Colors.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: Typography.cardSubtitle.fontSize,
    fontWeight: Typography.cardSubtitle.fontWeight,
    color: Colors.textSecondary,
    marginBottom: n ? 12 : 16,
  },
  kpiRow: {
    flexDirection: n ? 'column' : 'row',
    gap: n ? 10 : undefined,
    marginBottom: n ? 16 : 24,
  },
  kpiRowMobile: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  kpiItem: {
    flex: n ? 0 : 1,
    marginLeft: n ? 0 : 16,
  },
  kpiItemMobile: {
    marginLeft: 0,
    flex: 0,
  },
  kpiItemFirst: {
    marginLeft: 0,
  },
  chartsRow: {
    flexDirection: n ? 'column' : 'row',
    gap: n ? 16 : undefined,
    marginBottom: n ? 16 : 24,
  },
  chartsRowMobile: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 20,
  },
  chartCard: {
    flex: n ? 0 : 1,
    backgroundColor: Colors.card,
    borderRadius: n ? 14 : 16,
    padding: n ? 16 : 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  chartCardSecond: {
    marginLeft: n ? 0 : 20,
  },
  chartCardSecondMobile: {
    marginLeft: 0,
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  emptyState: {
    padding: n ? 32 : 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
});
