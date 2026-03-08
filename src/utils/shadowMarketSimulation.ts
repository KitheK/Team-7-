import type { BaselineMetrics, ScenarioInputs } from '../types/shadowMarket';

// Demand elasticity: -0.5 to -1.5 (price up → demand down)
const ELASTICITY_MIN = -1.5;
const ELASTICITY_MAX = -0.5;

// Marketing: every 10% spend → 3–8% revenue growth
const MARKETING_REVENUE_LIFT_MIN = 0.3;
const MARKETING_REVENUE_LIFT_MAX = 0.8;

// Hiring: revenue capacity lift 10–20%
const HIRING_CAPACITY_LIFT_MIN = 0.1;
const HIRING_CAPACITY_LIFT_MAX = 0.2;

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function runSimulation(
  baseline: BaselineMetrics,
  inputs: ScenarioInputs,
  scenarioSeed: number = 0
): { revenue: number; expenses: number; profit: number; confidence: number } {
  let revenue = baseline.revenue;
  let expenses = baseline.expenses;
  const factors: number[] = [];

  // Price change
  if (inputs.priceChangePercent != null && inputs.priceChangePercent !== 0) {
    const elasticity =
      ELASTICITY_MIN + seededRandom(scenarioSeed + 1) * (ELASTICITY_MAX - ELASTICITY_MIN);
    const demandChange = elasticity * (inputs.priceChangePercent / 100);
    // newRevenue ≈ (price * (1 + priceChange%)) * (quantity * (1 + demandChange))
    const priceFactor = 1 + inputs.priceChangePercent / 100;
    const quantityFactor = 1 + demandChange;
    revenue = revenue * priceFactor * quantityFactor;
    factors.push(0.7 + seededRandom(scenarioSeed + 10) * 0.25);
  }

  // Marketing
  if (inputs.marketingChangePercent != null && inputs.marketingChangePercent !== 0) {
    const liftPer10 =
      MARKETING_REVENUE_LIFT_MIN +
      seededRandom(scenarioSeed + 2) * (MARKETING_REVENUE_LIFT_MAX - MARKETING_REVENUE_LIFT_MIN);
    const revenueLift = (inputs.marketingChangePercent / 100) * (liftPer10 / 0.1);
    revenue = revenue * (1 + revenueLift);
    const marketingSpendChange =
      baseline.expenses * (inputs.marketingChangePercent / 100) * 0.15; // assume 15% of expenses are marketing
    expenses = expenses + marketingSpendChange;
    factors.push(0.5 + seededRandom(scenarioSeed + 20) * 0.4);
  }

  // New employee
  if (inputs.newEmployeeCost != null && inputs.newEmployeeCost > 0) {
    expenses = expenses + inputs.newEmployeeCost;
    const capacityLift =
      HIRING_CAPACITY_LIFT_MIN +
      seededRandom(scenarioSeed + 3) * (HIRING_CAPACITY_LIFT_MAX - HIRING_CAPACITY_LIFT_MIN);
    revenue = revenue * (1 + capacityLift);
    factors.push(0.6 + seededRandom(scenarioSeed + 30) * 0.3);
  }

  // Vendor switch savings
  if (inputs.vendorSwitchSavings != null && inputs.vendorSwitchSavings > 0) {
    expenses = expenses - inputs.vendorSwitchSavings;
    factors.push(0.75 + seededRandom(scenarioSeed + 4) * 0.2);
  }

  // Subscription cancellation savings
  if (inputs.subscriptionCancelSavings != null && inputs.subscriptionCancelSavings > 0) {
    expenses = expenses - inputs.subscriptionCancelSavings;
    factors.push(0.85 + seededRandom(scenarioSeed + 5) * 0.12);
  }

  const profit = revenue - expenses;
  const confidence =
    factors.length === 0
      ? 90
      : Math.round(Math.min(92, Math.max(55, factors.reduce((a, b) => a + b, 0) / factors.length * 100)));

  return { revenue, expenses, profit, confidence };
}
