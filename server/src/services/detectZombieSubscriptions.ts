import { supabaseAdmin } from '../lib/supabase';

export async function detectZombieSubscriptions(
  workspaceId: string,
): Promise<number> {
  const { data: duplicates, error } = await supabaseAdmin.rpc(
    'find_zombie_subscriptions',
    { ws_id: workspaceId },
  );

  if (error) throw new Error(`Zombie detection failed: ${error.message}`);
  if (!duplicates || duplicates.length === 0) return 0;

  let inserted = 0;

  for (const dup of duplicates) {
    const minCharge = Math.min(...dup.charge_amounts);
    const wasteAmount = dup.total_charged - minCharge;

    if (wasteAmount <= 0) continue;

    const { error: upsertError } = await supabaseAdmin
      .from('anomalies')
      .upsert(
        {
          workspace_id: workspaceId,
          type: 'zombie_subscription' as const,
          amount: wasteAmount,
          status: 'open' as const,
          metadata: {
            vendor_name: dup.vendor_name,
            charge_month: dup.charge_month,
            charge_count: dup.charge_count,
            total_charged: dup.total_charged,
            transaction_ids: dup.transaction_ids,
            charge_amounts: dup.charge_amounts,
          },
        },
        { onConflict: 'id', ignoreDuplicates: true },
      );

    if (!upsertError) inserted++;
  }

  return inserted;
}
