# LeanLedger
## Cursor AI Development Prompt Playbook

**Version 2.0 · 19 User Stories · 52 Prompts · March 2026**

---

## How to Use This Playbook

### Prompt Type Tags

> **Global stack context for every prompt:** Expo (React Native + Web), Supabase (PostgreSQL, Auth, Realtime, Storage), Node.js/Express backend, Anthropic API `claude-sonnet-4-20250514`, TypeScript throughout.

---

## EPIC 01 · Monthly Audit Workspace

### US-01.1 Create a new monthly workspace

**User Story:** As a business owner, I want to create a new monthly workspace (e.g. March 2026) so that all my uploaded financial data is organised by period.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```sql
Create a Supabase SQL migration file for the "workspaces" table.
The table must have these exact columns:
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year    text NOT NULL,   -- format "YYYY-MM" e.g. "2026-03"
  total_saved   numeric(12,2) NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()

Add a UNIQUE constraint on (user_id, month_year) so a user cannot
create two workspaces for the same month.

Enable Row Level Security:
  ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "workspace_owner_only" ON workspaces
    FOR ALL USING (user_id = auth.uid());

Add an index: CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);
```

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
Create a React Native (Expo) component <WorkspaceCreator />.

UI requirements:
  - A month/year picker (use @react-native-community/datetimepicker
    on native; a <select> on Expo Web).
  - A "Create Workspace" primary button.
  - An inline error message if the workspace already exists for that month.

Logic requirements:
  - On submit, call: supabase.from('workspaces').insert({
      user_id: session.user.id,
      month_year: format(selectedDate, 'yyyy-MM')  // date-fns
    }).select().single()
  - On success: optimistically prepend the new workspace to the
    workspaces array in WorkspaceContext and navigate to it.
  - On error code "23505" (unique violation): show inline error
    "A workspace for this month already exists."

TypeScript: define a Workspace type matching the DB schema.
```

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
Build a <WorkspaceSidebar /> component for the Expo Web layout.

Data fetching:
  - On mount, fetch: supabase.from('workspaces')
      .select('*').order('month_year', { ascending: false })
  - Store results in local state. Show a skeleton loader while fetching.

Rendering each workspace row:
  - Display the month name (e.g. "March 2026") formatted with date-fns.
  - Show total_saved formatted as a currency string (e.g. "$850.00").
  - If total_saved === 0, show a grey "$0 recovered" placeholder.
  - Highlight the active workspace row with a left blue border accent.
  - On click, call setActiveWorkspaceId(workspace.id) from WorkspaceContext.

Add a "+ New Month" button at the top that opens <WorkspaceCreator />.
```

---

### US-01.2 Total Waste Found recalculates on every new upload

**User Story:** As a business owner, I want the 'Total Waste Found' figure to automatically recalculate each time I upload a new file so that my audit stays current without manual refresh.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```sql
Write a Supabase PostgreSQL function and trigger.

Function: recalculate_workspace_total(ws_id uuid)
  - SELECT COALESCE(SUM(amount), 0) INTO v_total
    FROM anomalies
    WHERE workspace_id = ws_id AND status = 'open';
  - UPDATE workspaces SET total_saved = v_total WHERE id = ws_id;
  - Return void.

Trigger: after_anomaly_change
  - Fires AFTER INSERT OR UPDATE OR DELETE on the anomalies table.
  - FOR EACH ROW.
  - On INSERT or UPDATE: call recalculate_workspace_total(NEW.workspace_id).
  - On DELETE: call recalculate_workspace_total(OLD.workspace_id).
  - Also handle UPDATE where workspace_id changes: recalculate both
    OLD.workspace_id and NEW.workspace_id.
```

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
In <WorkspaceDashboard />, set up a Supabase Realtime subscription
to watch for changes to the active workspace's total_saved.

Subscription setup (run in a useEffect with activeWorkspaceId as dep):
  const channel = supabase.channel('workspace-total-' + activeWorkspaceId)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'workspaces',
      filter: 'id=eq.' + activeWorkspaceId
    }, (payload) => {
      setTotalSaved(payload.new.total_saved);
    })
    .subscribe();
  return () => supabase.removeChannel(channel);

Animate the counter using react-native-reanimated's useSharedValue
and withTiming so the number smoothly counts up to the new total.
Display the formatted value as a large hero number (e.g. "$850.00").
```

---

### US-01.3 Switch between past monthly workspaces in the sidebar

**User Story:** As a business owner, I want to switch between past monthly workspaces in the sidebar so that I can review historical audit results at any time.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```typescript
Create a React context and provider for global workspace state.

Context shape:
  interface WorkspaceContextType {
    workspaces: Workspace[];
    activeWorkspaceId: string | null;
    activeWorkspace: Workspace | null;
    setActiveWorkspaceId: (id: string) => void;
    refreshWorkspaces: () => Promise<void>;
  }

Provider behaviour:
  - On mount: load lastWorkspaceId from AsyncStorage.
  - Fetch all workspaces for the authenticated user from Supabase.
  - Set activeWorkspaceId to lastWorkspaceId if it exists in the fetched list,
    otherwise default to the most recent workspace.
  - When setActiveWorkspaceId is called: update state AND write the new id
    to AsyncStorage with key "leanledger_active_workspace".
  - Expose refreshWorkspaces() so child components can trigger a re-fetch
    after a new workspace is created.
```

---

### US-01.4 Historical ROI Tracker with resolved savings badges

**User Story:** As a business owner, I want to see a Historical ROI Tracker showing resolved savings per month so that I can gamify and celebrate cost-reduction wins.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```sql
Add a status column to the anomalies table:

  ALTER TABLE anomalies
  ADD COLUMN status text NOT NULL DEFAULT 'open'
  CHECK (status IN ('open', 'resolved', 'pending_approval', 'dismissed'));

Add an index to support filtered queries by workspace + status:
  CREATE INDEX idx_anomalies_workspace_status
    ON anomalies(workspace_id, status);

Backfill any existing rows:
  UPDATE anomalies SET status = 'open' WHERE status IS NULL;
```

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
Build a <ROIBadge workspaceId={string} /> component.

Data: fetch the resolved total with:
  supabase.from('anomalies')
    .select('amount.sum()')
    .eq('workspace_id', workspaceId)
    .eq('status', 'resolved')
    .single()

Rendering logic:
  - If resolvedTotal > 0: green pill badge "✓ Resolved: $X,XXX Saved".
  - If resolvedTotal === 0 and open anomalies exist: amber "In Progress" badge.
  - If no anomalies at all: grey "No Data" badge.

Render this badge beneath each workspace row in <WorkspaceSidebar />.
Cache the result in local state; re-fetch when the workspace's
total_saved changes (listen to WorkspaceContext).
```

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
Add a "Mark Resolved" button to the <AnomalyCard /> component.

On click:
  1. Optimistically update the local anomaly's status to 'resolved'
     in the anomalies array in state (instant UI feedback).
  2. Call: await supabase.from('anomalies')
       .update({ status: 'resolved' }).eq('id', anomaly.id)
  3. On error: rollback the optimistic update and show a toast error.

After resolution:
  - Move the card into a collapsed "Resolved" accordion section
    at the bottom of the anomaly list.
  - The Postgres trigger fires automatically, updating workspaces.total_saved.
  - The Realtime subscription in P-01.2.B picks up the workspace UPDATE
    and animates the counter down by the resolved amount.

Use a confirmation dialog before resolving to prevent accidental clicks.
```

---

## EPIC 02 · Digital Data Ingestion & Sanitization

### US-02.1 Drag and drop CSV / Excel files onto the web dashboard

**User Story:** As a finance manager, I want to drag and drop CSV and Excel files onto the web dashboard so that I can ingest bank and accounting exports without manual data entry.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
Build a <FileDropzone workspaceId={string} /> component for Expo Web
using the react-dropzone library.

Accepted file types: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-
  officedocument.spreadsheetml.sheet': ['.xlsx'] }

Visual states:
  - Idle: dashed border, "Drag CSV or Excel file here" with a cloud icon.
  - Drag active: solid blue border, blue background tint.
  - Uploading: progress bar with percentage, file name pill.
  - Success: green checkmark, "X rows imported, Y rows rejected".
  - Error (wrong type): red border, "Only .csv and .xlsx files accepted".

On drop, call uploadFile(file, workspaceId) (implement in P-02.1.B).
Disable the dropzone while an upload is in progress.
```

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```typescript
Write an async uploadFile(file: File, workspaceId: string) function.

Step 1 — Upload to Supabase Storage:
  const path = `${session.user.id}/${workspaceId}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('financial-uploads')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error('Storage upload failed: ' + error.message);

Step 2 — Trigger backend processing:
  const res = await fetch('/api/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',
               'Authorization': 'Bearer ' + session.access_token },
    body: JSON.stringify({ storagePath: path, workspaceId })
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error);
  return result; // { cleanCount, rejectedCount, rejectionReasons }
```

---

### US-02.2 Uploaded files are automatically sanitized before processing

**User Story:** As a finance manager, I want uploaded files to be automatically sanitized so that dirty exports do not corrupt my audit data.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```typescript
Write a sanitizeFile(buffer: Buffer, mimeType: string) function.

Step 1 — Parse:
  - If mimeType includes 'csv': parse with papaparse.
    { header: true, skipEmptyLines: true, dynamicTyping: true }
  - If mimeType includes 'spreadsheetml': use SheetJS (xlsx).
    Read first sheet, convert to CSV, then parse with papaparse.

Step 2 — Validate and clean each row:
  - Required fields: a date column, a vendor/description column, an amount column.
  - Auto-detect column names with case-insensitive regex
    (e.g. /amount|debit|credit|charge/i).
  - Reject row if: amount is NaN after parseFloat(stripCurrency(val)).
  - Reject row if: date is Invalid Date after new Date(val).
  - Normalise vendor_name: .trim().replace(/s+/g,' ').toUpperCase().
  - Normalise amount: Math.abs(parseFloat(...)) to always be positive.

Return: { cleanRows: CleanTransaction[], rejectedRows: RejectedRow[],
          summary: { totalRows, cleanCount, rejectedCount, rejectionReasons[] } }
```

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
Create a POST /api/ingest endpoint (Express or Next.js API route).

Authentication: verify the Supabase JWT from the Authorization header.
  Use supabaseAdmin.auth.getUser(token) to extract user_id.

Steps:
  1. Download file from Supabase Storage using the storagePath from body.
  2. Call sanitizeFile(buffer, mimeType) from P-02.2.A.
  3. Bulk insert cleanRows into "transactions" table in batches of 500:
     Each row: { workspace_id, vendor_name, amount, transaction_date,
                 category: 'uncategorised', source_file: storagePath }
     Use supabaseAdmin (service role) to bypass RLS on insert.
  4. Insert a record into "file_uploads":
     { workspace_id, user_id, storage_path, original_filename,
       row_count: cleanCount, rejected_count: rejectedCount }
  5. Trigger detect_zombie_subscriptions(workspaceId) (see P-03.1.A).
  6. Trigger detectPriceCreep(workspaceId) (see P-04.2.A).
  7. Return { cleanCount, rejectedCount, rejectionReasons }.
```

---

### US-02.3 Transactions inserted into Supabase linked to active workspace

**User Story:** As a finance manager, I want uploaded transactions inserted into Supabase and linked to the active workspace so that data from different periods is correctly partitioned.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```sql
Create the "transactions" table:
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  vendor_name      text NOT NULL,
  amount           numeric(12,2) NOT NULL,
  transaction_date date NOT NULL,
  category         text DEFAULT 'uncategorised',
  source_file      text,
  created_at       timestamptz NOT NULL DEFAULT now()

Create the "file_uploads" table:
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES auth.users(id),
  storage_path     text NOT NULL,
  original_filename text,
  row_count        int DEFAULT 0,
  rejected_count   int DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()

Enable RLS on both tables. Policy for transactions:
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE user_id = auth.uid()
  ));

Indexes: idx_transactions_workspace_id, idx_transactions_vendor_date
  (workspace_id, vendor_name, transaction_date).
```

---

## EPIC 03 · Zombie Subscription Slayer

### US-03.1 Automatically detect duplicate SaaS subscriptions

**User Story:** As a CFO, I want the system to automatically detect duplicate SaaS subscriptions across my uploaded spreadsheets so that I can eliminate redundant software spend.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```sql
Create the "anomalies" table:
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type             text NOT NULL
                   CHECK (type IN ('zombie_subscription','price_creep',
                                   'policy_violation','uncategorised')),
  amount           numeric(12,2) NOT NULL,
  status           text NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','resolved',
                                     'pending_approval','dismissed')),
  metadata         jsonb DEFAULT '{}',
  source           text DEFAULT 'csv'
                   CHECK (source IN ('csv','receipt_scan')),
  created_at       timestamptz NOT NULL DEFAULT now()

Enable RLS (same pattern as transactions — join via workspaces.user_id).
Indexes: (workspace_id, status), (workspace_id, type).
```

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```typescript
Write a detectZombieSubscriptions(workspaceId: string) async function.

Step 1 — Find duplicates via Supabase RPC:
  Create a Supabase PostgreSQL function find_zombie_subscriptions(ws_id uuid):
    SELECT vendor_name,
           DATE_TRUNC('month', transaction_date) AS charge_month,
           COUNT(*)                              AS charge_count,
           SUM(amount)                           AS total_charged,
           ARRAY_AGG(id)                         AS transaction_ids,
           ARRAY_AGG(amount ORDER BY transaction_date) AS charge_amounts
    FROM transactions
    WHERE workspace_id = ws_id
    GROUP BY vendor_name, DATE_TRUNC('month', transaction_date)
    HAVING COUNT(*) > 1;

Step 2 — For each result row, upsert into anomalies:
  { type: 'zombie_subscription',
    workspace_id: workspaceId,
    amount: total_charged - MIN(charge_amounts),  // waste = duplicates only
    metadata: { vendor_name, charge_month, charge_count,
                total_charged, transaction_ids, charge_amounts } }
  Use ON CONFLICT DO NOTHING to avoid duplicate anomaly rows on re-runs.
```

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
Build a <ZombieSubscriptionCard anomaly={Anomaly} /> component.

Extract from anomaly.metadata:
  { vendor_name, charge_month, charge_count, total_charged,
    transaction_ids, charge_amounts }

Display:
  - Vendor logo: <Image src={`https://logo.clearbit.com/${vendorDomain}`}
    with a text fallback showing the first letter of vendor_name.
  - Vendor name and charge month (e.g. "Slack — March 2026").
  - "{charge_count} duplicate charges totalling $X" in bold red.
  - A list of individual charge dates and amounts from charge_amounts.
  - A red "Duplicate" badge in the top-right corner.

Action buttons (bottom row):
  - "Terminate" (red, primary) → calls generateCancellationEmail() (P-03.2.A).
  - "Mark Resolved" (grey, secondary) → calls resolveAnomaly() (P-01.4.C).
  - "Dismiss" (text link) → sets status = 'dismissed'.
```

---

### US-03.2 Terminate button generates a cancellation email

**User Story:** As a CFO, I want each zombie subscription to have a Terminate button that instantly drafts a legally sound cancellation email so that I can cancel without leaving the dashboard.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
Create POST /api/generate-cancellation (authenticated endpoint).

Request body: { vendorName, totalCharged, chargeDates, companyName }

Call the Anthropic API with streaming enabled:
  model: "claude-sonnet-4-20250514"
  max_tokens: 600
  messages: [{
    role: "user",
    content: `You are a professional business lawyer. Write a firm but
    polite SaaS subscription cancellation email to ${vendorName}.
    We were charged ${totalCharged} across ${chargeDates.join(', ')}.
    The company name is ${companyName}.
    Format: first line = Subject: ..., then blank line, then body.
    Be concise (under 120 words). Do not use placeholders.`
  }]

Stream the response back to the client using Server-Sent Events.
On the frontend: display the streamed text in a modal <EmailDraftEditor />
where the user can edit before copying to clipboard.
```

---

### US-03.3 Mark zombie subscription as Resolved after cancelling

**User Story:** As a CFO, I want to mark a zombie subscription as Resolved after cancelling so that it no longer clutters my active waste list.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
Build a <ResolvedSection workspaceId={string} type={AnomalyType} /> component.

Data: fetch anomalies WHERE workspace_id = workspaceId
  AND status = 'resolved' AND type = type
  ORDER BY created_at DESC

Render as a collapsible accordion:
  Header: "Resolved ({count}) -- {totalResolved} Saved" in green.
  Collapsed by default; user clicks to expand.
  Body: list of resolved anomaly cards (lighter/greyed-out styling).
  Each card shows: vendor, amount saved, resolution date.
  No action buttons on resolved cards (read-only view).

Place this component below the active anomaly list in the dashboard
for each anomaly type section.
```

---

## EPIC 04 · Statistical Price-Creep Detection

### US-04.1 Build a rolling 6-month price history per vendor

**User Story:** As a finance manager, I want the system to build a rolling 6-month price history per vendor so that rate-creep analysis has sufficient baseline data.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```sql
Create a Supabase SQL view "vendor_price_history":

  CREATE OR REPLACE VIEW vendor_price_history AS
  SELECT
    workspace_id,
    vendor_name,
    DATE_TRUNC('month', transaction_date)  AS charge_month,
    COUNT(*)                               AS charge_count,
    AVG(amount)                            AS avg_charge,
    MIN(amount)                            AS min_charge,
    MAX(amount)                            AS max_charge,
    STDDEV(amount)                         AS stddev_charge
  FROM transactions
  WHERE transaction_date >= NOW() - INTERVAL '6 months'
  GROUP BY workspace_id, vendor_name,
           DATE_TRUNC('month', transaction_date)
  ORDER BY vendor_name, charge_month;

Also create an RPC function get_vendor_history(ws_id uuid) that returns
all rows from this view for a specific workspace_id.
Enable RLS on the view using the same policy as transactions.
```

---

### US-04.2 Flag vendors outside the statistical confidence interval

**User Story:** As a finance manager, I want vendors whose latest charge exceeds the statistical confidence interval to be automatically flagged so I can investigate unexplained price increases.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```typescript
Write a detectPriceCreep(workspaceId: string, sigmaThreshold = 2) function.

Step 1 — Fetch vendor history:
  const { data } = await supabase.rpc('get_vendor_history',
    { ws_id: workspaceId });
  Group rows by vendor_name into a Map<string, MonthlyRecord[]>.

Step 2 — For each vendor with >= 3 months of history:
  a. Take all months EXCEPT the most recent as the baseline.
  b. Calculate baseline mean (μ): average of baseline avg_charge values.
  c. Calculate baseline std dev (σ): STDEV of baseline avg_charge values.
  d. Get latestCharge: the most recent month's avg_charge.
  e. If latestCharge > μ + (sigmaThreshold * σ):
     Insert anomaly: {
       type: 'price_creep', workspace_id: workspaceId,
       amount: latestCharge - μ,  // the excess above baseline
       metadata: { vendor_name, mu: μ, sigma: σ, latestCharge,
                   deviationPct: ((latestCharge - μ) / μ * 100).toFixed(1),
                   history: all monthly records for sparkline }
     }
     Use upsert with a unique constraint on (workspace_id, type, metadata->>'vendor_name').
```

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
Build a <PriceCreepCard anomaly={Anomaly} /> component.

Extract from anomaly.metadata:
  { vendor_name, mu, sigma, latestCharge, deviationPct, history }

Display:
  - Vendor name and logo (Clearbit, same as ZombieSubscriptionCard).
  - "Latest charge: $X" in large font.
  - "Expected range: $Y – $Z" (μ-σ to μ+σ) in smaller grey text.
  - Deviation badge: "+{deviationPct}% above normal" in red bold.
  - A mini sparkline (last 6 months) using Victory Native Sparkline.
    Highlight the last data point red if it exceeds the upper band.

Action buttons:
  - "View Trend" → opens <VendorTrendChart /> modal (P-04.3.A).
  - "Mark Resolved" → same pattern as P-01.4.C.
```

---

### US-04.3 Price-creep trend chart per vendor

**User Story:** As a CFO, I want to see a price-creep trend chart per vendor so that I can visually confirm the rate escalation before acting.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
Build a <VendorTrendChart metadata={PriceCreepMetadata} /> component
using Recharts (Expo Web) or Victory Native (mobile).

Data preparation from metadata.history:
  - Map each month record to { month: 'Mar', charge: avg_charge,
    upperBand: μ + 2σ, lowerBand: Math.max(0, μ - 2σ) }

Chart composition (Recharts):
  <ComposedChart data={chartData}>
    <Area dataKey="upperBand" fill="#FEE2E2" stroke="none" />   // confidence band
    <Area dataKey="lowerBand" fill="#FFFFFF" stroke="none" />   // mask lower
    <Line dataKey="charge" stroke="#1B4FD8" strokeWidth={2}
      dot={(props) => props.value > upperBand ? <RedDot /> : <Dot />} />
    <ReferenceLine y={mu} stroke="#6B7280" strokeDasharray="4 4"
      label="Expected avg" />
    <XAxis dataKey="month" /> <YAxis tickFormatter={dollarFormat} />
    <Tooltip formatter={dollarFormat} />
  </ComposedChart>

Render inside a modal/bottom sheet triggered by "View Trend" button.
```

---

## EPIC 05 · Mobile Receipt Scanning & AI Policy Enforcement

### US-05.1 Snap a physical receipt photo via the mobile app

**User Story:** As an employee, I want to snap a photo of a physical receipt using the mobile app so that I can submit expenses without manual data entry.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
Create a <ReceiptScanner /> screen using expo-camera.

Permissions: request with useCameraPermissions() hook on mount.
If denied, show an instructions screen to enable in Settings.

UI:
  - Full-screen CameraView with type="back".
  - Overlay: a semi-transparent View with a transparent
    receipt-shaped cutout (aspect ratio ~1:1.4) using border styling.
  - Label: "Align receipt within the frame" centred below the cutout.
  - A circular capture button at the bottom.

On capture:
  1. Call cameraRef.current.takePictureAsync({ quality: 0.8 }).
  2. Compress with ImageManipulator.manipulateAsync(uri,[],{compress:0.8}).
  3. Show a spinner overlay: "Uploading...".
  4. Upload to Supabase Storage: receipts/{userId}/{timestamp}.jpg
  5. Call /api/extract-receipt with the storage path (P-05.2.A).
```

---

### US-05.2 AI extracts merchant, date, and line items from receipt photo

**User Story:** As a finance manager, I want AI to automatically extract merchant name, date, and line-item amounts from a receipt photo so that data entry errors are eliminated.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
Create POST /api/extract-receipt (authenticated endpoint).
Body: { storagePath: string, workspaceId: string }

Step 1 — Download image from Supabase Storage and convert to base64.

Step 2 — Call Anthropic API:
  model: "claude-sonnet-4-20250514"
  messages: [{ role: "user", content: [
    { type: "image", source: { type: "base64",
        media_type: "image/jpeg", data: base64Image } },
    { type: "text", text: `Extract all data from this receipt.
      Return ONLY valid JSON — no markdown, no explanation:
      { "merchant": string, "date": "YYYY-MM-DD",
        "line_items": [{"name": string, "amount": number}],
        "subtotal": number, "tax": number, "total": number,
        "confidence": number (0–1) }
      Set any unreadable field to null.` }
  ]}]

Step 3 — Parse response JSON. Strip markdown fences if present.
If confidence < 0.65: return { error: 'low_confidence' } with HTTP 422.
Otherwise return the structured receipt data.
```

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
Create a <ReceiptPreviewScreen /> that displays the extracted receipt data
from P-05.2.A before saving.

If API returns { error: 'low_confidence' }:
  - Show a yellow warning: "Receipt unclear — please retake."
  - Provide a "Retake" button that navigates back to <ReceiptScanner />.

If extraction succeeds, display:
  - Merchant name (editable TextInput).
  - Date (editable date picker).
  - Line items as a scrollable list (each item name + amount editable).
  - Subtotal, Tax, Total (read-only, calculated from line items).
  - The receipt thumbnail in the top-right corner.

Bottom actions:
  - "Submit Expense" (primary) → calls /api/enforce-policy (P-05.3.A).
  - "Discard" → deletes the Supabase Storage image and goes to Home.
```

---

### US-05.3 AI enforces company expense policy on each receipt

**User Story:** As a finance manager, I want the AI to check each receipt against company expense policy so that personal luxuries disguised as business costs are caught automatically.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
Create POST /api/enforce-policy (authenticated endpoint).
Body: { receiptData: ExtractedReceipt, workspaceId: string }

Step 1 — Fetch policy rules from Supabase:
  supabase.from('policy_rules').select('*').eq('user_id', userId)
  Falls back to default rules if none configured:
    [{ category: 'gaming', allowed: false },
     { category: 'alcohol', max_amount: 30 },
     { category: 'personal_care', allowed: false }]

Step 2 — Call Anthropic API:
  Prompt: "You are a strict company expense auditor.
  Receipt data: ${JSON.stringify(receiptData)}
  Company policy rules: ${JSON.stringify(policyRules)}
  Identify ALL line items that violate policy. Return ONLY JSON:
  { compliant: boolean,
    violations: [{ item: string, amount: number, reason: string,
                   policy_rule: string }] }"

Step 3 — If violations exist:
  Insert into anomalies: { type: 'policy_violation', source: 'receipt_scan',
    amount: SUM(violations.amount), workspace_id,
    metadata: { merchant, receipt_date, violations, receipt_image_path } }

Return { compliant, violations } to the mobile client.
```

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
Create a <PolicyViolationScreen violations={Violation[]} /> screen.

Styling: full-screen red background (#DC2626) with white text.

Header section:
  - Large ⚠ warning icon centred at top.
  - "Policy Violation Detected" in large bold white text.
  - "{violations.length} item(s) flagged" subtitle.

Violations list (ScrollView):
  - White card per violation showing:
      Item name, amount in red bold, reason text, policy rule breached.
  - Receipt thumbnail in the top-right of the first card.

Bottom action bar (white background):
  - "Submit for Manager Approval" (amber button):
      Creates a transaction with status='pending_approval', then navigates Home.
  - "Discard Receipt" (white outline button):
      Deletes Storage image, returns to <ReceiptScanner />.
```

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```sql
Create the "policy_rules" table:
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category     text NOT NULL,
  allowed      boolean DEFAULT true,
  max_amount   numeric(10,2),  -- null = no limit
  description  text,
  created_at   timestamptz NOT NULL DEFAULT now()

Enable RLS: user_id = auth.uid().

Seed default rules via a Supabase Edge Function or migration:
  { category:'gaming',       allowed:false }
  { category:'alcohol',      allowed:true, max_amount:30 }
  { category:'personal_care',allowed:false }
  { category:'entertainment',allowed:true, max_amount:100 }
  { category:'travel',       allowed:true }
  { category:'meals',        allowed:true, max_amount:50 }
```

---

### US-05.4 Receipt violations appear on the web dashboard in real time

**User Story:** As a business owner, I want receipt violations to appear on the web dashboard via Supabase Realtime so that I have a unified view of all waste regardless of source.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```typescript
Create a custom hook useRealtimeAnomalies(workspaceId: string).

Initial fetch on mount:
  const { data } = await supabase.from('anomalies')
    .select('*').eq('workspace_id', workspaceId)
    .eq('status', 'open').order('created_at', { ascending: false });
  setAnomalies(data ?? []);

Realtime subscription (also in useEffect):
  supabase.channel('anomalies:' + workspaceId)
    .on('postgres_changes', {
       event: 'INSERT', schema: 'public', table: 'anomalies',
       filter: 'workspace_id=eq.' + workspaceId
    }, (payload) => {
       setAnomalies(prev => [payload.new as Anomaly, ...prev]);
       showToast(`New ${payload.new.type} alert: ${payload.new.metadata?.vendor_name}`);
    })
    .on('postgres_changes', { event: 'UPDATE', ... },
       (payload) => updateAnomalyInState(payload.new))
    .subscribe();
  return () => supabase.removeChannel(channel);

Return: { anomalies, loading, error }
```

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
Build a <PolicyViolationCard anomaly={Anomaly} /> component
for display in the web dashboard anomaly feed.

Extract from anomaly.metadata:
  { merchant, receipt_date, violations, receipt_image_path }

Display:
  - Orange "Receipt Scan" source badge (top-right).
  - Merchant name and date.
  - Receipt thumbnail: generate a signed URL with
    supabase.storage.from('financial-uploads')
      .createSignedUrl(receipt_image_path, 3600)
    Display as a small 80x80 image (click to enlarge in a lightbox).
  - List of violations: item name, amount, reason.
  - Total violation amount in red bold.

Actions: "Approve", "Reject", "Mark Resolved" buttons.
"Approve" sets status='resolved'; "Reject" sets status='dismissed'.
```

---

## EPIC 06 · Infrastructure, Auth & Database (Supabase)

### US-06.1 Full Supabase schema with all tables and RLS

**User Story:** As a developer, I want a complete Supabase PostgreSQL schema with Workspaces, Transactions, Anomalies, and related tables so that all product data is relational, secure, and tenant-isolated.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```bash
Create a shell script run_migrations.sh that applies all migration files
to a target Supabase project in this order:

  001_create_workspaces.sql
  002_transactions_and_uploads.sql
  003_anomalies.sql
  004_recalculation_trigger.sql
  005_anomaly_status.sql
  006_vendor_price_history_view.sql
  007_policy_rules.sql
  008_performance_indexes.sql

Usage: ./run_migrations.sh <SUPABASE_DB_URL>
Apply via: psql $SUPABASE_DB_URL -f <file>

Also create a reset_db.sh that drops all tables in reverse order
for clean test environment resets (development only, add a guard
that refuses to run if NODE_ENV=production).
```

---

### US-06.2 Supabase Auth with email/password and Google OAuth

**User Story:** As a business owner, I want to sign up and log in using Supabase Auth so that my sensitive financial data is protected without the team building custom auth.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```typescript
Create the Supabase client singleton for the Expo app.

Install: npx expo install @supabase/supabase-js @react-native-async-storage/async-storage

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,  // required for Expo native
    }
  }
);

Also create supabaseAdmin (service role) for the Node.js backend:
  uses SUPABASE_SERVICE_ROLE_KEY — never expose to client.
```

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```
Build a <AuthScreen /> with Sign In and Sign Up tabs.

Email/Password Sign Up:
  supabase.auth.signUp({ email, password })
  Show "Check your email to confirm your account" on success.
  Validation: email format, password min 8 chars.

Email/Password Sign In:
  supabase.auth.signInWithPassword({ email, password })
  Show inline error for invalid credentials.

Google OAuth (Expo):
  import * as WebBrowser from 'expo-web-browser';
  WebBrowser.maybeCompleteAuthSession();
  supabase.auth.signInWithOAuth({ provider: 'google',
    options: { redirectTo: 'leanledger://auth-callback' } })

Session listener (app root):
  supabase.auth.onAuthStateChange((event, session) => {
    setSession(session);
    if (!session) navigate('Auth');
    else navigate('Dashboard');
  });
```

---

### US-06.3 Supabase Realtime on Anomalies for cross-device live updates

**User Story:** As a developer, I want Supabase Realtime subscriptions on the Anomalies table so that the web dashboard updates instantly when a mobile receipt scan or CSV upload produces a violation.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```sql
Enable Supabase Realtime on the tables that require live updates:

-- Enable full row updates (needed for UPDATE events to carry payload)
ALTER TABLE anomalies   REPLICA IDENTITY FULL;
ALTER TABLE workspaces  REPLICA IDENTITY FULL;

-- Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE anomalies;
ALTER PUBLICATION supabase_realtime ADD TABLE workspaces;

Verify in Supabase Dashboard: Database → Replication → supabase_realtime
should list both tables.

Test in the Supabase SQL editor:
  INSERT INTO anomalies (workspace_id, type, amount, metadata)
  VALUES ('<test_id>', 'zombie_subscription', 49.99, '{}');
  -- Confirm the Realtime inspector shows the INSERT event.
```

---

### US-06.4 Raw CSV files stored in Supabase Storage with audit trail

**User Story:** As a developer, I want CSV file uploads stored in Supabase Storage so that raw financial files are persisted, auditable, and linked to their workspace.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```sql
Set up Supabase Storage via the dashboard and SQL.

Create a private bucket named "financial-uploads":
  - Public: false
  - File size limit: 50MB
  - Allowed MIME types: text/csv, application/vnd.openxmlformats-
      officedocument.spreadsheetml.sheet, image/jpeg, image/png

Storage RLS policies (SQL):
  -- Users can only upload to their own folder
  CREATE POLICY "user_upload" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'financial-uploads' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  -- Users can only read their own files
  CREATE POLICY "user_read" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'financial-uploads' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

For download links: use createSignedUrl(path, 3600) — never expose
the service role key or use public bucket URLs for financial data.
```

---

### US-06.5 Indexed queries stay under 200ms at 100k rows

**User Story:** As a developer, I want database queries for monthly workspace data to use Supabase indexed lookups so that performance stays optimal as transaction volume grows.

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```sql
Create a performance indexes migration:

-- Workspace lookup (used on every dashboard load)
CREATE INDEX idx_workspaces_user_id
  ON workspaces(user_id);

-- Transaction filters (workspace + vendor + date for all analysis)
CREATE INDEX idx_transactions_workspace_id
  ON transactions(workspace_id);
CREATE INDEX idx_transactions_vendor_date
  ON transactions(workspace_id, vendor_name, transaction_date DESC);

-- Anomaly dashboard queries (workspace + status + type)
CREATE INDEX idx_anomalies_workspace_status
  ON anomalies(workspace_id, status);
CREATE INDEX idx_anomalies_workspace_type
  ON anomalies(workspace_id, type, status);

-- File upload history
CREATE INDEX idx_file_uploads_workspace
  ON file_uploads(workspace_id, created_at DESC);

Add to /docs/query-performance.md: the EXPLAIN ANALYZE output for
the 5 most critical queries, showing Index Scan (not Seq Scan).
```

---

#### CURSOR PROMPT — paste into Cmd+K / Ctrl+K

```sql
Create a Supabase SQL script to test query performance at scale.

Step 1 — Seed 100,000 transactions into a test workspace:
  INSERT INTO transactions (workspace_id, vendor_name, amount,
    transaction_date, category, source_file)
  SELECT
    '<test_workspace_id>',
    ('Vendor ' || (random()*100)::int::text),
    (random() * 500 + 10)::numeric(10,2),
    (NOW() - (random() * 180 || ' days')::interval)::date,
    'uncategorised', 'seed'
  FROM generate_series(1, 100000);

Step 2 — Run EXPLAIN ANALYZE on critical queries:
  a. SELECT * FROM anomalies WHERE workspace_id=X AND status='open'
  b. SELECT * FROM vendor_price_history WHERE workspace_id=X
  c. SELECT vendor_name, COUNT(*) FROM transactions
     WHERE workspace_id=X GROUP BY vendor_name, DATE_TRUNC('month',...)

Assert: all queries show "Index Scan" and execution time < 200ms.
Log results to /docs/query-performance.md.
```

---

*LeanLedger Cursor Prompt Playbook v2.0 · Confidential · March 2026*
