export interface Batch {
  id: string;
  name: string;
  price: number;
  schedule: string | null;
  description: string | null;
  created_at: number;
  studentCount?: number;
  revenue?: number;
}

export interface Student {
  id: string;
  name: string;
  phone: string | null;
  amount: number;
  start_date: string;
  validity_days: number;
  batch_id: string | null;
  notes: string | null;
  created_at: number;
  batch_name?: string | null;
  end_date?: string;
}

export interface BatchHistoryEntry {
  id: string;
  student_id: string;
  from_batch_id: string | null;
  to_batch_id: string | null;
  from_batch_name?: string | null;
  to_batch_name?: string | null;
  changed_at: number;
  note: string | null;
}
