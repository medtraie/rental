import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, FileText, TrendingDown, Calendar } from "lucide-react";
import type { Payment } from "@/types/payment";
import type { MiscellaneousExpense } from "@/hooks/useMiscellaneousExpenses";
import { format, differenceInDays, isFuture, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo } from "react";
import { computeContractSummary } from "@/utils/contractMath";
import type { Contract } from "@/services/localStorageService";

interface TreasuryForecastProps {
  payments: Payment[];
  miscExpenses: MiscellaneousExpense[];
  contracts: any[];
}

export const TreasuryForecast = ({ payments, miscExpenses, contracts }: TreasuryForecastProps) => {
  // Checks to deposit
  const checksToDeposit = useMemo(() => {
    return payments
      .filter(p => p.paymentMethod === 'Chèque' && p.checkDepositStatus === 'non encaissé' && p.checkDepositDate)
      .map(p => ({
        id: p.id,
        reference: p.checkReference || 'N/A',
        date: p.checkDepositDate!,
        amount: p.amount,
        customerName: p.customerName,
        daysUntil: differenceInDays(new Date(p.checkDepositDate!), new Date())
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [payments]);

  // Unpaid contracts (client debts)
  const unpaidContracts = useMemo(() => {
    return contracts
      .map(contract => {
        const summary = computeContractSummary(contract as Contract, { advanceMode: 'field' });
        return {
          id: contract.id,
          contractNumber: contract.contract_number,
          customerName: contract.customer_name,
          totalAmount: summary.total,
          remainingAmount: summary.reste,
          status: summary.statut
        };
      })
      .filter(c => c.remainingAmount > 0)
      .sort((a, b) => b.remainingAmount - a.remainingAmount);
  }, [contracts]);

  // Upcoming fixed expenses
  const upcomingExpenses = useMemo(() => {
    const fixedExpenseTypes = ['Salaire', 'Loyer', 'CNSS', 'Électricité'];
    
    return miscExpenses
      .filter(exp => fixedExpenseTypes.includes(exp.expense_type))
      .map(exp => ({
        id: exp.id,
        type: exp.expense_type,
        amount: exp.amount,
        date: exp.expense_date,
        daysUntil: differenceInDays(new Date(exp.expense_date), new Date())
      }))
      .filter(exp => exp.daysUntil >= -30) // Last 30 days and future
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [miscExpenses]);

  const getCheckStatusColor = (daysUntil: number) => {
    if (daysUntil < 0) return 'bg-red-100 text-red-800 border-red-200';
    if (daysUntil === 0) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (daysUntil <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getCheckStatusText = (daysUntil: number) => {
    if (daysUntil < 0) return '🔴 En retard';
    if (daysUntil === 0) return '🟠 Aujourd\'hui';
    if (daysUntil <= 3) return '🟡 Proche';
    return '🟢 À venir';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Checks to Deposit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-purple-600" />
            Chèques à Encaisser
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checksToDeposit.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun chèque à encaisser
            </p>
          ) : (
            <div className="space-y-3">
              {checksToDeposit.slice(0, 5).map((check) => (
                <div key={check.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{check.reference}</p>
                      <p className="text-xs text-muted-foreground">{check.customerName}</p>
                    </div>
                    <Badge className={getCheckStatusColor(check.daysUntil)} variant="outline">
                      {getCheckStatusText(check.daysUntil)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {format(new Date(check.date), 'dd/MM/yyyy')}
                    </span>
                    <span className="font-semibold text-purple-600">
                      {check.amount.toLocaleString()} DH
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unpaid Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Factures Clients Impayées
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unpaidContracts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune facture impayée
            </p>
          ) : (
            <div className="space-y-3">
              {unpaidContracts.slice(0, 5).map((contract) => (
                <div key={contract.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{contract.contractNumber}</p>
                      <p className="text-xs text-muted-foreground">{contract.customerName}</p>
                    </div>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                      {contract.status === 'en attente' ? '⚠️ En attente' : '📉 Partiel'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total: {contract.totalAmount.toLocaleString()} DH
                    </span>
                    <span className="font-semibold text-orange-600">
                      Reste: {contract.remainingAmount.toLocaleString()} DH
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Fixed Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
            Charges Fixes à Venir
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune charge fixe prévue
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingExpenses.map((expense) => (
                <div key={expense.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{expense.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(expense.date), 'dd/MM/yyyy', { locale: fr })}
                      </p>
                    </div>
                    <Badge variant="outline" className={
                      expense.daysUntil < 0 
                        ? 'bg-red-100 text-red-800' 
                        : expense.daysUntil <= 7 
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                    }>
                      {expense.daysUntil < 0 
                        ? `${Math.abs(expense.daysUntil)}j passé` 
                        : expense.daysUntil === 0 
                          ? 'Aujourd\'hui'
                          : `Dans ${expense.daysUntil}j`}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="font-semibold text-red-600">
                      {expense.amount.toLocaleString()} DH
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
