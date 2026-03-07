import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { sanitizeFile } from '../utils/sanitizeFile';
import { detectZombieSubscriptions } from '../services/detectZombieSubscriptions';
import { detectPriceCreep } from '../services/detectPriceCreep';

export const ingestRouter = Router();

ingestRouter.post('/ingest', requireAuth, async (req, res) => {
  try {
    const { storagePath, workspaceId } = req.body;
    const { userId } = req as AuthenticatedRequest;

    if (!storagePath || !workspaceId) {
      res.status(400).json({ error: 'storagePath and workspaceId are required' });
      return;
    }

    // 1. Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('financial-uploads')
      .download(storagePath);

    if (downloadError || !fileData) {
      res.status(400).json({ error: `File download failed: ${downloadError?.message}` });
      return;
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const mimeType = storagePath.endsWith('.xlsx')
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv';

    // 2. Sanitize
    const { cleanRows, summary } = sanitizeFile(buffer, mimeType);

    // 3. Bulk insert transactions in batches of 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < cleanRows.length; i += BATCH_SIZE) {
      const batch = cleanRows.slice(i, i + BATCH_SIZE).map((row) => ({
        workspace_id: workspaceId,
        vendor_name: row.vendor_name,
        amount: row.amount,
        transaction_date: row.transaction_date,
        category: row.category,
        source_file: storagePath,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('transactions')
        .insert(batch);

      if (insertError) {
        res.status(500).json({ error: `Transaction insert failed: ${insertError.message}` });
        return;
      }
    }

    // 4. Record the upload
    await supabaseAdmin.from('file_uploads').insert({
      workspace_id: workspaceId,
      user_id: userId,
      storage_path: storagePath,
      original_filename: storagePath.split('/').pop() ?? storagePath,
      row_count: summary.cleanCount,
      rejected_count: summary.rejectedCount,
    });

    // 5. Run anomaly detection (non-blocking errors logged but don't fail the request)
    const detectionResults = { zombies: 0, priceCreep: 0 };
    try {
      detectionResults.zombies = await detectZombieSubscriptions(workspaceId);
    } catch (e) {
      console.error('Zombie detection error:', e);
    }
    try {
      detectionResults.priceCreep = await detectPriceCreep(workspaceId);
    } catch (e) {
      console.error('Price creep detection error:', e);
    }

    res.json({
      cleanCount: summary.cleanCount,
      rejectedCount: summary.rejectedCount,
      rejectionReasons: summary.rejectionReasons,
      anomaliesDetected: detectionResults,
    });
  } catch (err) {
    console.error('Ingest error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
