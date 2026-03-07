import { supabaseAdmin } from '../lib/supabase';

interface MonthlyRecord {
  charge_month: string;
  avg_charge: number;
  charge_count: number;
  min_charge: number;
  max_charge: number;
  stddev_charge: number | null;
}

function stddev(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1);
  return Math.sqrt(variance);
}

export async function detectPriceCreep(
  workspaceId: string,
  sigmaThreshold = 2,
): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc('get_vendor_history', {
    ws_id: workspaceId,
  });

  if (error) throw new Error(`Price creep detection failed: ${error.message}`);
  if (!data || data.length === 0) return 0;

  const vendorMap = new Map<string, MonthlyRecord[]>();
  for (const row of data) {
    const records = vendorMap.get(row.vendor_name) ?? [];
    records.push({
      charge_month: row.charge_month,
      avg_charge: Number(row.avg_charge),
      charge_count: Number(row.charge_count),
      min_charge: Number(row.min_charge),
      max_charge: Number(row.max_charge),
      stddev_charge: row.stddev_charge != null ? Number(row.stddev_charge) : null,
    });
    vendorMap.set(row.vendor_name, records);
  }

  let inserted = 0;

  for (const [vendorName, records] of vendorMap) {
    if (records.length < 3) continue;

    records.sort(
      (a, b) => new Date(a.charge_month).getTime() - new Date(b.charge_month).getTime(),
    );

    const baseline = records.slice(0, -1);
    const latest = records[records.length - 1];

    const baselineValues = baseline.map((r) => r.avg_charge);
    const mu = baselineValues.reduce((a, b) => a + b, 0) / baselineValues.length;
    const sigma = stddev(baselineValues);

    const latestCharge = latest.avg_charge;

    if (sigma === 0 || latestCharge <= mu + sigmaThreshold * sigma) continue;

    const excess = latestCharge - mu;
    const deviationPct = ((excess / mu) * 100).toFixed(1);

    const { error: upsertError } = await supabaseAdmin.from('anomalies').upsert(
      {
        workspace_id: workspaceId,
        type: 'price_creep' as const,
        amount: parseFloat(excess.toFixed(2)),
        status: 'open' as const,
        metadata: {
          vendor_name: vendorName,
          mu: parseFloat(mu.toFixed(2)),
          sigma: parseFloat(sigma.toFixed(2)),
          latestCharge: parseFloat(latestCharge.toFixed(2)),
          deviationPct,
          history: records,
        },
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );

    if (!upsertError) inserted++;
  }

  return inserted;
}
