/**
 * Simple CSV parser for financial uploads.
 * Expects header row; maps "date"/"transaction date", "description"/"vendor"/"name", "amount"/"debit"/"credit".
 */

export type ParsedTransaction = {
  vendor_name: string | null;
  amount: number;
  transaction_date: string | null;
  description: string | null;
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
      current += c;
    } else if (c === ',' || c === '\t') {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/\s+/g, ' ').trim();
}

function parseAmount(val: string): number | null {
  const cleaned = String(val).replace(/[$,]/g, '').trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseDate(val: string): string | null {
  const s = String(val).trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function parseCsvToTransactions(csvText: string): { rows: ParsedTransaction[]; rejected: number } {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { rows: [], rejected: lines.length };

  const header = parseCsvLine(lines[0]);
  const normalized = header.map(normalizeHeader);

  const dateCol = normalized.findIndex(h => /date|transaction date|posting date/.test(h));
  const amountCol = normalized.findIndex(h => /amount|debit|credit|total/.test(h));
  const descCol = normalized.findIndex(h => /description|vendor|name|merchant|payee/.test(h));

  const fallbackDateCol = dateCol >= 0 ? dateCol : 0;
  const fallbackAmountCol = amountCol >= 0 ? amountCol : (header.length > 2 ? 2 : 1);
  const fallbackDescCol = descCol >= 0 ? descCol : 1;

  let rejected = 0;
  const rows: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const dateVal = cells[fallbackDateCol] ?? cells[dateCol] ?? '';
    const amountVal = cells[fallbackAmountCol] ?? cells[amountCol] ?? '';
    const descVal = cells[fallbackDescCol] ?? cells[descCol] ?? '';

    const amount = parseAmount(amountVal);
    if (amount === null) {
      rejected++;
      continue;
    }
    rows.push({
      vendor_name: descVal || null,
      amount,
      transaction_date: parseDate(dateVal),
      description: descVal || null,
    });
  }

  return { rows, rejected };
}
