import { StyleSheet, Platform } from 'react-native';
import { type ColorScheme } from './colors';

const n = Platform.OS === 'ios' || Platform.OS === 'android';

export function getContentStyles(c: ColorScheme) {
  return StyleSheet.create({
    pageTitle: {
      fontSize: n ? 22 : 26,
      fontWeight: '700',
      color: c.text,
      marginBottom: n ? 4 : 4,
      letterSpacing: -0.5,
    },
    pageSubtitle: {
      fontSize: 14,
      fontWeight: '400',
      color: c.textSecondary,
      marginBottom: n ? 16 : 24,
      lineHeight: 20,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      padding: n ? 16 : 22,
      borderWidth: 1,
      borderColor: c.cardBorder,
      marginBottom: n ? 14 : 20,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
      marginBottom: 2,
    },
    cardSubtitle: {
      fontSize: 12,
      fontWeight: '400',
      color: c.textTertiary,
      marginBottom: n ? 12 : 14,
    },
    kpiRow: {
      flexDirection: n ? 'column' : 'row',
      gap: n ? 10 : 12,
      marginBottom: n ? 16 : 20,
    },
    kpiItem: {
      flex: n ? 0 : 1,
      marginLeft: 0,
    },
    kpiItemFirst: {
      marginLeft: 0,
    },
    donutContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },
  });
}
