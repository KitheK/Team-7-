import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface CleanTransaction {
  vendor_name: string;
  amount: number;
  transaction_date: string; // YYYY-MM-DD
  category: string;
}

export interface RejectedRow {
  rowIndex: number;
  reason: string;
  raw: Record<string, unknown>;
}

export interface SanitizeResult {
  cleanRows: CleanTransaction[];
  rejectedRows: RejectedRow[];
  summary: {
    totalRows: number;
    cleanCount: number;
    rejectedCount: number;
    rejectionReasons: string[];
  };
}

function findColumn(headers: string[], pattern: RegExp): string | null {
  return headers.find((h) => pattern.test(h)) ?? null;
}

function stripCurrency(val: unknown): number {
  if (typeof val === 'number') return val;
  const str = String(val).replace(/[^0-9.\-]/g, '');
  return parseFloat(str);
}

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  const d = new Date(String(val));
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function parseCsvBuffer(buffer: Buffer): Record<string, unknown>[] {
  const text = buffer.toString('utf-8');
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  return result.data;
}

function parseXlsxBuffer(buffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const csv = XLSX.utils.sheet_to_csv(sheet);
  const result = Papa.parse<Record<string, unknown>>(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  return result.data;
}

export function sanitizeFile(
  buffer: Buffer,
  mimeType: string,
): SanitizeResult {
  const rows = mimeType.includes('csv')
    ? parseCsvBuffer(buffer)
    : parseXlsxBuffer(buffer);

  if (rows.length === 0) {
    return {
      cleanRows: [],
      rejectedRows: [],
      summary: {
        totalRows: 0,
        cleanCount: 0,
        rejectedCount: 0,
        rejectionReasons: [],
      },
    };
  }

  const headers = Object.keys(rows[0]).map((h) => h.toLowerCase());
  const dateCol = findColumn(headers, /date|trans.*date|posted/i);
  const vendorCol = findColumn(headers, /vendor|merchant|description|payee|name/i);
  const amountCol = findColumn(headers, /amount|debit|credit|charge|total/i);

  const cleanRows: CleanTransaction[] = [];
  const rejectedRows: RejectedRow[] = [];
  const rejectionReasons: Set<string> = new Set();

  const originalHeaders = Object.keys(rows[0]);
  const getOriginalKey = (lowerKey: string | null) =>
    lowerKey ? originalHeaders.find((h) => h.toLowerCase() === lowerKey) ?? null : null;

  const dateKey = getOriginalKey(dateCol);
  const vendorKey = getOriginalKey(vendorCol);
  const amountKey = getOriginalKey(amountCol);

  rows.forEach((row, i) => {
    const raw = row as Record<string, unknown>;

    if (!vendorKey) {
      const reason = 'No vendor/description column detected';
      rejectedRows.push({ rowIndex: i, reason, raw });
      rejectionReasons.add(reason);
      return;
    }

    if (!amountKey) {
      const reason = 'No amount column detected';
      rejectedRows.push({ rowIndex: i, reason, raw });
      rejectionReasons.add(reason);
      return;
    }

    const amount = stripCurrency(raw[amountKey]);
    if (isNaN(amount)) {
      const reason = 'Invalid amount';
      rejectedRows.push({ rowIndex: i, reason, raw });
      rejectionReasons.add(reason);
      return;
    }

    let transactionDate: string;
    if (dateKey) {
      const d = parseDate(raw[dateKey]);
      if (!d) {
        const reason = 'Invalid date';
        rejectedRows.push({ rowIndex: i, reason, raw });
        rejectionReasons.add(reason);
        return;
      }
      transactionDate = formatDate(d);
    } else {
      transactionDate = formatDate(new Date());
    }

    const vendorRaw = raw[vendorKey];
    if (!vendorRaw || String(vendorRaw).trim() === '') {
      const reason = 'Empty vendor name';
      rejectedRows.push({ rowIndex: i, reason, raw });
      rejectionReasons.add(reason);
      return;
    }

    cleanRows.push({
      vendor_name: String(vendorRaw).trim().replace(/\s+/g, ' ').toUpperCase(),
      amount: Math.abs(amount),
      transaction_date: transactionDate,
      category: 'uncategorised',
    });
  });

  return {
    cleanRows,
    rejectedRows,
    summary: {
      totalRows: rows.length,
      cleanCount: cleanRows.length,
      rejectedCount: rejectedRows.length,
      rejectionReasons: Array.from(rejectionReasons),
    },
  };
}
