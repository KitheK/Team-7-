import type { ParsedTransaction } from './parseCsv';

export type UploadIssue = {
  type: 'duplicate_vendor' | 'high_spend' | 'missing_date';
  message: string;
  vendor?: string;
  amount?: number;
  count?: number;
};

export type UploadAnalysis = {
  totalAmount: number;
  uniqueVendors: number;
  vendorCounts: Record<string, number>;
  issues: UploadIssue[];
  rows: ParsedTransaction[];
};

export function analyzeUpload(rows: ParsedTransaction[]): UploadAnalysis {
  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
  const vendorCounts: Record<string, number> = {};
  const issues: UploadIssue[] = [];

  for (const r of rows) {
    const vendor = (r.vendor_name || r.description || 'Unknown').trim() || 'Unknown';
    vendorCounts[vendor] = (vendorCounts[vendor] ?? 0) + 1;
  }

  for (const [vendor, count] of Object.entries(vendorCounts)) {
    if (count > 1) {
      issues.push({
        type: 'duplicate_vendor',
        message: `${vendor} appears ${count} times — possible duplicate subscription or double charge`,
        vendor,
        count,
      });
    }
  }

  const highSpendThreshold = 5000;
  const highRows = rows.filter(r => r.amount >= highSpendThreshold);
  if (highRows.length > 0) {
    issues.push({
      type: 'high_spend',
      message: `${highRows.length} transaction(s) over $${highSpendThreshold.toLocaleString()} — review for negotiation`,
      amount: highRows.reduce((s, r) => s + r.amount, 0),
    });
  }

  const missingDate = rows.filter(r => !r.transaction_date);
  if (missingDate.length > 0) {
    issues.push({
      type: 'missing_date',
      message: `${missingDate.length} row(s) missing date — check source data`,
    });
  }

  return {
    totalAmount,
    uniqueVendors: Object.keys(vendorCounts).length,
    vendorCounts,
    issues,
    rows,
  };
}
