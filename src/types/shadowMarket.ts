export type ScenarioInputs = {
  priceChangePercent?: number;
  marketingChangePercent?: number;
  newEmployeeCost?: number;
  vendorSwitchSavings?: number;
  subscriptionCancelSavings?: number;
};

export type BaselineMetrics = {
  revenue: number;
  expenses: number;
  profit: number;
};

export type Scenario = {
  id: string;
  name: string;
  description: string;
  inputs: ScenarioInputs;
  baselineMetrics: BaselineMetrics;
  simulatedMetrics: {
    revenue: number;
    expenses: number;
    profit: number;
  };
  explanation: string;
  confidence: number;
};

/** Demo baseline: local small business scale (e.g. downtown bakery, small shop). Monthly. */
export const DEMO_BASELINE: BaselineMetrics = {
  revenue: 12_000,
  expenses: 8_000,
  profit: 4_000,
};
