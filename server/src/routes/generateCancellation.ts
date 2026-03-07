import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { anthropic, MODEL } from '../lib/anthropic';

export const cancellationRouter = Router();

cancellationRouter.post('/generate-cancellation', requireAuth, async (req, res) => {
  try {
    const { vendorName, totalCharged, chargeDates, companyName } = req.body;

    if (!vendorName || !totalCharged || !companyName) {
      res.status(400).json({ error: 'vendorName, totalCharged, and companyName are required' });
      return;
    }

    const dates = Array.isArray(chargeDates) ? chargeDates.join(', ') : 'multiple dates';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `You are a professional business lawyer. Write a firm but polite SaaS subscription cancellation email to ${vendorName}. We were charged ${totalCharged} across ${dates}. The company name is ${companyName}. Format: first line = Subject: ..., then blank line, then body. Be concise (under 120 words). Do not use placeholders.`,
        },
      ],
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Cancellation generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate cancellation email' });
    } else {
      res.end();
    }
  }
});
