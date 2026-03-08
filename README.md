# Alfred : Financial Intelligence for SMEs

Alfred is a financial analytics tool built for small and medium-sized businesses. It helps you spot wasteful spending, track subscriptions, and negotiate better deals with vendors, all from one place.

Built with React Native and Expo, Alfred runs on web, iOS, and Android from a single codebase.

---

## What Alfred Does

Most accounting tools just record what you've spent. Alfred helps you do something about it. It surfaces hidden waste, catches subscriptions you forgot about, and gives you AI-powered tools to push back on vendor pricing, without needing a finance team to do it.

---

## Features

### Workspaces
Organise your finances by month and year. Create workspaces, jump between them, or pull up an overview across all months at once.

### CSV Upload and Analysis
Drop in a bank or card statement CSV and Alfred handles the rest. It parses dates, vendors, and amounts automatically, then gives you a summary of totals, unique vendors, and anything that looks off.

### Financial Waste Detection
Alfred keeps an eye out for the stuff that's easy to miss. Duplicate charges, vendors quietly creeping up their prices month over month, and recurring patterns that might not be pulling their weight anymore.

### Zombie Subscription Identification
If a vendor keeps showing up on your statements but you're not sure why, Alfred flags it. It builds out a list of candidates worth reviewing for cancellation so nothing slips through the cracks.

### Spending Analytics
Get a clear picture of where your money is going with visual breakdowns by category and vendor. Categories cover Cloud, CRM, Communications, Design, Support, Dev Tools, Productivity, Finance, and Marketing.

### Vendor Analytics
See totals, transaction counts, and averages for each vendor. Alfred highlights who's costing you the most and who might be worth a conversation.

### Alerts
When Alfred spots a duplicate charge or a vendor increasing their prices, it flags it straight away. From there you can draft a negotiation email in one tap or schedule an AI-powered call with the vendor. You choose the tone: collaborative, assertive, or firm.

### What If Scenarios
Before making a financial decision, you can model it out first. Simulate things like cancelling a subscription, switching vendors, hiring someone new, or changing your marketing budget. Alfred compares scenarios side by side with charts and an AI-generated explanation of the difference.

### AI Negotiations
Alfred can actually get on the phone for you. It generates a brief based on your vendor spend, places an outbound call via Bland AI or a self-hosted PipeCat setup, transcribes the conversation in real time, and sends you a summary afterwards with the outcome, any agreed discount, and a follow-up email.

---

## Who It's For

Alfred is built for small and medium-sized businesses that don't have a dedicated finance team watching every line item. It's particularly useful for tech startups, digital agencies, and remote-first companies juggling a lot of SaaS tools, and for anyone who wants to actually optimise their spending rather than just log it.

---

## Setup

```bash
npm install
```

| Target | Command |
|---|---|
| Web | `npm run web` |
| iOS | `npm run ios` |
| Android | `npm run android` |
| Expo dev menu | `npm start` |

---

## Supabase

Alfred uses the Supabase JS client rather than a direct Postgres connection.

1. Grab your anon key from the Supabase Dashboard under Settings > API
2. Create your `.env` file:
   ```bash
   cp .env.example .env
   # Add your key: EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Use the client anywhere in the app:
   ```ts
   import { supabase } from './lib/supabase';
   const { data } = await supabase.from('your_table').select();
   ```
4. Run the migration in the Supabase SQL Editor using the file at `supabase/migrations/20260307000001_workspaces_transactions.sql`

If you just want to explore the app without setting up Supabase, hit "View Demo Dashboard" on the login screen. Everything runs in-memory so you can poke around freely.

---

## Trying It Out

1. Create a workspace from the sidebar, pick a month and year, and hit Create
2. Go to the Dashboard, select your workspace, and upload a CSV with `date`, `vendor`, and `amount` columns
3. Head to Alerts or Vendor Negotiations to draft an email or schedule an AI call

There are sample CSVs for January, February, and March 2026 in the `sample-data/` folder. Upload one per workspace to see everything in action: subscriptions, price creep, vendor analytics, and the cancellation queue. The `sample-data/README.md` has more detail.

---

## Project Structure

| Path | Description |
|---|---|
| `App.tsx` | Root component |
| `lib/supabase.ts` | Supabase client |
| `src/context/WorkspaceContext.tsx` | Workspaces, active workspace, transactions |
| `src/screens/` | Dashboard, Spending, Alerts, What If |
| `src/components/` | UploadZone, ScheduleAICallModal, charts, etc. |
| `supabase/functions/` | Negotiation edge functions |
| `supabase/migrations/` | Schema and RLS policies |
| `voice-server/` | Self-hosted voice setup (PipeCat, CSM) |
| `sample-data/` | Sample CSVs for demos |

Use `Platform.OS === 'web'` or platform-specific file extensions like `.ios.tsx` and `.web.tsx` when you need things to behave differently per platform.

---

## Platform Notes

On iOS, you'll need Xcode installed to run the simulator. For a physical device, use Expo Go on the same WiFi network, or set up an EAS Build for a standalone app.

On web, `npm run web` starts the dev server on port 8081. To build for production, run `npx expo export --platform web`.

![Alfred Lean Canvas](./Alfred%20Lean%20Canvas.png)
