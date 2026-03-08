import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  LayoutChangeEvent,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { contentStyles } from '../constants/contentStyles';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  type Scenario,
  type ScenarioInputs,
  type BaselineMetrics,
  DEMO_BASELINE,
} from '../types/shadowMarket';
import { runSimulation } from '../utils/shadowMarketSimulation';
import { generateExplanation } from '../utils/shadowMarketExplanation';
import BarChart from '../components/charts/BarChart';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

function formatCurrency(n: number) {
  return '$' + Math.round(n).toLocaleString();
}

function getBaselineFromWorkspace(
  viewTotal: number,
  isDemoMode: boolean
): BaselineMetrics {
  if (isDemoMode || viewTotal === 0) {
    return DEMO_BASELINE;
  }
  const expenses = viewTotal;
  const revenue = expenses * 1.38;
  const profit = revenue - expenses;
  return { revenue, expenses, profit };
}

const DEFAULT_INPUTS: ScenarioInputs = {
  priceChangePercent: 0,
  marketingChangePercent: 0,
  newEmployeeCost: 0,
  vendorSwitchSavings: 0,
  subscriptionCancelSavings: 0,
};

export default function ShadowMarketContent() {
  const { activeWorkspaceTransactions, isDemoMode } = useWorkspace();
  const viewTotal = useMemo(
    () => activeWorkspaceTransactions.reduce((s, t) => s + Number(t.amount), 0),
    [activeWorkspaceTransactions]
  );
  const baseline = useMemo(
    () => getBaselineFromWorkspace(viewTotal, isDemoMode),
    [viewTotal, isDemoMode]
  );

  const [chartW, setChartW] = useState(0);
  const [inputs, setInputs] = useState<ScenarioInputs>({ ...DEFAULT_INPUTS });
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [compareSelected, setCompareSelected] = useState<string[]>([]);
  const [newScenarioName, setNewScenarioName] = useState('');

  const updateInput = useCallback(<K extends keyof ScenarioInputs>(
    key: K,
    value: number | undefined
  ) => {
    setInputs((prev) => ({ ...prev, [key]: value ?? 0 }));
  }, []);

  const runNewSimulation = useCallback(() => {
    const name = newScenarioName.trim() || `Scenario ${scenarios.length + 1}`;
    const id = `sc-${Date.now()}`;
    const result = runSimulation(baseline, inputs, id.length);
    const explanation = generateExplanation(baseline, inputs, result);
    const scenario: Scenario = {
      id,
      name,
      description: describeInputs(inputs),
      inputs: { ...inputs },
      baselineMetrics: { ...baseline },
      simulatedMetrics: result,
      explanation,
      confidence: result.confidence,
    };
    setScenarios((prev) => [...prev, scenario]);
    setCompareSelected((prev) =>
      prev.length < 2 ? [...prev, id] : [prev[1], id]
    );
    setNewScenarioName('');
    setInputs({ ...DEFAULT_INPUTS });
  }, [baseline, inputs, newScenarioName, scenarios.length]);

  const comparisonData = useMemo(() => {
    const labels: string[] = ['Baseline'];
    const rev: number[] = [baseline.revenue];
    const exp: number[] = [baseline.expenses];
    const profit: number[] = [baseline.profit];
    compareSelected.slice(0, 2).forEach((id) => {
      const s = scenarios.find((sc) => sc.id === id);
      if (s) {
        labels.push(s.name);
        rev.push(s.simulatedMetrics.revenue);
        exp.push(s.simulatedMetrics.expenses);
        profit.push(s.simulatedMetrics.profit);
      }
    });
    if (labels.length < 2) return null;
    return {
      labels,
      series: [
        { data: rev, color: Colors.chart[0], label: 'Revenue' },
        { data: exp, color: Colors.chart[1], label: 'Expenses' },
        { data: profit, color: Colors.chart[2], label: 'Profit' },
      ],
    };
  }, [baseline, scenarios, compareSelected]);

  const hasAnyInput =
    (inputs.priceChangePercent ?? 0) !== 0 ||
    (inputs.marketingChangePercent ?? 0) !== 0 ||
    (inputs.newEmployeeCost ?? 0) > 0 ||
    (inputs.vendorSwitchSavings ?? 0) > 0 ||
    (inputs.subscriptionCancelSavings ?? 0) > 0;

  return (
    <>
      <Text style={contentStyles.pageTitle}>Shadow Market</Text>
      <Text style={contentStyles.pageSubtitle}>
        Built for local shops, bakeries, and small businesses. See how raising prices, hiring help, running a local ad, or switching suppliers would affect your sales, costs, and what you keep.
      </Text>

      {/* Baseline */}
      <View style={styles.baselineRow}>
        <View style={[styles.baselineCard, { borderLeftColor: Colors.chart[0] }]}>
          <Text style={styles.baselineLabel}>Sales (revenue) / month</Text>
          <Text style={styles.baselineValue}>{formatCurrency(baseline.revenue)}</Text>
        </View>
        <View style={[styles.baselineCard, { borderLeftColor: Colors.chart[1] }]}>
          <Text style={styles.baselineLabel}>Costs (expenses) / month</Text>
          <Text style={styles.baselineValue}>{formatCurrency(baseline.expenses)}</Text>
        </View>
        <View style={[styles.baselineCard, { borderLeftColor: Colors.success }]}>
          <Text style={styles.baselineLabel}>What you keep (profit) / month</Text>
          <Text style={[styles.baselineValue, { color: Colors.success }]}>
            {formatCurrency(baseline.profit)}
          </Text>
        </View>
      </View>

      {/* Scenario builder */}
      <View style={contentStyles.card}>
        <View style={styles.builderHeader}>
          <Feather name="sliders" size={20} color={Colors.primary} />
          <Text style={styles.builderTitle}>Scenario builder</Text>
        </View>
        <Text style={contentStyles.cardSubtitle}>
          Try “what if” ideas — e.g. raise pastry prices, hire a part-timer, run a Facebook ad, or switch to a cheaper flour supplier.
        </Text>

        <View style={styles.sliderBlock}>
          <Text style={styles.sliderLabel}>Raise or lower prices (%)</Text>
          <Text style={styles.sliderHint}>e.g. menu items, pastries, coffee</Text>
          <View style={styles.sliderRow}>
            <Pressable
              style={styles.stepperBtn}
              onPress={() =>
                updateInput(
                  'priceChangePercent',
                  Math.max(-20, (inputs.priceChangePercent ?? 0) - 5)
                )
              }
            >
              <Feather name="minus" size={18} color={Colors.text} />
            </Pressable>
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  {
                    width: `${((inputs.priceChangePercent ?? 0) + 20) / 40 * 100}%`,
                  },
                ]}
              />
            </View>
            <Pressable
              style={styles.stepperBtn}
              onPress={() =>
                updateInput(
                  'priceChangePercent',
                  Math.min(20, (inputs.priceChangePercent ?? 0) + 5)
                )
              }
            >
              <Feather name="plus" size={18} color={Colors.text} />
            </Pressable>
          </View>
          <Text style={styles.sliderValue}>
            {(inputs.priceChangePercent ?? 0) > 0 ? '+' : ''}
            {inputs.priceChangePercent ?? 0}%
          </Text>
        </View>

        <View style={styles.sliderBlock}>
          <Text style={styles.sliderLabel}>Spend more on ads or promotions (%)</Text>
          <Text style={styles.sliderHint}>e.g. Facebook, flyers, local promo</Text>
          <View style={styles.sliderRow}>
            <Pressable
              style={styles.stepperBtn}
              onPress={() =>
                updateInput(
                  'marketingChangePercent',
                  Math.max(-50, (inputs.marketingChangePercent ?? 0) - 10)
                )
              }
            >
              <Feather name="minus" size={18} color={Colors.text} />
            </Pressable>
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  {
                    width: `${((inputs.marketingChangePercent ?? 0) + 50) / 100 * 100}%`,
                  },
                ]}
              />
            </View>
            <Pressable
              style={styles.stepperBtn}
              onPress={() =>
                updateInput(
                  'marketingChangePercent',
                  Math.min(50, (inputs.marketingChangePercent ?? 0) + 10)
                )
              }
            >
              <Feather name="plus" size={18} color={Colors.text} />
            </Pressable>
          </View>
          <Text style={styles.sliderValue}>
            {(inputs.marketingChangePercent ?? 0) > 0 ? '+' : ''}
            {inputs.marketingChangePercent ?? 0}%
          </Text>
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Hire help ($/mo)</Text>
          <TextInput
            style={styles.input}
            value={
              inputs.newEmployeeCost ? String(inputs.newEmployeeCost) : ''
            }
            onChangeText={(t) =>
              updateInput('newEmployeeCost', t ? parseInt(t, 10) || 0 : 0)
            }
            placeholder="e.g. 800 part-timer"
            keyboardType="number-pad"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Switch supplier / cheaper option ($/mo)</Text>
          <TextInput
            style={styles.input}
            value={
              inputs.vendorSwitchSavings
                ? String(inputs.vendorSwitchSavings)
                : ''
            }
            onChangeText={(t) =>
              updateInput(
                'vendorSwitchSavings',
                t ? parseInt(t, 10) || 0 : 0
              )
            }
            placeholder="e.g. 200"
            keyboardType="number-pad"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Cut a recurring cost ($/mo)</Text>
          <TextInput
            style={styles.input}
            value={
              inputs.subscriptionCancelSavings
                ? String(inputs.subscriptionCancelSavings)
                : ''
            }
            onChangeText={(t) =>
              updateInput(
                'subscriptionCancelSavings',
                t ? parseInt(t, 10) || 0 : 0
              )
            }
            placeholder="e.g. app, Square tier"
            keyboardType="number-pad"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        <View style={styles.runRow}>
          <TextInput
            style={styles.scenarioNameInput}
            value={newScenarioName}
            onChangeText={setNewScenarioName}
            placeholder="e.g. Raise pastry prices 10%"
            placeholderTextColor={Colors.textTertiary}
          />
          <Pressable
            style={[styles.runBtn, !hasAnyInput && styles.runBtnDisabled]}
            onPress={runNewSimulation}
            disabled={!hasAnyInput}
          >
            <Feather name="play" size={18} color="#fff" />
            <Text style={styles.runBtnText}>Run simulation</Text>
          </Pressable>
        </View>
      </View>

      {/* Scenario cards */}
      {scenarios.length > 0 && (
        <View style={contentStyles.card}>
          <Text style={contentStyles.cardTitle}>Scenarios</Text>
          <Text style={contentStyles.cardSubtitle}>
            Compare projected revenue, expenses, and profit. Select two to compare in the chart below.
          </Text>
          <ScrollView
            horizontal={!isNative}
            showsHorizontalScrollIndicator={false}
            style={styles.cardsScroll}
            contentContainerStyle={styles.cardsScrollContent}
          >
            {scenarios.map((s) => {
              const revCh = s.simulatedMetrics.revenue - s.baselineMetrics.revenue;
              const expCh = s.simulatedMetrics.expenses - s.baselineMetrics.expenses;
              const profitCh = s.simulatedMetrics.profit - s.baselineMetrics.profit;
              const isCompare = compareSelected.includes(s.id);
              return (
                <View key={s.id} style={styles.scenarioCard}>
                  <View style={styles.scenarioCardHeader}>
                    <Text style={styles.scenarioCardName} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Pressable
                      onPress={() =>
                        setCompareSelected((prev) =>
                          prev.includes(s.id)
                            ? prev.filter((x) => x !== s.id)
                            : prev.length >= 2
                              ? [prev[1], s.id]
                              : [...prev, s.id]
                        )
                      }
                      style={[styles.compareChip, isCompare && styles.compareChipActive]}
                    >
                      <Text
                        style={[
                          styles.compareChipText,
                          isCompare && styles.compareChipTextActive,
                        ]}
                      >
                        {isCompare ? 'Comparing' : 'Compare'}
                      </Text>
                    </Pressable>
                  </View>
                  <Text style={styles.scenarioCardDesc} numberOfLines={2}>
                    {s.description}
                  </Text>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Revenue</Text>
                    <Text
                      style={[
                        styles.metricChange,
                        revCh >= 0 ? styles.positive : styles.negative,
                      ]}
                    >
                      {revCh >= 0 ? '+' : ''}
                      {formatCurrency(revCh)}
                    </Text>
                  </View>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Expenses</Text>
                    <Text
                      style={[
                        styles.metricChange,
                        -expCh >= 0 ? styles.positive : styles.negative,
                      ]}
                    >
                      {-expCh >= 0 ? '-' : '+'}
                      {formatCurrency(Math.abs(expCh))}
                    </Text>
                  </View>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Profit</Text>
                    <Text
                      style={[
                        styles.metricChange,
                        profitCh >= 0 ? styles.positive : styles.negative,
                      ]}
                    >
                      {profitCh >= 0 ? '+' : ''}
                      {formatCurrency(profitCh)}
                    </Text>
                  </View>
                  <View style={styles.confidenceRow}>
                    <Feather name="bar-chart-2" size={14} color={Colors.textTertiary} />
                    <Text style={styles.confidenceText}>
                      Confidence: ~{s.confidence}%
                    </Text>
                  </View>
                  <View style={styles.explanationBox}>
                    <Text style={styles.explanationLabel}>AI explanation</Text>
                    <Text style={styles.explanationBody}>{s.explanation}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Comparison chart */}
      {comparisonData && comparisonData.labels.length >= 2 && (
        <View
          style={contentStyles.card}
          onLayout={(e: LayoutChangeEvent) =>
            setChartW(e.nativeEvent.layout.width - (isNative ? 32 : 48))
          }
        >
          <Text style={contentStyles.cardTitle}>Compare scenarios</Text>
          <Text style={contentStyles.cardSubtitle}>
            Baseline vs selected scenarios — revenue, expenses, profit.
          </Text>
          {chartW > 0 && (
            <BarChart
              width={chartW}
              height={220}
              labels={comparisonData.labels}
              series={comparisonData.series}
            />
          )}
        </View>
      )}

      {isDemoMode && (
        <View style={styles.demoBanner}>
          <Feather name="info" size={16} color={Colors.primary} />
          <Text style={styles.demoBannerText}>
            Demo: sample numbers for a small shop (e.g. local bakery). Sales $12k, costs $8k, profit $4k per month. Add your own data to use your real numbers.
          </Text>
        </View>
      )}
    </>
  );
}

function describeInputs(inputs: ScenarioInputs): string {
  const parts: string[] = [];
  if (inputs.priceChangePercent) {
    parts.push(
      `Prices ${inputs.priceChangePercent > 0 ? '+' : ''}${inputs.priceChangePercent}%`
    );
  }
  if (inputs.marketingChangePercent) {
    parts.push(
      `Ads ${inputs.marketingChangePercent > 0 ? '+' : ''}${inputs.marketingChangePercent}%`
    );
  }
  if (inputs.newEmployeeCost && inputs.newEmployeeCost > 0) {
    parts.push(`Hire help $${inputs.newEmployeeCost.toLocaleString()}/mo`);
  }
  if (inputs.vendorSwitchSavings && inputs.vendorSwitchSavings > 0) {
    parts.push(`Cheaper supplier $${inputs.vendorSwitchSavings.toLocaleString()}/mo`);
  }
  if (
    inputs.subscriptionCancelSavings &&
    inputs.subscriptionCancelSavings > 0
  ) {
    parts.push(`Cut cost $${inputs.subscriptionCancelSavings.toLocaleString()}/mo`);
  }
  return parts.length ? parts.join(' · ') : 'No changes';
}

const styles = StyleSheet.create({
  baselineRow: {
    flexDirection: isNative ? 'column' : 'row',
    gap: 12,
    marginBottom: 24,
  },
  baselineCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderColor: Colors.cardBorder,
  },
  baselineLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  baselineValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  builderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  builderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  sliderBlock: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  sliderHint: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderMin: {
    fontSize: 11,
    color: Colors.textTertiary,
    width: 32,
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.inputBg,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderMax: {
    fontSize: 11,
    color: Colors.textTertiary,
    width: 32,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  input: {
    width: 120,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.inputBg,
  },
  runRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  scenarioNameInput: {
    flex: 1,
    minWidth: 160,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.inputBg,
  },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  runBtnDisabled: {
    opacity: 0.5,
  },
  runBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  cardsScroll: {
    marginHorizontal: -4,
  },
  cardsScrollContent: {
    flexDirection: isNative ? 'column' : 'row',
    gap: 16,
    paddingVertical: 8,
  },
  scenarioCard: {
    minWidth: 300,
    maxWidth: 340,
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scenarioCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  scenarioCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  compareChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compareChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  compareChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  compareChipTextActive: {
    color: '#fff',
  },
  scenarioCardDesc: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  metricChange: {
    fontSize: 13,
    fontWeight: '600',
  },
  positive: { color: Colors.success },
  negative: { color: Colors.danger },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  confidenceText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  explanationBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  explanationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  explanationBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoBannerText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
});
