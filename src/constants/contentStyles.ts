import { StyleSheet } from 'react-native';
import { Colors } from './colors';
import { Typography } from './typography';

// Shared layout for all app pages – typography from single source
export const contentStyles = StyleSheet.create({
  pageTitle: {
    fontSize: Typography.pageTitle.fontSize,
    fontWeight: Typography.pageTitle.fontWeight,
    color: Colors.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: Typography.pageSubtitle.fontSize,
    fontWeight: Typography.pageSubtitle.fontWeight,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 24,
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
    marginBottom: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  kpiItem: {
    flex: 1,
    marginLeft: 16,
  },
  kpiItemFirst: {
    marginLeft: 0,
  },
  chartsRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  chartCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  chartCardSecond: {
    marginLeft: 20,
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  emptyState: {
    padding: 48,
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
