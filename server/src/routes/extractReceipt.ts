import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { anthropic, MODEL } from '../lib/anthropic';

export const receiptRouter = Router();

receiptRouter.post('/extract-receipt', requireAuth, async (req, res) => {
  try {
    const { storagePath, workspaceId } = req.body;

    if (!storagePath || !workspaceId) {
      res.status(400).json({ error: 'storagePath and workspaceId are required' });
      return;
    }

    // 1. Download image from Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('financial-uploads')
      .download(storagePath);

    if (downloadError || !fileData) {
      res.status(400).json({ error: `Image download failed: ${downloadError?.message}` });
      return;
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const base64Image = buffer.toString('base64');

    const mediaType = storagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    // 2. Call Anthropic vision API
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Image },
            },
            {
              type: 'text',
              text: `Extract all data from this receipt. Return ONLY valid JSON — no markdown, no explanation:
{ "merchant": string, "date": "YYYY-MM-DD",
  "line_items": [{"name": string, "amount": number}],
  "subtotal": number, "tax": number, "total": number,
  "confidence": number (0–1) }
Set any unreadable field to null.`,
            },
          ],
        },
      ],
    });

    // 3. Parse the response
    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      res.status(500).json({ error: 'No text response from AI' });
      return;
    }

    let jsonStr = textBlock.text.trim();
    // Strip markdown fences if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const receiptData = JSON.parse(jsonStr);

    if (receiptData.confidence != null && receiptData.confidence < 0.65) {
      res.status(422).json({ error: 'low_confidence', data: receiptData });
      return;
    }

    res.json(receiptData);
  } catch (err) {
    console.error('Receipt extraction error:', err);
    res.status(500).json({ error: 'Failed to extract receipt data' });
  }
});
