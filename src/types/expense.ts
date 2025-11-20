
export interface Expense {
  id: string;
  vehicle_id: string;
  type: 'vignette' | 'assurance' | 'visite_technique' | 'gps' | 'credit' | 'reparation';
  total_cost: number;
  start_date: string;
  end_date: string;
  period_months: number;
  monthly_cost: number;
  document_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyExpense {
  id: string;
  expense_id: string | null; // Allow null for repair expense triggered by logs
  vehicle_id: string;
  month_year: string;
  allocated_amount: number;
  expense_type: 'vignette' | 'assurance' | 'visite_technique' | 'gps' | 'credit' | 'reparation';
  created_at?: string;
  updated_at?: string;
}
