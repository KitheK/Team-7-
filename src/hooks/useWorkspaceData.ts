import { useMemo } from 'react';
import type { Transaction } from '../context/WorkspaceContext';
import { useColors } from '../context/ThemeContext';
import { getCategoryForVendor, CATEGORY_COLORS } from '../utils/vendorCategoryMap';

export type SubscriptionRow = {
  vendor: string;
  category: string;
  totalAmount: number;
  count: number;
  lastDate: string | null;
  isDuplicate: boolean;
};

export type PriceCreepSignal = {
  vendor: string;
  count: number;
  totalAmount: number;
  amounts: number[];
  message: string;
};

export type CategoryRow = {
  name: string;
  value: number;
  color: string;
};

export type VendorAnalyticsRow = {
  vendor: string;
  category: string;
  total: number;
  count: number;
  avg: number;
};

export function useWorkspaceData(transactions: Transaction[]) {
  const c = useColors();

  return useMemo(() => {
    const totalAmount = transactions.reduce((s, t) => s + Number(t.amount), 0);

    const byVendor = new Map<string, { total: number; count: number; dates: string[]; amounts: number[] }>();
    for (const t of transactions) {
      const v = t.vendor_name || t.description || 'Unknown';
      const key = v.trim() || 'Unknown';
      const existing = byVendor.get(key) ?? { total: 0, count: 0, dates: [], amounts: [] };
      existing.total += Number(t.amount);
      existing.count += 1;
      if (t.transaction_date) existing.dates.push(t.transaction_date);
      existing.amounts.push(Number(t.amount));
      byVendor.set(key, existing);
    }

    const subscriptions: SubscriptionRow[] = Array.from(byVendor.entries()).map(([vendor, data]) => ({
      vendor,
      category: getCategoryForVendor(vendor),
      totalAmount: data.total,
      count: data.count,
      lastDate: data.dates.length > 0 ? data.dates.sort().reverse()[0]! : null,
      isDuplicate: data.count > 1,
    })).sort((a, b) => b.totalAmount - a.totalAmount);

    const priceCreepSignals: PriceCreepSignal[] = Array.from(byVendor.entries())
      .filter(([, data]) => data.count > 1 || (data.amounts.length >= 2 && Math.max(...data.amounts) > Math.min(...data.amounts) * 1.05))
      .map(([vendor, data]) => {
        const sorted = [...data.amounts].sort((a, b) => a - b);
        const min = sorted[0]!;
        const max = sorted[sorted.length - 1]!;
        const pct = min > 0 ? (((max - min) / min) * 100).toFixed(0) : '0';
        return {
          vendor,
          count: data.count,
          totalAmount: data.total,
          amounts: data.amounts,
          message: data.count > 1
            ? `Charged ${data.count}× this period — possible duplicate`
            : `Variance: $${min.toLocaleString()} → $${max.toLocaleString()} (+${pct}%)`,
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const byCategory = new Map<string, number>();
    for (const t of transactions) {
      const vendor = t.vendor_name || t.description || 'Unknown';
      const cat = getCategoryForVendor(vendor);
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + Number(t.amount));
    }
    const byCategorySorted: CategoryRow[] = Array.from(byCategory.entries())
      .map(([name, value], i) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] ?? c.chart[i % c.chart.length],
      }))
      .sort((a, b) => b.value - a.value);

    const vendorAnalytics: VendorAnalyticsRow[] = Array.from(byVendor.entries()).map(([vendor, data]) => ({
      vendor,
      category: getCategoryForVendor(vendor),
      total: data.total,
      count: data.count,
      avg: data.count > 0 ? data.total / data.count : 0,
    })).sort((a, b) => b.total - a.total);

    const byVendorChart = subscriptions.map((s, i) => ({
      name: s.vendor,
      value: s.totalAmount,
      color: c.chart[i % c.chart.length],
    }));

    return {
      totalAmount,
      subscriptionCount: subscriptions.length,
      duplicateOrAlertCount: subscriptions.filter(s => s.isDuplicate).length,
      subscriptions,
      priceCreepSignals,
      byCategory: byCategorySorted,
      byVendorChart,
      vendorAnalytics,
      isEmpty: transactions.length === 0,
    };
  }, [transactions, c]);
}
