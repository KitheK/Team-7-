import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export type Workspace = {
  id: string;
  user_id?: string;
  month: number;
  year: number;
  total_saved: number;
  created_at?: string;
};

export type Transaction = {
  id?: string;
  workspace_id: string;
  vendor_name: string | null;
  amount: number;
  transaction_date: string | null;
  description: string | null;
};

export type TransactionRow = {
  vendor_name: string | null;
  amount: number;
  transaction_date: string | null;
  description: string | null;
};

export type NegotiationStatus = 'pending' | 'calling' | 'completed' | 'failed' | 'cancelled';
export type NegotiationOutcome = 'success' | 'partial' | 'rejected' | 'no_answer' | 'error';
export type NegotiationTone = 'collaborative' | 'assertive' | 'firm';

export type Negotiation = {
  id: string;
  workspace_id: string;
  user_id: string;
  vendor_name: string;
  vendor_phone?: string;
  status: NegotiationStatus;
  tone: NegotiationTone;
  call_id?: string;
  target_discount?: number;
  agreed_discount?: number;
  annual_spend?: number;
  script?: Record<string, any>;
  brief?: Record<string, any>;
  outcome?: NegotiationOutcome;
  follow_up_email?: string;
  created_at: string;
  updated_at: string;
};

export type TranscriptLine = {
  id: string;
  negotiation_id: string;
  speaker: 'agent' | 'vendor';
  content: string;
  timestamp_ms: number;
  created_at: string;
};

export type VendorPreference = {
  id: string;
  user_id: string;
  vendor_name: string;
  do_not_call: boolean;
  preferred_tone: NegotiationTone;
  notes?: string;
  created_at: string;
};

export type UploadBatch = {
  id: string;
  workspace_id: string;
  file_name: string;
  row_count: number;
  file_path: string | null;
  created_at: string;
};

export const OVERVIEW_ID = 'all';

export type OverviewRange = 'all' | 'last3' | 'last6';

type WorkspaceContextValue = {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeWorkspace: Workspace | null;
  overviewRange: OverviewRange;
  setOverviewRange: (r: OverviewRange) => void;
  activeWorkspaceTransactions: Transaction[];
  setActiveWorkspaceId: (id: string | null) => void;
  createWorkspace: (month: number, year: number) => Promise<Workspace | null>;
  refetchWorkspaces: () => Promise<void>;
  refreshActiveTransactions: () => Promise<void>;
  updateWorkspaceTotal: (workspaceId: string) => Promise<void>;
  insertTransactions: (workspaceId: string, rows: TransactionRow[]) => Promise<{ inserted: number; rejected: number }>;
  uploadBatches: UploadBatch[];
  uploadCsv: (workspaceId: string, csvText: string, fileName: string, parsedRows: TransactionRow[]) => Promise<UploadBatch | null>;
  deleteBatch: (batchId: string) => Promise<void>;
  refreshUploadBatches: () => Promise<void>;
  isDemoMode: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function workspaceLabel(w: Workspace) {
  return `${MONTH_NAMES[w.month - 1]} ${w.year}`;
}

export function WorkspaceProvider({
  children,
  userId,
  isDemoMode,
}: {
  children: React.ReactNode;
  userId: string | null;
  isDemoMode: boolean;
}) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(OVERVIEW_ID);
  const [overviewRange, setOverviewRangeState] = useState<OverviewRange>('all');
  const [demoTransactions, setDemoTransactions] = useState<Record<string, TransactionRow[]>>({});
  const [activeWorkspaceTransactions, setActiveWorkspaceTransactions] = useState<Transaction[]>([]);
  const [uploadBatches, setUploadBatches] = useState<UploadBatch[]>([]);

  const refetchWorkspaces = useCallback(async () => {
    if (isDemoMode || !userId || !supabase) {
      return;
    }
    const { data, error } = await supabase
      .from('workspaces')
      .select('id, user_id, month, year, total_saved, created_at')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    if (!error && data) {
      const list = data as Workspace[];
      setWorkspaces(list);
      setActiveWorkspaceIdState(prev => {
        if (prev === OVERVIEW_ID) return OVERVIEW_ID;
        if (list.length === 0) return OVERVIEW_ID;
        if (prev && list.some(w => w.id === prev)) return prev;
        return list[0].id;
      });
    }
  }, [userId, isDemoMode]);

  useEffect(() => {
    refetchWorkspaces();
  }, [userId, isDemoMode]);

  useEffect(() => {
    if (
      activeWorkspaceId &&
      activeWorkspaceId !== OVERVIEW_ID &&
      workspaces.length > 0 &&
      !workspaces.find(w => w.id === activeWorkspaceId)
    ) {
      setActiveWorkspaceIdState(workspaces[0]?.id ?? OVERVIEW_ID);
    }
  }, [workspaces, activeWorkspaceId]);

  const overviewWorkspaceIds = useCallback(() => {
    if (overviewRange === 'all') return workspaces.map(w => w.id);
    const n = overviewRange === 'last3' ? 3 : 6;
    return workspaces.slice(0, n).map(w => w.id);
  }, [workspaces, overviewRange]);

  const refreshActiveTransactions = useCallback(async () => {
    if (isDemoMode) {
      if (activeWorkspaceId === OVERVIEW_ID || !activeWorkspaceId) {
        const ids = overviewWorkspaceIds();
        const all: Transaction[] = [];
        ids.forEach(wid => {
          (demoTransactions[wid] ?? []).forEach(r => all.push({ ...r, workspace_id: wid }));
        });
        setActiveWorkspaceTransactions(all);
      } else {
        const rows = demoTransactions[activeWorkspaceId] ?? [];
        setActiveWorkspaceTransactions(rows.map(r => ({ ...r, workspace_id: activeWorkspaceId })));
      }
      return;
    }
    if (!supabase || !userId) {
      setActiveWorkspaceTransactions([]);
      return;
    }
    if (activeWorkspaceId === OVERVIEW_ID || !activeWorkspaceId) {
      const ids = overviewWorkspaceIds();
      if (ids.length === 0) {
        setActiveWorkspaceTransactions([]);
        return;
      }
      const { data } = await supabase.from('transactions').select('id, workspace_id, vendor_name, amount, transaction_date, description').in('workspace_id', ids);
      setActiveWorkspaceTransactions((data as Transaction[]) ?? []);
    } else {
      const { data } = await supabase.from('transactions').select('id, workspace_id, vendor_name, amount, transaction_date, description').eq('workspace_id', activeWorkspaceId);
      setActiveWorkspaceTransactions((data as Transaction[]) ?? []);
    }
  }, [isDemoMode, activeWorkspaceId, demoTransactions, workspaces, userId, overviewWorkspaceIds]);

  useEffect(() => {
    refreshActiveTransactions();
  }, [activeWorkspaceId, overviewRange, refreshActiveTransactions]);

  const createWorkspace = useCallback(async (month: number, year: number): Promise<Workspace | null> => {
    if (isDemoMode || !userId || !supabase) {
      const id = `demo-${year}-${month}`;
      const w: Workspace = { id, month, year, total_saved: 0 };
      setWorkspaces(prev => [w, ...prev]);
      setActiveWorkspaceIdState(id);
      return w;
    }
    const { data, error } = await supabase
      .from('workspaces')
      .insert({ user_id: userId, month, year, total_saved: 0 })
      .select('id, user_id, month, year, total_saved, created_at')
      .single();
    if (error) return null;
    const workspace = data as Workspace;
    setWorkspaces(prev => [workspace, ...prev]);
    setActiveWorkspaceIdState(workspace.id);
    return workspace;
  }, [userId, isDemoMode]);

  const updateWorkspaceTotal = useCallback(async (workspaceId: string) => {
    if (!supabase) return;
    const { data: rows } = await supabase
      .from('transactions')
      .select('amount')
      .eq('workspace_id', workspaceId);
    const total = (rows ?? []).reduce((s, r) => s + Number(r.amount), 0);
    await supabase.from('workspaces').update({ total_saved: total }).eq('id', workspaceId);
    setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { ...w, total_saved: total } : w));
  }, []);

  const insertTransactions = useCallback(async (
    workspaceId: string,
    rows: TransactionRow[]
  ): Promise<{ inserted: number; rejected: number }> => {
    const valid = rows.filter(r => typeof r.amount === 'number' && !Number.isNaN(r.amount));
    const rejected = rows.length - valid.length;
    if (isDemoMode) {
      setDemoTransactions(prev => {
        const next = { ...prev, [workspaceId]: [...(prev[workspaceId] ?? []), ...valid] };
        const newTotal = valid.reduce((s, r) => s + r.amount, 0);
        setWorkspaces(wprev => wprev.map(w => w.id !== workspaceId ? w : { ...w, total_saved: (w.total_saved ?? 0) + newTotal }));
        setActiveWorkspaceTransactions(tprev => {
          if (activeWorkspaceId === OVERVIEW_ID || !activeWorkspaceId) {
            const ids = overviewWorkspaceIds();
            return ids.flatMap(wid => (next[wid] ?? []).map(r => ({ ...r, workspace_id: wid })));
          }
          if (activeWorkspaceId === workspaceId) {
            return [...(next[workspaceId] ?? []).map(r => ({ ...r, workspace_id: workspaceId }))];
          }
          return tprev;
        });
        return next;
      });
      return { inserted: valid.length, rejected };
    }
    if (!supabase || valid.length === 0) return { inserted: 0, rejected };
    const { error } = await supabase.from('transactions').insert(
      valid.map(r => ({
        workspace_id: workspaceId,
        vendor_name: r.vendor_name ?? null,
        amount: r.amount,
        transaction_date: r.transaction_date ?? null,
        description: r.description ?? null,
      }))
    );
    if (error) return { inserted: 0, rejected: rows.length };
    await updateWorkspaceTotal(workspaceId);
    refreshActiveTransactions();
    return { inserted: valid.length, rejected };
  }, [isDemoMode, activeWorkspaceId, updateWorkspaceTotal, refreshActiveTransactions, overviewWorkspaceIds]);

  const refreshUploadBatches = useCallback(async () => {
    if (isDemoMode || !supabase || !activeWorkspaceId || activeWorkspaceId === OVERVIEW_ID) {
      setUploadBatches([]);
      return;
    }
    const { data } = await supabase
      .from('upload_batches')
      .select('id, workspace_id, file_name, row_count, file_path, created_at')
      .eq('workspace_id', activeWorkspaceId)
      .order('created_at', { ascending: false });
    setUploadBatches((data as UploadBatch[]) ?? []);
  }, [isDemoMode, activeWorkspaceId]);

  useEffect(() => {
    refreshUploadBatches();
  }, [activeWorkspaceId, refreshUploadBatches]);

  const uploadCsv = useCallback(async (
    workspaceId: string,
    csvText: string,
    fileName: string,
    parsedRows: TransactionRow[],
  ): Promise<UploadBatch | null> => {
    if (isDemoMode || !supabase) {
      const demoBatch: UploadBatch = {
        id: `demo-batch-${Date.now()}`,
        workspace_id: workspaceId,
        file_name: fileName,
        row_count: parsedRows.length,
        file_path: null,
        created_at: new Date().toISOString(),
      };
      setUploadBatches(prev => [demoBatch, ...prev]);
      await insertTransactions(workspaceId, parsedRows);
      return demoBatch;
    }
    const filePath = `${workspaceId}/${Date.now()}-${fileName}`;
    await supabase.storage.from('csv-uploads').upload(filePath, csvText, { contentType: 'text/csv' });

    const { data: batch, error } = await supabase
      .from('upload_batches')
      .insert({ workspace_id: workspaceId, file_name: fileName, row_count: parsedRows.length, file_path: filePath })
      .select()
      .single();
    if (error || !batch) return null;

    const valid = parsedRows.filter(r => typeof r.amount === 'number' && !Number.isNaN(r.amount));
    if (valid.length > 0) {
      await supabase.from('transactions').insert(
        valid.map(r => ({
          workspace_id: workspaceId,
          batch_id: batch.id,
          vendor_name: r.vendor_name ?? null,
          amount: r.amount,
          transaction_date: r.transaction_date ?? null,
          description: r.description ?? null,
        }))
      );
      await updateWorkspaceTotal(workspaceId);
      await refreshActiveTransactions();
    }
    await refreshUploadBatches();
    return batch as UploadBatch;
  }, [isDemoMode, insertTransactions, updateWorkspaceTotal, refreshActiveTransactions, refreshUploadBatches]);

  const deleteBatch = useCallback(async (batchId: string) => {
    if (isDemoMode) {
      setUploadBatches(prev => prev.filter(b => b.id !== batchId));
      return;
    }
    if (!supabase) return;
    const batch = uploadBatches.find(b => b.id === batchId);
    if (batch?.file_path) {
      await supabase.storage.from('csv-uploads').remove([batch.file_path]);
    }
    await supabase.from('upload_batches').delete().eq('id', batchId);
    if (batch) {
      await updateWorkspaceTotal(batch.workspace_id);
      await refreshActiveTransactions();
    }
    await refreshUploadBatches();
  }, [isDemoMode, uploadBatches, updateWorkspaceTotal, refreshActiveTransactions, refreshUploadBatches]);

  useEffect(() => {
    if (isDemoMode) refreshActiveTransactions();
  }, [isDemoMode, demoTransactions, refreshActiveTransactions]);

  const activeWorkspace = activeWorkspaceId && activeWorkspaceId !== OVERVIEW_ID
    ? workspaces.find(w => w.id === activeWorkspaceId) ?? null
    : null;

  const setActiveWorkspaceId = useCallback((id: string | null) => {
    setActiveWorkspaceIdState(id);
  }, []);

  const setOverviewRange = useCallback((r: OverviewRange) => {
    setOverviewRangeState(r);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspaceId,
        activeWorkspace,
        overviewRange,
        setOverviewRange,
        activeWorkspaceTransactions,
        setActiveWorkspaceId,
        createWorkspace,
        refetchWorkspaces,
        refreshActiveTransactions,
        updateWorkspaceTotal,
        insertTransactions,
        uploadBatches,
        uploadCsv,
        deleteBatch,
        refreshUploadBatches,
        isDemoMode,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}
