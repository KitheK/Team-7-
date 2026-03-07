export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          user_id: string;
          month_year: string;
          total_saved: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month_year: string;
          total_saved?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          month_year?: string;
          total_saved?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          workspace_id: string;
          vendor_name: string;
          amount: number;
          transaction_date: string;
          category: string | null;
          source_file: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          vendor_name: string;
          amount: number;
          transaction_date: string;
          category?: string | null;
          source_file?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          vendor_name?: string;
          amount?: number;
          transaction_date?: string;
          category?: string | null;
          source_file?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_workspace_id_fkey';
            columns: ['workspace_id'];
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
      file_uploads: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          storage_path: string;
          original_filename: string | null;
          row_count: number | null;
          rejected_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          storage_path: string;
          original_filename?: string | null;
          row_count?: number | null;
          rejected_count?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          storage_path?: string;
          original_filename?: string | null;
          row_count?: number | null;
          rejected_count?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'file_uploads_workspace_id_fkey';
            columns: ['workspace_id'];
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'file_uploads_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      anomalies: {
        Row: {
          id: string;
          workspace_id: string;
          type: AnomalyType;
          amount: number;
          status: AnomalyStatus;
          metadata: Json;
          source: AnomalySource;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          type: AnomalyType;
          amount: number;
          status?: AnomalyStatus;
          metadata?: Json;
          source?: AnomalySource;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          type?: AnomalyType;
          amount?: number;
          status?: AnomalyStatus;
          metadata?: Json;
          source?: AnomalySource;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'anomalies_workspace_id_fkey';
            columns: ['workspace_id'];
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
      policy_rules: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          allowed: boolean | null;
          max_amount: number | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          allowed?: boolean | null;
          max_amount?: number | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          allowed?: boolean | null;
          max_amount?: number | null;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      vendor_price_history: {
        Row: {
          workspace_id: string;
          vendor_name: string;
          charge_month: string;
          charge_count: number;
          avg_charge: number;
          min_charge: number;
          max_charge: number;
          stddev_charge: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      recalculate_workspace_total: {
        Args: { ws_id: string };
        Returns: undefined;
      };
      find_zombie_subscriptions: {
        Args: { ws_id: string };
        Returns: {
          vendor_name: string;
          charge_month: string;
          charge_count: number;
          total_charged: number;
          transaction_ids: string[];
          charge_amounts: number[];
        }[];
      };
      get_vendor_history: {
        Args: { ws_id: string };
        Returns: {
          workspace_id: string;
          vendor_name: string;
          charge_month: string;
          charge_count: number;
          avg_charge: number;
          min_charge: number;
          max_charge: number;
          stddev_charge: number | null;
        }[];
      };
    };
    Enums: {};
  };
};

export type AnomalyType =
  | 'zombie_subscription'
  | 'price_creep'
  | 'policy_violation'
  | 'uncategorised';

export type AnomalyStatus =
  | 'open'
  | 'resolved'
  | 'pending_approval'
  | 'dismissed';

export type AnomalySource = 'csv' | 'receipt_scan';

// Convenience row types for use throughout the app.
export type Workspace = Database['public']['Tables']['workspaces']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type FileUpload = Database['public']['Tables']['file_uploads']['Row'];
export type Anomaly = Database['public']['Tables']['anomalies']['Row'];
export type PolicyRule = Database['public']['Tables']['policy_rules']['Row'];
export type VendorPriceHistory = Database['public']['Views']['vendor_price_history']['Row'];
