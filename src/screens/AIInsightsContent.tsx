import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';

export default function AIInsightsContent() {
  return (
    <>
      <Text style={contentStyles.pageTitle}>AI Insights</Text>
      <Text style={contentStyles.pageSubtitle}>
        Policy enforcement, receipt auditing, and price-creep detection.
      </Text>

      <View style={contentStyles.card}>
        <Text style={contentStyles.cardTitle}>Policy violations</Text>
        <Text style={contentStyles.cardSubtitle}>Snap & enforce — receipts audited against policy</Text>
        <View style={styles.placeholder}>
          <Feather name="cpu" size={40} color={Colors.textTertiary} />
          <Text style={contentStyles.emptyStateText}>
            Personal luxuries flagged as business expenses will appear here after receipt upload.
          </Text>
        </View>
      </View>

      <View style={contentStyles.card}>
        <Text style={contentStyles.cardTitle}>Price-creep engine</Text>
        <Text style={contentStyles.cardSubtitle}>Vendors outside normal confidence interval (6 months)</Text>
        <View style={styles.placeholder}>
          <Feather name="trending-up" size={40} color={Colors.textTertiary} />
          <Text style={contentStyles.emptyStateText}>
            Statistical flags for rate increases. CSV data required.
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
