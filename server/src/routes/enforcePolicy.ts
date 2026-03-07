import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { anthropic, MODEL } from '../lib/anthropic';

export const policyRouter = Router();

const DEFAULT_RULES = [
  { category: 'gaming', allowed: false },
  { category: 'alcohol', allowed: true, max_amount: 30 },
  { category: 'personal_care', allowed: false },
  { category: 'entertainment', allowed: true, max_amount: 100 },
  { category: 'travel', allowed: true },
  { category: 'meals', allowed: true, max_amount: 50 },
];

policyRouter.post('/enforce-policy', requireAuth, async (req, res) => {
  try {
    const { receiptData, workspaceId } = req.body;
    const { userId } = req as AuthenticatedRequest;

    if (!receiptData || !workspaceId) {
      res.status(400).json({ error: 'receiptData and workspaceId are required' });
      return;
    }

    // 1. Fetch user's policy rules (fall back to defaults)
    const { data: userRules } = await supabaseAdmin
      .from('policy_rules')
      .select('*')
      .eq('user_id', userId);

    const policyRules =
      userRules && userRules.length > 0
        ? userRules.map((r) => ({
            category: r.category,
            allowed: r.allowed,
            max_amount: r.max_amount,
          }))
        : DEFAULT_RULES;

    // 2. Call Anthropic for policy enforcement
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a strict company expense auditor.
Receipt data: ${JSON.stringify(receiptData)}
Company policy rules: ${JSON.stringify(policyRules)}
Identify ALL line items that violate policy. Return ONLY valid JSON — no markdown:
{ "compliant": boolean,
  "violations": [{ "item": string, "amount": number, "reason": string, "policy_rule": string }] }`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      res.status(500).json({ error: 'No text response from AI' });
      return;
    }

    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const result = JSON.parse(jsonStr);

    // 3. If violations found, insert an anomaly
    if (!result.compliant && result.violations?.length > 0) {
      const totalViolationAmount = result.violations.reduce(
        (sum: number, v: { amount: number }) => sum + (v.amount || 0),
        0,
      );

      await supabaseAdmin.from('anomalies').insert({
        workspace_id: workspaceId,
        type: 'policy_violation' as const,
        source: 'receipt_scan' as const,
        amount: totalViolationAmount,
        status: 'open' as const,
        metadata: {
          merchant: receiptData.merchant,
          receipt_date: receiptData.date,
          violations: result.violations,
          receipt_image_path: receiptData.storagePath ?? null,
        },
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Policy enforcement error:', err);
    res.status(500).json({ error: 'Failed to enforce policy' });
  }
});
