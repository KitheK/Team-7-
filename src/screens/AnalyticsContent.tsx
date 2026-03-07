import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';

export default function AnalyticsContent() {
  return (
    <>
      <Text style={contentStyles.pageTitle}>Analytics</Text>
      <Text style={contentStyles.pageSubtitle}>
        Financial summary, expense categories, and report view.
      </Text>

      <View style={contentStyles.card}>
        <Text style={contentStyles.cardTitle}>Financial summary</Text>
        <Text style={contentStyles.cardSubtitle}>Organized monthly — efficient vs lost spend</Text>
        <View style={styles.placeholder}>
          <Feather name="bar-chart-2" size={40} color={Colors.textTertiary} />
          <Text style={contentStyles.emptyStateText}>
            Where money is used efficiently, what is lost and where and why. By expense category.
          </Text>
        </View>
      </View>

      <View style={contentStyles.card}>
        <Text style={contentStyles.cardTitle}>Report & export</Text>
        <Text style={contentStyles.cardSubtitle}>Compare prices, link history, CSV export</Text>
        <View style={styles.placeholder}>
          <Feather name="file-text" size={40} color={Colors.textTertiary} />
          <Text style={contentStyles.emptyStateText}>
            Report page and export options. Stitch packaging, scale price negotiator.
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    ...contentStyles.emptyState,
  },
});
