# Sample CSV data (Jan / Feb / Mar 2026)

Use these in the app to see workspace-scoped dashboards, subscriptions, price creep, spend categories, vendor analytics, negotiations, and cancellation candidates.

| File | Rows | Notes |
|------|------|--------|
| `january-2026.csv` | 44 | Broad vendor mix; some duplicates (AWS, Salesforce, Slack, Zendesk, GitHub, Zoom, Stripe). |
| `february-2026.csv` | 52 | Same vendors with slightly higher amounts (simulated creep); extra duplicates (GitHub, Zendesk, Notion, PayPal). |
| `march-2026.csv` | 58 | Highest spend; more duplicates (Slack, GitHub, Salesforce, AWS, Adobe, Mailchimp, Stripe, Segment, Zoom). |

**How to use**

1. Create workspaces: **Jan 2026**, **Feb 2026**, **Mar 2026** (Sidebar → New workspace).
2. Select **Jan 2026** → Dashboard → Upload `january-2026.csv`.
3. Select **Feb 2026** → Upload `february-2026.csv`.
4. Select **Mar 2026** → Upload `march-2026.csv`.
5. Switch between **Overview** and each month to see totals, subscriptions, price creep, categories, vendor analytics, negotiation candidates, and cancellation queue all update per view.

**Vendors covered (by category)**

- **Cloud & Infrastructure:** AWS, Google Cloud, Microsoft Azure, DigitalOcean, Cloudflare
- **CRM & Sales:** Salesforce, HubSpot, Pipedrive
- **Communications:** Slack, Zoom, Twilio, Vonage, Discord
- **Design & Creative:** Adobe, Figma, Canva, Invision
- **Customer Support:** Zendesk, Intercom, Freshdesk, Help Scout
- **Dev & Engineering:** GitHub, Atlassian/Jira, Bitbucket
- **Productivity:** Notion, Asana, Monday.com, Confluence, Trello, Basecamp
- **Finance & Payments:** Stripe, PayPal, QuickBooks, Xero
- **Marketing & Analytics:** Mailchimp, SendGrid, Segment, Amplitude, Mixpanel
