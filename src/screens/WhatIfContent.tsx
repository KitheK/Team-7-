import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, LayoutChangeEvent, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import { getContentStyles } from '../constants/contentStyles';
import { useWorkspace } from '../context/WorkspaceContext';
import { type Scenario, type ScenarioInputs, type BaselineMetrics, DEMO_BASELINE } from '../types/shadowMarket';
import { runSimulation } from '../utils/shadowMarketSimulation';
import { generateExplanation } from '../utils/shadowMarketExplanation';
import BarChart from '../components/charts/BarChart';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
const fmt = (n: number) => '$' + Math.round(n).toLocaleString();

function getBaseline(viewTotal: number, isDemoMode: boolean): BaselineMetrics {
  if (isDemoMode || viewTotal === 0) return DEMO_BASELINE;
  const expenses = viewTotal;
  const revenue = expenses * 1.38;
  return { revenue, expenses, profit: revenue - expenses };
}

const DEFAULTS: ScenarioInputs = { priceChangePercent: 0, marketingChangePercent: 0, newEmployeeCost: 0, vendorSwitchSavings: 0, subscriptionCancelSavings: 0 };

export default function WhatIfContent() {
  const { activeWorkspaceTransactions, isDemoMode } = useWorkspace();
  const c = useColors();
  const cs = useMemo(() => getContentStyles(c), [c]);
  const s = useMemo(() => createStyles(c), [c]);

  const viewTotal = useMemo(() => activeWorkspaceTransactions.reduce((s, t) => s + Number(t.amount), 0), [activeWorkspaceTransactions]);
  const baseline = useMemo(() => getBaseline(viewTotal, isDemoMode), [viewTotal, isDemoMode]);

  const [chartW, setChartW] = useState(0);
  const [inputs, setInputs] = useState<ScenarioInputs>({ ...DEFAULTS });
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [name, setName] = useState('');

  const upd = useCallback(<K extends keyof ScenarioInputs>(k: K, v: number) => setInputs(p => ({ ...p, [k]: v })), []);

  const run = useCallback(() => {
    const n = name.trim() || `Scenario ${scenarios.length + 1}`;
    const id = `sc-${Date.now()}`;
    const result = runSimulation(baseline, inputs, id.length);
    const explanation = generateExplanation(baseline, inputs, result);
    setScenarios(p => [...p, { id, name: n, description: describe(inputs), inputs: { ...inputs }, baselineMetrics: { ...baseline }, simulatedMetrics: result, explanation, confidence: result.confidence }]);
    setCompare(p => p.length < 2 ? [...p, id] : [p[1], id]);
    setName('');
    setInputs({ ...DEFAULTS });
  }, [baseline, inputs, name, scenarios.length]);

  const compData = useMemo(() => {
    const labels = ['Current'], rev = [baseline.revenue], exp = [baseline.expenses], profit = [baseline.profit];
    compare.slice(0, 2).forEach(id => { const sc = scenarios.find(s => s.id === id); if (sc) { labels.push(sc.name); rev.push(sc.simulatedMetrics.revenue); exp.push(sc.simulatedMetrics.expenses); profit.push(sc.simulatedMetrics.profit); } });
    return labels.length < 2 ? null : { labels, series: [{ data: rev, color: c.chart[0], label: 'Revenue' }, { data: exp, color: c.chart[2], label: 'Expenses' }, { data: profit, color: c.chart[1], label: 'Profit' }] };
  }, [baseline, scenarios, compare, c.chart]);

  const hasInput = Object.values(inputs).some(v => v !== 0);

  return (
    <>
      <Text style={cs.pageTitle}>What If</Text>
      <Text style={cs.pageSubtitle}>Simulate decisions before you make them.</Text>

      <View style={s.baselineRow}>
        {[{ l: 'Revenue / mo', v: baseline.revenue, clr: c.chart[0] }, { l: 'Expenses / mo', v: baseline.expenses, clr: c.chart[2] }, { l: 'Profit / mo', v: baseline.profit, clr: c.success }].map(b => (
          <View key={b.l} style={[s.baselineCard, { borderTopColor: b.clr }]}>
            <Text style={s.baselineLabel}>{b.l}</Text>
            <Text style={[s.baselineValue, b.l.includes('Profit') && { color: c.success }]}>{fmt(b.v)}</Text>
          </View>
        ))}
      </View>

      <View style={cs.card}>
        <View style={s.builderHeader}>
          <View style={s.builderIcon}><Feather name="sliders" size={18} color={c.primary} /></View>
          <View><Text style={s.builderTitle}>Build a scenario</Text><Text style={s.builderSub}>Tweak numbers and run a simulation</Text></View>
        </View>

        <Slider label="Price change" hint="Raise or lower prices" value={inputs.priceChangePercent ?? 0} min={-20} max={20} step={5} suffix="%" onChange={v => upd('priceChangePercent', v)} c={c} s={s} />
        <Slider label="Marketing spend" hint="Ads, flyers, promos" value={inputs.marketingChangePercent ?? 0} min={-50} max={50} step={10} suffix="%" onChange={v => upd('marketingChangePercent', v)} c={c} s={s} />
        <NumInput label="Hire help" placeholder="e.g. 800" suffix="/mo" value={inputs.newEmployeeCost ?? 0} onChange={v => upd('newEmployeeCost', v)} c={c} s={s} />
        <NumInput label="Switch supplier savings" placeholder="e.g. 200" suffix="/mo" value={inputs.vendorSwitchSavings ?? 0} onChange={v => upd('vendorSwitchSavings', v)} c={c} s={s} />
        <NumInput label="Cut a recurring cost" placeholder="e.g. 50" suffix="/mo" value={inputs.subscriptionCancelSavings ?? 0} onChange={v => upd('subscriptionCancelSavings', v)} c={c} s={s} />

        <View style={s.runRow}>
          <TextInput style={s.nameInput} value={name} onChangeText={setName} placeholder="Name this scenario..." placeholderTextColor={c.textTertiary} />
          <Pressable style={[s.runBtn, !hasInput && s.runBtnDisabled]} onPress={run} disabled={!hasInput}>
            <Feather name="play" size={16} color="#fff" /><Text style={s.runBtnText}>Run</Text>
          </Pressable>
        </View>
      </View>

      {scenarios.length > 0 && (
        <View style={cs.card}>
          <Text style={s.resultsTitle}>Results</Text>
          <Text style={s.resultsSub}>Tap to compare in chart</Text>
          <ScrollView horizontal={!isNative} showsHorizontalScrollIndicator={false} contentContainerStyle={s.scenarioScroll}>
            {scenarios.map(sc => {
              const delta = sc.simulatedMetrics.profit - sc.baselineMetrics.profit;
              const sel = compare.includes(sc.id);
              return (
                <Pressable key={sc.id} style={[s.scenarioCard, sel && s.scenarioCardSel]} onPress={() => setCompare(p => p.includes(sc.id) ? p.filter(x => x !== sc.id) : p.length >= 2 ? [p[1], sc.id] : [...p, sc.id])}>
                  <View style={s.scenarioHeader}>
                    <Text style={s.scenarioName} numberOfLines={1}>{sc.name}</Text>
                    {sel && <View style={s.selDot}><Feather name="check" size={10} color="#fff" /></View>}
                  </View>
                  <Text style={s.scenarioDesc} numberOfLines={1}>{sc.description}</Text>
                  <View style={s.scenarioDelta}>
                    <Feather name={delta >= 0 ? 'trending-up' : 'trending-down'} size={16} color={delta >= 0 ? c.success : c.danger} />
                    <Text style={[s.scenarioDeltaText, { color: delta >= 0 ? c.success : c.danger }]}>{delta >= 0 ? '+' : ''}{fmt(delta)} profit/mo</Text>
                  </View>
                  <View style={s.confRow}><View style={s.confTrack}><View style={[s.confFill, { width: `${sc.confidence}%` }]} /></View><Text style={s.confText}>{sc.confidence}%</Text></View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {compData && compData.labels.length >= 2 && (
        <View style={cs.card} onLayout={(e: LayoutChangeEvent) => setChartW(e.nativeEvent.layout.width - (isNative ? 32 : 48))}>
          <Text style={s.resultsTitle}>Comparison</Text><Text style={s.resultsSub}>Current vs scenarios</Text>
          {chartW > 0 && <BarChart width={chartW} height={220} labels={compData.labels} series={compData.series} />}
        </View>
      )}

      {isDemoMode && (
        <View style={s.demoBanner}><Feather name="info" size={14} color={c.primary} /><Text style={s.demoText}>Demo mode — using sample numbers.</Text></View>
      )}
    </>
  );
}

function Slider({ label, hint, value, min, max, step, suffix, onChange, c, s }: any) {
  return (
    <View style={s.sliderBlock}>
      <Text style={s.inputLabel}>{label}</Text><Text style={s.inputHint}>{hint}</Text>
      <View style={s.sliderRow}>
        <Pressable style={s.stepBtn} onPress={() => onChange(Math.max(min, value - step))}><Feather name="minus" size={16} color={c.text} /></Pressable>
        <View style={s.sliderTrack}><View style={[s.sliderFill, { width: `${((value - min) / (max - min)) * 100}%` }]} /></View>
        <Pressable style={s.stepBtn} onPress={() => onChange(Math.min(max, value + step))}><Feather name="plus" size={16} color={c.text} /></Pressable>
        <Text style={s.sliderValue}>{value > 0 ? '+' : ''}{value}{suffix}</Text>
      </View>
    </View>
  );
}

function NumInput({ label, placeholder, suffix, value, onChange, c, s }: any) {
  return (
    <View style={s.numBlock}>
      <Text style={s.inputLabel}>{label}</Text>
      <View style={s.numRow}><Text style={s.dollar}>$</Text><TextInput style={s.numInput} value={value ? String(value) : ''} onChangeText={(t: string) => onChange(t ? parseInt(t, 10) || 0 : 0)} placeholder={placeholder} keyboardType="number-pad" placeholderTextColor={c.textTertiary} /><Text style={s.suffixText}>{suffix}</Text></View>
    </View>
  );
}

function describe(inp: ScenarioInputs) {
  const p: string[] = [];
  if (inp.priceChangePercent) p.push(`Prices ${inp.priceChangePercent > 0 ? '+' : ''}${inp.priceChangePercent}%`);
  if (inp.marketingChangePercent) p.push(`Marketing ${inp.marketingChangePercent > 0 ? '+' : ''}${inp.marketingChangePercent}%`);
  if (inp.newEmployeeCost && inp.newEmployeeCost > 0) p.push(`Hire $${inp.newEmployeeCost}/mo`);
  if (inp.vendorSwitchSavings && inp.vendorSwitchSavings > 0) p.push(`Save $${inp.vendorSwitchSavings}/mo`);
  if (inp.subscriptionCancelSavings && inp.subscriptionCancelSavings > 0) p.push(`Cut $${inp.subscriptionCancelSavings}/mo`);
  return p.join(' · ') || 'No changes';
}

function createStyles(c: any) {
  return StyleSheet.create({
    baselineRow: { flexDirection: isNative ? 'column' : 'row', gap: 12, marginBottom: 20 },
    baselineCard: { flex: isNative ? 0 : 1, backgroundColor: c.card, borderRadius: 12, padding: isNative ? 14 : 16, borderWidth: 1, borderColor: c.cardBorder, borderTopWidth: 3 },
    baselineLabel: { fontSize: 12, color: c.textSecondary, marginBottom: 4 },
    baselineValue: { fontSize: isNative ? 20 : 22, fontWeight: '700', color: c.text },
    builderHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    builderIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: c.primaryLight, alignItems: 'center', justifyContent: 'center' },
    builderTitle: { fontSize: 16, fontWeight: '600', color: c.text },
    builderSub: { fontSize: 12, color: c.textSecondary, marginTop: 1 },
    sliderBlock: { marginBottom: 16 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 2 },
    inputHint: { fontSize: 11, color: c.textTertiary, marginBottom: 8 },
    sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    stepBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    sliderTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: c.border, overflow: 'hidden' },
    sliderFill: { height: '100%', backgroundColor: c.primary, borderRadius: 3 },
    sliderValue: { fontSize: 14, fontWeight: '700', color: c.text, width: 50, textAlign: 'right' },
    numBlock: { marginBottom: 12 },
    numRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.inputBg, borderRadius: 10, borderWidth: 1, borderColor: c.border, paddingHorizontal: 12, marginTop: 4 },
    dollar: { fontSize: 14, color: c.textTertiary, marginRight: 4 },
    numInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: c.text },
    suffixText: { fontSize: 12, color: c.textTertiary, marginLeft: 4 },
    runRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, flexWrap: 'wrap' },
    nameInput: { flex: 1, minWidth: 140, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: c.text, backgroundColor: c.inputBg },
    runBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
    runBtnDisabled: { opacity: 0.4 },
    runBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    resultsTitle: { fontSize: 15, fontWeight: '600', color: c.text, marginBottom: 2 },
    resultsSub: { fontSize: 12, color: c.textTertiary, marginBottom: 14 },
    scenarioScroll: { flexDirection: isNative ? 'column' : 'row', gap: 12 },
    scenarioCard: { minWidth: isNative ? undefined : 260, maxWidth: isNative ? undefined : 300, backgroundColor: c.inputBg, borderRadius: 12, padding: 16, borderWidth: 1.5, borderColor: c.border },
    scenarioCardSel: { borderColor: c.primary, backgroundColor: c.primaryLight },
    scenarioHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    scenarioName: { fontSize: 15, fontWeight: '600', color: c.text, flex: 1 },
    selDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
    scenarioDesc: { fontSize: 12, color: c.textTertiary, marginBottom: 12 },
    scenarioDelta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    scenarioDeltaText: { fontSize: 15, fontWeight: '700' },
    confRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    confTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: c.border, overflow: 'hidden' },
    confFill: { height: '100%', backgroundColor: c.primary, borderRadius: 2 },
    confText: { fontSize: 11, color: c.textTertiary, fontWeight: '600' },
    demoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: c.primaryLight, borderRadius: 10 },
    demoText: { fontSize: 12, color: c.textSecondary, flex: 1 },
  });
}
