/**
 * Bulk-upload the 12 sample CSVs into Supabase.
 * Signs in as a user, creates workspaces for each month of 2025,
 * then uploads transactions with batch tracking.
 *
 * Usage:
 *   npx tsx scripts/upload-sample-data.ts <email> <password>
 *
 * Example:
 *   npx tsx scripts/upload-sample-data.ts user@example.com mypassword
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env');
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: npx tsx scripts/upload-sample-data.ts <email> <password>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  console.log(`Signing in as ${email}...`);
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
  if (authErr || !authData.user) {
    console.error('Auth failed:', authErr?.message ?? 'No user returned');
    process.exit(1);
  }
  const userId = authData.user.id;
  console.log(`Authenticated: ${userId}\n`);

  const { data: existingWs } = await supabase
    .from('workspaces')
    .select('id, month, year')
    .eq('user_id', userId)
    .eq('year', YEAR);

  const existingMap = new Map((existingWs ?? []).map((w: any) => [w.month, w.id]));

  let totalRows = 0;
  let totalBatches = 0;

  for (let m = 0; m < 12; m++) {
    const month = m + 1;
    const fileName = `${YEAR}-${String(month).padStart(2, '0')}-${MONTH_NAMES[m]}.csv`;
    const filePath = path.join(DATA_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      console.log(`  SKIP  ${fileName} (not found)`);
      continue;
    }

    const csvText = fs.readFileSync(filePath, 'utf8');
    const rows = parseCsv(csvText);

    let workspaceId = existingMap.get(month);
    if (!workspaceId) {
      const { data: ws, error } = await supabase
        .from('workspaces')
        .insert({ user_id: userId, month, year: YEAR, total_saved: 0 })
        .select('id')
        .single();
      if (error) {
        console.log(`  FAIL  ${fileName}: workspace error: ${error.message}`);
        continue;
      }
      workspaceId = ws.id;
    }

    // Upload raw CSV to storage
    const storagePath = `${workspaceId}/${Date.now()}-${fileName}`;
    const { error: storageErr } = await supabase.storage
      .from('csv-uploads')
      .upload(storagePath, csvText, { contentType: 'text/csv' });
    if (storageErr) {
      console.log(`  WARN  ${fileName}: storage upload failed (${storageErr.message}), continuing without file...`);
    }

    // Create batch record
    const { data: batch, error: batchErr } = await supabase
      .from('upload_batches')
      .insert({
        workspace_id: workspaceId,
        file_name: fileName,
        row_count: rows.length,
        file_path: storageErr ? null : storagePath,
      })
      .select('id')
      .single();

    if (batchErr || !batch) {
      console.log(`  FAIL  ${fileName}: batch error: ${batchErr?.message}`);
      continue;
    }

    // Insert transactions
    const { error: txnErr } = await supabase.from('transactions').insert(
      rows.map(r => ({
        workspace_id: workspaceId,
        batch_id: batch.id,
        vendor_name: r.vendor_name,
        amount: r.amount,
        transaction_date: r.transaction_date,
        description: r.description,
      }))
    );

    if (txnErr) {
      console.log(`  FAIL  ${fileName}: txn error: ${txnErr.message}`);
      continue;
    }

    // Update workspace total
    const total = rows.reduce((s, r) => s + r.amount, 0);
    await supabase.from('workspaces').update({ total_saved: total }).eq('id', workspaceId);

    totalRows += rows.length;
    totalBatches++;
    console.log(`  OK    ${MONTH_NAMES[m]!.padEnd(10)} ${String(rows.length).padStart(3)} rows  $${Math.round(total).toLocaleString().padStart(7)}`);
  }

  console.log(`\n${totalBatches} months uploaded, ${totalRows} total transactions`);

  // Trigger analytics refresh
  console.log('\nRunning analytics refresh...');
  const token = authData.session?.access_token;
  if (token) {
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/refresh-analytics`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      });
      const result = await resp.json();
      console.log('Refresh result:', result);
    } catch (e) {
      console.log('Refresh call failed:', e);
    }
  }

  // Show results
  const { data: summary } = await supabase.rpc('get_opportunity_summary', { p_user_id: userId });
  console.log('\n── Opportunity Summary ──');
  if (summary) {
    console.log(`  Secured savings:    $${summary.securedSavings?.toLocaleString() ?? 0}`);
    console.log(`  Potential savings:  $${summary.potentialSavings?.toLocaleString() ?? 0}`);
    console.log(`  Total opportunities: ${summary.totalOpportunities}`);
    console.log(`  Email cancellation: ${summary.emailCancellationCount}`);
    console.log(`  AI negotiation:     ${summary.aiNegotiationCount}`);
    console.log(`  Manual review:      ${summary.manualReviewCount}`);
  }

  const { data: opps } = await supabase
    .from('opportunities')
    .select('vendor_name, type, annualized_spend, estimated_annual_savings, confidence, recurring_months, explanation')
    .eq('user_id', userId)
    .neq('status', 'dismissed')
    .order('estimated_annual_savings', { ascending: false });

  if (opps && opps.length > 0) {
    console.log('\n── Classified Opportunities ──');
    for (const o of opps) {
      const tag = o.type === 'ai_negotiation' ? '🤖 NEGOTIATE' :
                  o.type === 'email_cancellation' ? '📧 CANCEL' : '🔍 REVIEW';
      console.log(`  ${tag}  ${o.vendor_name.padEnd(28)} $${Math.round(o.annualized_spend).toLocaleString().padStart(7)}/yr → save $${Math.round(o.estimated_annual_savings).toLocaleString().padStart(7)}  (${o.recurring_months}mo, ${o.confidence}%)`);
    }
  }

  console.log('\nDone! Open the app and switch to year 2025 to see the data.');
}

main().catch(console.error);
