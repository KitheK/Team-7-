import type { BaselineMetrics, ScenarioInputs } from '../types/shadowMarket';

type Simulated = { revenue: number; expenses: number; profit: number };

function pct(base: number, value: number): number {
  if (base === 0) return 0;
  return Math.round(((value - base) / base) * 100);
}

export function generateExplanation(
  baseline: BaselineMetrics,
  inputs: ScenarioInputs,
  simulated: Simulated
): string {
  const parts: string[] = [];
  const revPct = pct(baseline.revenue, simulated.revenue);
  const expPct = pct(baseline.expenses, simulated.expenses);
  const profitPct = pct(baseline.profit, simulated.profit);

  if (inputs.priceChangePercent != null && inputs.priceChangePercent !== 0) {
    const direction = inputs.priceChangePercent > 0 ? 'raise' : 'lower';
    const absPct = Math.abs(inputs.priceChangePercent);
    const demandEffect = inputs.priceChangePercent > 0 ? 'you might sell a bit less' : 'you might sell more';
    parts.push(
      `If you ${direction} your prices by ${absPct}% (e.g. on pastries or menu items), sales may ${revPct >= 0 ? 'go up' : 'go down'} by about ${Math.abs(revPct)}% while ${demandEffect}.`
    );
  }

  if (inputs.marketingChangePercent != null && inputs.marketingChangePercent !== 0) {
    const dir = inputs.marketingChangePercent > 0 ? 'Spending more' : 'Spending less';
    const absPct = Math.abs(inputs.marketingChangePercent);
    parts.push(
      `${dir} on ads or promotions (${absPct}%) could bring roughly ${revPct >= 0 ? '+' : ''}${revPct}% in sales, though more spend also adds to your costs.`
    );
  }

  if (inputs.newEmployeeCost != null && inputs.newEmployeeCost > 0) {
    parts.push(
      `Hiring help at $${inputs.newEmployeeCost.toLocaleString()}/mo (e.g. a part-timer or weekend shift) adds to costs but can bring in more sales; overall you might see ${profitPct >= 0 ? 'a bit more' : 'a bit less'} left over — about ${profitPct >= 0 ? '+' : ''}${profitPct}%.`
    );
  }

  if (inputs.vendorSwitchSavings != null && inputs.vendorSwitchSavings > 0) {
    parts.push(
      `Switching to a cheaper supplier or option saves $${inputs.vendorSwitchSavings.toLocaleString()}/mo, so your costs go down and what you keep goes up by about ${profitPct >= 0 ? '+' : ''}${profitPct}%.`
    );
  }

  if (inputs.subscriptionCancelSavings != null && inputs.subscriptionCancelSavings > 0) {
    parts.push(
      `Cutting a recurring cost (e.g. an app or subscription) saves $${inputs.subscriptionCancelSavings.toLocaleString()}/mo, so you keep about ${profitPct >= 0 ? '+' : ''}${profitPct}% more.`
    );
  }

  if (parts.length === 0) {
    return 'No changes applied yet. Tweak the levers above (prices, ads, hire, supplier, or recurring cost) and run the simulation.';
  }

  const summary =
    profitPct > 0
      ? ` Bottom line: you’d keep about ${profitPct}% more.`
      : profitPct < 0
        ? ` Bottom line: you’d keep about ${Math.abs(profitPct)}% less.`
        : ' Bottom line: roughly the same.';

  return parts.join(' ') + summary;
}
