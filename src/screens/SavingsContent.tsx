import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';

export default function SavingsContent() {
  return (
    <>
      <Text style={contentStyles.pageTitle}>Savings</Text>
      <Text style={contentStyles.pageSubtitle}>
        Track recovered cash and historical ROI by month.
      </Text>

      <View style={contentStyles.card}>
        <Text style={contentStyles.cardTitle}>Monthly workspace</Text>
        <Text style={contentStyles.cardSubtitle}>Select a month to see resolved savings</Text>
        <View style={styles.placeholder}>
          <Feather name="dollar-sign" size={40} color={Colors.textTertiary} />
          <Text style={contentStyles.emptyStateText}>
            February 2026: $1,200 Recovered. March 2026: drag CSV to run audit.
          </Text>
        </View>
      </View>

      <View style={contentStyles.card}>
        <Text style={contentStyles.cardTitle}>Total saved</Text>
        <Text style={contentStyles.cardSubtitle}>Cumulative across all months</Text>
        <View style={styles.placeholder}>
          <Text style={styles.bigNumber}>$31,542</Text>
          <Text style={contentStyles.emptyStateText}>Last 6 months performance</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    ...contentStyles.emptyState,
  },
  bigNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
  },
});
