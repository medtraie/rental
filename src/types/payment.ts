export interface Payment {
  id: string;
  contractId: string;
  contractNumber: string;
  customerName: string;
  amount: number;
  paymentMethod: 'Espèces' | 'Virement' | 'Chèque';
  paymentDate: string;
  createdAt: string;
  userId?: string;
  checkReference?: string;
  checkName?: string;
  checkDepositDate?: string;
  checkDirection?: 'envoyé' | 'reçu';
  checkDepositStatus?: 'encaissé' | 'non encaissé';
}

export interface PaymentSummary {
  totalPaid: number;
  remainingAmount: number;
  isFullyPaid: boolean;
  payments: Payment[];
}