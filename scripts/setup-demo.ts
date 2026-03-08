/**
 * Signs in, uploads 11 months of sample data (Jan-Nov 2025),
 * leaves December empty for live demo.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(SUPABASE_URL, ANON_KEY);

const EMAIL = process.argv[2]!;
const PASSWORD = process.argv[3]!;
const YEAR = 2025;
const DATA_DIR = path.resolve(__dirname, '../sample-data');
const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

interface CsvRow {
  vendor_name: string;
  amount: number;
  transaction_date: string;
  description: string;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split('\n');
  lines.shift();
  return lines.map(line => {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { parts.push(current); current = ''; continue; }
      current += ch;
    }
    parts.push(current);
    return {
      vendor_name: parts[0]?.trim() ?? '',
      amount: parseFloat(parts[1] ?? '0'),
      transaction_date: parts[2]?.trim() ?? '',
      description: parts[3]?.trim() ?? '',
    };
  }).filter(r => r.vendor_name && !isNaN(r.amount));
}

async function main() {
  console.log(`\nSigning in as ${EMAIL}...`);
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (authErr || !auth.user) {
    console.error('Auth failed:', authErr?.message);
    process.exit(1);
  }
  const userId = auth.user.id;
  console.log(`Authenticated: ${userId}\n`);

  // Clean existing 2025 data
  const { data: oldWs } = await supabase
    .from('workspaces')
    .select('id')
    .eq('user_id', userId)
    .eq('year', YEAR);

  if (oldWs && oldWs.length > 0) {
    console.log(`Cleaning ${oldWs.length} existing ${YEAR} workspaces...`);
    for (const w of oldWs) {
      await supabase.from('transactions').delete().eq('workspace_id', w.id);
      await supabase.from('upload_batches').delete().eq('workspace_id', w.id);
    }
    await supabase.from('workspaces').delete().eq('user_id', userId).eq('year', YEAR);
    console.log('Cleared.\n');
  }

  // Clean existing opportunities
  await supabase.from('opportunities').delete().eq('user_id', userId);

  // Create 12 workspaces (all months, so the grid looks complete)
  console.log(`Creating ${YEAR} workspaces...`);
  const wsMap = new Map<number, string>();
  for (let m = 1; m <= 12; m++) {
    const { data: ws, error } = await supabase
      .from('workspaces')
      .insert({ user_id: userId, month: m, year: YEAR, total_saved: 0 })
      .select('id')
      .single();
    if (error) {
      console.log(`  Month ${m} failed: ${error.message}`);
      continue;
    }
    wsMap.set(m, ws.id);
  }
  console.log(`Created ${wsMap.size} workspaces\n`);

  // Upload Jan-Nov (11 months), skip December
  console.log(`Uploading Jan–Nov data...\n`);
  let totalRows = 0;
  let grandTotal = 0;

  for (let m = 0; m < 11; m++) {
    const month = m + 1;
    const fileName = `${YEAR}-${String(month).padStart(2, '0')}-${MONTH_NAMES[m]}.csv`;
    const filePath = path.join(DATA_DIR, fileName);
    if (!fs.existsSync(filePath)) { console.log(`  SKIP ${fileName}`); continue; }

    const wsId = wsMap.get(month);
    if (!wsId) continue;

    const csvText = fs.readFileSync(filePath, 'utf8');
    const rows = parseCsv(csvText);

    // Storage upload
    const storagePath = `${wsId}/${Date.now()}-${fileName}`;
    await supabase.storage.from('csv-uploads').upload(storagePath, csvText, { contentType: 'text/csv' });

    // Batch record
    const { data: batch, error: bErr } = await supabase
      .from('upload_batches')
      .insert({ workspace_id: wsId, file_name: fileName, row_count: rows.length, file_path: storagePath })
      .select('id')
      .single();
    if (bErr || !batch) { console.log(`  FAIL ${fileName}: ${bErr?.message}`); continue; }

    // Transactions
    const { error: tErr } = await supabase.from('transactions').insert(
      rows.map(r => ({
        workspace_id: wsId,
        batch_id: batch.id,
        vendor_name: r.vendor_name,
        amount: r.amount,
        transaction_date: r.transaction_date,
        description: r.description,
      }))
    );
    if (tErr) { console.log(`  FAIL ${fileName}: ${tErr.message}`); continue; }

    const total = rows.reduce((s, r) => s + r.amount, 0);
    await supabase.from('workspaces').update({ total_saved: total }).eq('id', wsId);

    totalRows += rows.length;
    grandTotal += total;
    console.log(`  OK  ${MONTH_NAMES[m]!.padEnd(10)} ${String(rows.length).padStart(3)} rows  $${Math.round(total).toLocaleString().padStart(7)}`);
  }

  console.log(`\n  Dec left empty for live demo!`);
  console.log(`  Total: ${totalRows} transactions, $${Math.round(grandTotal).toLocaleString()} spend\n`);

  // Run analytics refresh
  console.log(`Running analytics refresh...`);
  const token = auth.session?.access_token;
  if (token) {
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/refresh-analytics`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: '{}',
      });
      const result = await resp.json();
      console.log('Result:', result);
    } catch (e) {
      console.log('Edge function error:', e);
    }
  }

  // Show results
  const { data: summary } = await supabase.rpc('get_opportunity_summary', { p_user_id: userId });
  if (summary) {
    console.log(`\n══ Opportunity Summary ══`);
    console.log(`  Potential savings: $${Math.round(summary.potentialSavings).toLocaleString()}`);
    console.log(`  Secured savings:  $${Math.round(summary.securedSavings).toLocaleString()}`);
    console.log(`  Total opps:       ${summary.totalOpportunities}`);
    console.log(`    AI negotiate:   ${summary.aiNegotiationCount}`);
    console.log(`    Email cancel:   ${summary.emailCancellationCount}`);
    console.log(`    Manual review:  ${summary.manualReviewCount}`);
  }

  const { data: opps } = await supabase
    .from('opportunities')
    .select('vendor_name, type, annualized_spend, estimated_annual_savings, confidence, recurring_months')
    .eq('user_id', userId)
    .neq('status', 'dismissed')
    .order('estimated_annual_savings', { ascending: false });

  if (opps && opps.length > 0) {
    console.log(`\n══ Opportunities ══`);
    for (const o of opps) {
      const tag = o.type === 'ai_negotiation' ? 'NEGOTIATE' :
                  o.type === 'email_cancellation' ? 'CANCEL   ' : 'REVIEW   ';
      console.log(`  ${tag}  ${o.vendor_name.padEnd(28)} $${Math.round(o.annualized_spend).toLocaleString().padStart(7)}/yr  save $${Math.round(o.estimated_annual_savings).toLocaleString().padStart(7)}  (${o.recurring_months}mo, ${o.confidence}%)`);
    }
  }

  console.log(`\n══════════════════════════════════════════`);
  console.log(`  Demo ready!`);
  console.log(`  Login:    ${EMAIL}`);
  console.log(`  Year:     ${YEAR} — 11 months loaded, Dec empty`);
  console.log(`  Demo CSV: sample-data/2025-12-december.csv`);
  console.log(`══════════════════════════════════════════\n`);
}

main().catch(console.error);
