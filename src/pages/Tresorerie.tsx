// في أعلى الملف (حول سطور الاستيراد)
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet, TrendingUp, AlertCircle, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useContracts } from "@/hooks/useContracts";
import { useExpenses } from "@/hooks/useExpenses";
import { useMiscellaneousExpenses } from "@/hooks/useMiscellaneousExpenses";
import { useRepairs } from "@/hooks/useRepairs";
import type { Payment } from "@/types/payment";
import { computeContractSummary } from "@/utils/contractMath";
import type { Contract } from "@/services/localStorageService";
import { TreasuryDashboard } from "@/components/treasury/TreasuryDashboard";
import { TreasuryMovements } from "@/components/treasury/TreasuryMovements";
import { TreasuryCharts } from "@/components/treasury/TreasuryCharts";
import { TreasuryForecast } from "@/components/treasury/TreasuryForecast";
import { TreasuryActions } from "@/components/treasury/TreasuryActions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
// NEW: استخدم خدمة التخزين الموحدة
import { localStorageService } from "@/services/localStorageService";

export interface TreasuryMovement {
  id: string;
  date: string;
  type: 'recette' | 'depense' | 'divers' | 'transfert' | 'reparation';
  amount: number;
  paymentMethod: 'Espèces' | 'Virement' | 'Chèque';
  reference: string;
  description?: string;
  balance?: number;
}

const Tresorerie = () => {
  const { contracts: allContracts, refetch: refetchContracts, deleteContract } = useContracts();
  const { expenses: vehicleExpenses } = useExpenses();
  const { expenses: miscExpenses, refetch: refetchMisc, deleteExpense } = useMiscellaneousExpenses();
  const { repairs, deleteRepair } = useRepairs();
  
  const [payments, setPayments] = useLocalStorage<Payment[]>("payments", []);
  const [bankTransfers, setBankTransfers] = useLocalStorage<any[]>("bankTransfers", []);
  const [cashBalance] = useLocalStorage<number>("cashBalance", 0);
  const [bankAccount] = useLocalStorage<number>("bankAccount", 0);
  const [bankBalance] = useLocalStorage<number>("bankBalance", 0);
  
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Refresh data on mount
  useEffect(() => {
    refetchContracts();
    refetchMisc();
  }, [refetchContracts, refetchMisc]);

  // Handle delete movement
  const handleDeleteMovement = async (movementId: string, movementType: string) => {
    try {
      switch (movementType) {
        case 'recette':
          // Delete payment
          setPayments(prev => prev.filter(p => p.id !== movementId));
          break;
        case 'divers':
          // Delete miscellaneous expense
          await deleteExpense(movementId);
          break;
        case 'reparation':
          // حذف حركة إصلاح عبر الخدمة الموحدة (يعالج البادئة rental_app_)
          localStorageService.deleteWhere('repairPayments', 'id', movementId);
          // تحديث الواجهة
          refetchContracts();
          break;
        case 'transfert':
          // Delete bank transfer
          setBankTransfers(prev => prev.filter(t => t.id !== movementId));
          break;
      }
    } catch (error) {
      console.error('Error deleting movement:', error);
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    // Espèces: مدفوعات نقد - مصاريف نقد - إصلاحات نقد ± التحويلات
    let totalEspeces = 0;
    payments.forEach(payment => {
      if (payment.paymentMethod === 'Espèces') totalEspeces += payment.amount;
    });
    (miscExpenses || []).forEach(expense => {
      if (expense.payment_method === 'Espèces') totalEspeces -= expense.amount;
    });
    // تأثير التحويلات على espèces مطابق لصفحة Recette
    (bankTransfers || []).forEach(transfer => {
      if (transfer.type === 'cash') {
        // Espèces → Banque: espèces تنقص
        totalEspeces -= transfer.amount;
      } else if (transfer.type === 'bank_to_cash') {
        // Banque → Espèces: espèces تزيد بالصافي (amount - fees) أو netAmount إن وُجد
        const net = (transfer.netAmount ?? (transfer.amount - (transfer.fees ?? 0)));
        totalEspeces += net;
      }
      // ملاحظة: تحويل Chèque → Banque لا يغيّر espèces
    });
    const repairPayments = JSON.parse(localStorage.getItem('repairPayments') || '[]');
    repairPayments.forEach((p: any) => {
      if (p.paymentMethod === 'Espèces') totalEspeces -= p.amount;
    });

    // Virements: مدفوعات تحويل - مصاريف تحويل - إصلاحات تحويل
    let totalVirements = 0;
    payments.forEach(payment => {
      if (payment.paymentMethod === 'Virement') totalVirements += payment.amount;
    });
    (miscExpenses || []).forEach(expense => {
      if (expense.payment_method === 'Virement') totalVirements -= expense.amount;
    });
    repairPayments.forEach((p: any) => {
      if (p.paymentMethod === 'Virement') totalVirements -= p.amount;
    });

    // رصيد البنك = virements + التحويلات الداخلة (cash/check) - التحويلات الخارجة (bank_to_cash)
    const bankTransfersIn = (bankTransfers || []).reduce((sum, t) =>
      (t.type === 'cash' || t.type === 'check')
        ? sum + ((t.netAmount ?? (t.amount - (t.fees ?? 0))))
        : sum, 0
    );
    const bankTransfersOut = (bankTransfers || []).reduce((sum, t) =>
      (t.type === 'bank_to_cash') ? sum + t.amount : sum, 0
    );
    const computedBankBalance = Math.max(0, totalVirements + bankTransfersIn - bankTransfersOut);

    // الشيكات غير المودعة
    const totalChecks = payments
      .filter(p => p.paymentMethod === 'Chèque' && p.checkDepositStatus === 'non encaissé')
      .reduce((sum, p) => sum + p.amount, 0);

    const clientDebts = (allContracts || []).reduce((sum, contract) => {
      const summary = computeContractSummary(contract as Contract, { advanceMode: 'field' });
      return sum + summary.reste;
    }, 0);
    const totalDivers = (miscExpenses || []).reduce((sum, exp) => sum + exp.amount, 0);
    const repairDebts = (repairs || []).reduce((sum, repair) => sum + (repair.dette || 0), 0);

    return {
      bankBalance: computedBankBalance,
      cashBalance: Math.max(0, totalEspeces),
      totalChecks,
      clientDebts,
      supplierDebts: totalDivers,
      repairDebts,
      totalAvailable: computedBankBalance + Math.max(0, totalEspeces) + totalChecks
    };
  }, [payments, allContracts, miscExpenses, bankTransfers, repairs]);

  // Build all treasury movements
  const allMovements = useMemo(() => {
    const movements: TreasuryMovement[] = [];

    // Add payments (recettes)
    (payments || []).forEach(payment => {
      movements.push({
        id: payment.id,
        date: payment.paymentDate,
        type: 'recette',
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        reference: `Contrat ${payment.contractNumber}`,
        description: payment.customerName
      });
    });

    // Add misc expenses (divers)
    (miscExpenses || []).forEach(expense => {
      movements.push({
        id: expense.id,
        date: expense.expense_date,
        type: 'divers',
        amount: -expense.amount,
        paymentMethod: expense.payment_method as any,
        reference: expense.expense_type,
        description: expense.notes || expense.custom_expense_type
      });
    });

    // Add repair payments (expenses)
    const repairPayments = JSON.parse(localStorage.getItem('repairPayments') || '[]');
    repairPayments.forEach((payment: any) => {
      movements.push({
        id: payment.id,
        date: payment.date,
        type: 'reparation',
        amount: -payment.amount, // Negative for expense
        paymentMethod: payment.paymentMethod,
        reference: payment.reference,
        description: payment.description
      });
    });

    // Add bank transfers
    (bankTransfers || []).forEach(transfer => {
      movements.push({
        id: transfer.id,
        date: transfer.date,
        type: 'transfert',
        amount: transfer.type === 'bank_to_cash' ? transfer.amount : -transfer.amount,
        paymentMethod: transfer.type === 'cash' ? 'Espèces' : transfer.type === 'check' ? 'Chèque' : 'Virement',
        reference: `Transfert ${transfer.type}`,
        description: transfer.reference
      });
    });

    // Sort by date desc
    return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, miscExpenses, repairs, bankTransfers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-3xl">
                  <Wallet className="w-8 h-8 text-primary" />
                  Trésorerie
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  Suivi et gestion des flux financiers de BONATOURS
                </p>
              </div>
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>

        {/* Dashboard Summary */}
        <TreasuryDashboard totals={totals} />

        {/* Charts */}
        <TreasuryCharts 
          movements={allMovements}
          bankBalance={totals.bankBalance}
          cashBalance={totals.cashBalance}
        />

        {/* Forecast Section */}
        <TreasuryForecast 
          payments={payments}
          miscExpenses={miscExpenses || []}
          contracts={allContracts || []}
        />

        {/* Movements Journal */}
        <TreasuryMovements 
          movements={allMovements}
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onDelete={handleDeleteMovement}
        />

        {/* Quick Actions */}
        <TreasuryActions 
          onRefresh={() => {
            refetchContracts();
            refetchMisc();
          }}
        />
      </div>
    </div>
  );
};

export default Tresorerie;
