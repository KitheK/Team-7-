import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ingestRouter } from './routes/ingest';
import { cancellationRouter } from './routes/generateCancellation';
import { receiptRouter } from './routes/extractReceipt';
import { policyRouter } from './routes/enforcePolicy';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api', ingestRouter);
app.use('/api', cancellationRouter);
app.use('/api', receiptRouter);
app.use('/api', policyRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`LeanLedger server running on port ${PORT}`);
});
