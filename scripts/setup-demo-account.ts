/**
 * Creates a fresh demo account and uploads 11 months of sample data (Jan-Nov 2025).
 * Leaves December empty so you can upload it live during the presentation.
 *
 * Usage:
 *   npx tsx scripts/setup-demo-account.ts
 *
 * The script will:
 *   1. Create a new user: demo@alfredio.com / AlfredDemo2025!
 *   2. Create 12 workspaces (Jan-Dec 2025)
 *   3. Upload CSVs for Jan-Nov only
 *   4. Run analytics refresh to populate opportunities
 *   5. Print the classified opportunities
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env (needed to create users).
 * Get it from: Supabase Dashboard → Settings → API → service_role key
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!SUPABASE_URL) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL in .env');
  process.exit(1);
}
if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env');
  console.error('Get it from: Supabase Dashboard → Settings → API → service_role (secret)');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_EMAIL = 'demo@alfredio.com';
const DEMO_PASSWORD = 'AlfredDemo2025!';
const YEAR = 2025;
const UPLOAD_MONTHS = 11; // Jan-Nov, skip December
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
  // Step 1: Create or find user
  console.log(`\n── Step 1: Setting up demo account ──`);
  console.log(`Email:    ${DEMO_EMAIL}`);
  console.log(`Password: ${DEMO_PASSWORD}\n`);

  let userId: string;

  // Check if user already exists
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existing = existingUsers?.users?.find(u => u.email === DEMO_EMAIL);

  if (existing) {
    console.log(`User already exists (${existing.id}). Cleaning old data...`);
    userId = existing.id;

    // Delete old workspaces (cascades to transactions, upload_batches)
    await admin.from('workspaces').delete().eq('user_id', userId).eq('year', YEAR);
    // Delete old opportunities
    await admin.from('opportunities').delete().eq('user_id', userId);
    console.log('Old data cleared.\n');
  } else {
    const { data: newUser, error } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    if (error || !newUser.user) {
      console.error('Failed to create user:', error?.message);
      process.exit(1);
    }
    userId = newUser.user.id;
    console.log(`Created new user: ${userId}\n`);
  }

  // Step 2: Create all 12 workspaces
  console.log(`── Step 2: Creating workspaces for ${YEAR} ──`);
  const workspaceIds: Map<number, string> = new Map();

  for (let m = 1; m <= 12; m++) {
    const { data: ws, error } = await admin
      .from('workspaces')
      .insert({ user_id: userId, month: m, year: YEAR, total_saved: 0 })
      .select('id')
      .single();
    if (error) {
      console.log(`  FAIL  Month ${m}: ${error.message}`);
      continue;
    }
    workspaceIds.set(m, ws.id);
  }
  console.log(`Created ${workspaceIds.size} workspaces\n`);

  // Step 3: Upload Jan-Nov CSVs
  console.log(`── Step 3: Uploading ${UPLOAD_MONTHS} months of data ──`);
  let totalRows = 0;

  for (let m = 0; m < UPLOAD_MONTHS; m++) {
    const month = m + 1;
    const fileName = `${YEAR}-${String(month).padStart(2, '0')}-${MONTH_NAMES[m]}.csv`;
    const filePath = path.join(DATA_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      console.log(`  SKIP  ${fileName} (not found)`);
      continue;
    }

    const workspaceId = workspaceIds.get(month);
    if (!workspaceId) continue;

    const csvText = fs.readFileSync(filePath, 'utf8');
    const rows = parseCsv(csvText);

    // Upload CSV to storage
    const storagePath = `${workspaceId}/${Date.now()}-${fileName}`;
    await admin.storage.from('csv-uploads').upload(storagePath, csvText, { contentType: 'text/csv' });

    // Create batch
    const { data: batch, error: batchErr } = await admin
      .from('upload_batches')
      .insert({
        workspace_id: workspaceId,
        file_name: fileName,
        row_count: rows.length,
        file_path: storagePath,
      })
      .select('id')
      .single();

    if (batchErr || !batch) {
      console.log(`  FAIL  ${fileName}: ${batchErr?.message}`);
      continue;
    }

    // Insert transactions
    const { error: txnErr } = await admin.from('transactions').insert(
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
      console.log(`  FAIL  ${fileName}: ${txnErr.message}`);
      continue;
    }

    const total = rows.reduce((s, r) => s + r.amount, 0);
    await admin.from('workspaces').update({ total_saved: total }).eq('id', workspaceId);

    totalRows += rows.length;
    console.log(`  OK    ${MONTH_NAMES[m]!.padEnd(10)} ${String(rows.length).padStart(3)} rows  $${Math.round(total).toLocaleString().padStart(7)}`);
  }

  console.log(`\n  December left empty for live demo upload!`);
  console.log(`  Total: ${totalRows} transactions across ${UPLOAD_MONTHS} months\n`);

  // Step 4: Run analytics refresh
  console.log(`── Step 4: Running analytics refresh ──`);

  // Sign in as the user to get a valid token for the edge function
  const userClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: authData, error: authErr } = await userClient.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  if (authErr || !authData.session) {
    console.log('Could not sign in to trigger refresh. Run refresh manually from the app.');
  } else {
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/refresh-analytics`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      });
      const result = await resp.json();
      console.log(`Refresh complete:`, result);
    } catch (e) {
      console.log('Edge function call failed:', e);
    }
  }

  // Step 5: Show results
  console.log(`\n── Step 5: Results ──`);

  const { data: summary } = await admin.rpc('get_opportunity_summary', { p_user_id: userId });
  if (summary) {
    console.log(`\n  Potential savings:  $${Math.round(summary.potentialSavings).toLocaleString()}`);
    console.log(`  Secured savings:   $${Math.round(summary.securedSavings).toLocaleString()}`);
    console.log(`  Opportunities:     ${summary.totalOpportunities}`);
    console.log(`    Email cancel:    ${summary.emailCancellationCount}`);
    console.log(`    AI negotiate:    ${summary.aiNegotiationCount}`);
    console.log(`    Manual review:   ${summary.manualReviewCount}`);
  }

  const { data: opps } = await admin
    .from('opportunities')
    .select('vendor_name, type, annualized_spend, estimated_annual_savings, confidence, recurring_months, explanation')
    .eq('user_id', userId)
    .neq('status', 'dismissed')
    .order('estimated_annual_savings', { ascending: false });

  if (opps && opps.length > 0) {
    console.log(`\n  Classified opportunities:`);
    for (const o of opps) {
      const icon = o.type === 'ai_negotiation' ? 'NEGOTIATE' :
                   o.type === 'email_cancellation' ? 'CANCEL   ' : 'REVIEW   ';
      console.log(`    ${icon}  ${o.vendor_name.padEnd(28)} $${Math.round(o.annualized_spend).toLocaleString().padStart(7)}/yr  save $${Math.round(o.estimated_annual_savings).toLocaleString().padStart(7)}  (${o.recurring_months}mo, ${o.confidence}%)`);
    }
  }

  console.log(`\n══════════════════════════════════════════`);
  console.log(`  Demo account ready!`);
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Year:     ${YEAR} (Jan-Nov uploaded, Dec empty)`);
  console.log(`  Demo CSV: sample-data/2025-12-december.csv`);
  console.log(`══════════════════════════════════════════\n`);
}

main().catch(console.error);
