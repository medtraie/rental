import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, CreditCard, Coins, Banknote, FileText, CheckCircle, Clock, Send, Building2, History } from "lucide-react";
import { Link } from "react-router-dom";
import { useContracts } from "@/hooks/useContracts";
import { useMiscellaneousExpenses } from "@/hooks/useMiscellaneousExpenses";
import { getContractFinancialStatus, getContractFinancialStatusWithPayments, recalculateContractFinancials } from "@/utils/contractFinancialStatus";
import type { Contract } from "@/services/localStorageService";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, differenceInDays, isValid, isAfter, isBefore, type Interval } from "date-fns";
import { fr } from "date-fns/locale";
import { computeContractSummary, getContractSummaryWithPayments, migrateAllContracts } from "@/utils/contractMath";
import { BankTransferDialog } from "@/components/BankTransferDialog";
import { ReportFilters, type TimeFilter } from "@/components/ReportFilters";
import { PDFExportButton } from "@/components/PDFExportButton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { PaymentDialog, type PaymentData } from "@/components/PaymentDialog";
import { ContractMigrationButton } from "@/components/ContractMigrationButton";
import MiscellaneousExpenseDialog from "@/components/MiscellaneousExpenseDialog";
import MiscellaneousExpenseTable from "@/components/MiscellaneousExpenseTable";
import MiscellaneousExpenseChart from "@/components/MiscellaneousExpenseChart";
import type { Payment, PaymentSummary } from "@/types/payment";
import { PaymentHistoryDialog } from "@/components/PaymentHistoryDialog";
import { SettledContractsDialog } from "@/components/SettledContractsDialog";
import { localStorageService } from "@/services/localStorageService";
import { useExpenses } from "@/hooks/useExpenses";
import { useVehicles } from "@/hooks/useVehicles";

interface BankTransfer {
  id: string;
  date: string;
  type: 'cash' | 'check' | 'bank_to_cash';
  amount: number;
  fees: number;
  netAmount: number;
  reference?: string;
  clientName?: string;
  contractNumber?: string;
  createdAt: string;
}

const Recette = () => {
  const { contracts: allContracts, updateContract, refetch } = useContracts();
  const { expenses: miscellaneousExpenses, loading: expensesLoading } = useMiscellaneousExpenses();
  const { toast } = useToast();

  // Vehicle expenses
  const { monthlyExpenses } = useExpenses();
  const { vehicles } = useVehicles();
  
  // State for filters and charts visibility
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPieChart, setShowPieChart] = useState(true);
  
  // Financial analysis filters
  const [tenantFilter, setTenantFilter] = useState('');
  const [contractNumberFilter, setContractNumberFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showBarChart, setShowBarChart] = useState(true);
  const [showLineChart, setShowLineChart] = useState(true);
  
  // Freeze states for charts
  const [freezePieChart, setFreezePieChart] = useState(false);
  const [freezeBarChart, setFreezeBarChart] = useState(false);
  const [freezeCash, setFreezeCash] = useState(false);
  const [freezeChecks, setFreezeChecks] = useState(false);
  
  // Frozen data storage
  const [frozenPieData, setFrozenPieData] = useState<any[]>([]);
  const [frozenBarData, setFrozenBarData] = useState<any[]>([]);
  const [frozenCashAmount, setFrozenCashAmount] = useState(0);
  const [frozenChecksAmount, setFrozenChecksAmount] = useState(0);
  
  // Bank transfers and balance
  const [bankTransfers, setBankTransfers] = useLocalStorage<BankTransfer[]>("bankTransfers", []);
  const [bankBalance, setBankBalance] = useLocalStorage<number>("bankBalance", 0);
  
  // Payments tracking
  const [payments, setPayments] = useLocalStorage<Payment[]>("payments", []);
  const [cashBalance, setCashBalance] = useLocalStorage<number>("cashBalance", 0);
  const [bankAccount, setBankAccount] = useLocalStorage<number>("bankAccount", 0);

  // Force refresh data when component mounts
  useEffect(() => {
    console.log("[Recette] Component mounted, fetching contract data...");
    refetch();
  }, [refetch]);

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Actualisé",
      description: "Les données ont été actualisées",
      variant: "default"
    });
  };

  // Use centralized function for contract payment summary
  const getContractPaymentSummary = (contractId: string): PaymentSummary => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) {
      return {
        totalPaid: 0,
        remainingAmount: 0,
        isFullyPaid: false,
        payments: []
      };
    }

    // Get contract summary with advance payment from the contract
    const contractSummary = computeContractSummary(contract, { advanceMode: 'field' });
    
    // Get additional payments for this contract
    const contractPayments = payments.filter(p => p.contractId === contractId);
    const additionalPayments = contractPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Total paid = advance payment + additional payments
    const totalPaid = contractSummary.avance + additionalPayments;
    const remainingAmount = Math.max(0, contractSummary.total - totalPaid);
    
    return {
      totalPaid,
      remainingAmount,
      isFullyPaid: remainingAmount <= 0,
      payments: contractPayments
    };
  };

  // Filter contracts based on time filter
  const filteredContracts: Contract[] = useMemo(() => {
    console.log("[Recette] Processing contracts:", allContracts?.length || 0);
    const processed = allContracts?.map(c => {
      const contractWithAmount = {...c, total_amount: Number(c.total_amount)};
      const updatedContract = recalculateContractFinancials(contractWithAmount);
      
      const financialStatus = getContractFinancialStatus(updatedContract);
      
      // Use the contract's advance_payment as-is without any auto-calculation
      if (updatedContract.advance_payment === undefined || updatedContract.advance_payment === null) {
        // If no advance is set, log a warning but don't auto-calculate
        console.log(`[⚠️ CONTRACT] No advance_payment set for contract ${updatedContract.contract_number || updatedContract.id} - keeping as null/undefined`);
        updatedContract.advance_payment = 0; // Set to 0 instead of auto-calculating
      } else {
        console.log(`[✅ CONTRACT] Using stored advance_payment: ${updatedContract.advance_payment} MAD`);
      }
      
      return updatedContract;
    }) || [];

    // Apply time filter
    const filterDate = new Date(selectedDate);
    let interval: Interval;

    switch (timeFilter) {
      case 'day':
        interval = { start: startOfDay(filterDate), end: endOfDay(filterDate) };
        break;
      case 'month':
        interval = { start: startOfMonth(filterDate), end: endOfMonth(filterDate) };
        break;
      case 'year':
        interval = { start: startOfYear(filterDate), end: endOfYear(filterDate) };
        break;
      default:
        return processed;
    }

    return processed.filter(contract => {
      if (!contract.start_date) return false;
      const contractDate = parseISO(contract.start_date);
      return isWithinInterval(contractDate, interval);
    });
  }, [allContracts, timeFilter, selectedDate]);

  const contracts = filteredContracts;

  // Filter contracts for analytics based on financial analysis filters
  const analyticsFilteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      // Apply tenant filter
      if (tenantFilter && !contract.customer_name.toLowerCase().includes(tenantFilter.toLowerCase())) {
        return false;
      }
      
      // Apply contract number filter
      if (contractNumberFilter && !contract.contract_number.toLowerCase().includes(contractNumberFilter.toLowerCase())) {
        return false;
      }
      
      // Apply date filter
      if (dateFilter) {
        const contractDate = contract.start_date;
        if (!contractDate || contractDate !== dateFilter) {
          return false;
        }
      }
      
      return true;
    });
  }, [contracts, tenantFilter, contractNumberFilter, dateFilter]);

  // Run migration when contracts are loaded
  useEffect(() => {
    if (allContracts.length > 0) {
      const migrationDone = localStorage.getItem('contractMath_migration_done');
      if (!migrationDone) {
        console.log('[Recette] Running automatic contract migration...');
        migrateAllContracts();
        localStorage.setItem('contractMath_migration_done', 'true');
      }
    }
  }, [allContracts.length]);

  // Handle bank transfers
  const handleBankTransfer = (transfer: BankTransfer) => {
    setBankTransfers(prev => [...prev, transfer]);

    if (transfer.type === 'cash') {
      // Espèces -> Banque
      setCashBalance(prev => Math.max(0, prev - transfer.amount));
      setBankBalance(prev => prev + transfer.netAmount);
    } else if (transfer.type === 'check') {
      // Chèque -> Banque
      setBankBalance(prev => prev + transfer.netAmount);
    } else if (transfer.type === 'bank_to_cash') {
      // Banque -> Espèces
      setBankBalance(prev => Math.max(0, prev - transfer.amount));
      setCashBalance(prev => prev + transfer.netAmount);
    }
  };

  // Handle bank transfer deletion
  const handleDeleteBankTransfer = (transferId: string) => {
    const transfer = bankTransfers.find(t => t.id === transferId);
    if (!transfer) return;

    setBankTransfers(prev => prev.filter(t => t.id !== transferId));

    if (transfer.type === 'cash') {
      // Undo Espèces -> Banque
      setCashBalance(prev => prev + transfer.amount);
      setBankBalance(prev => Math.max(0, prev - transfer.netAmount));
    } else if (transfer.type === 'check') {
      // Undo Chèque -> Banque
      setBankBalance(prev => Math.max(0, prev - transfer.netAmount));
    } else if (transfer.type === 'bank_to_cash') {
      // Undo Banque -> Espèces
      setBankBalance(prev => prev + transfer.amount);
      setCashBalance(prev => Math.max(0, prev - transfer.netAmount));
    }

    toast({
      title: "Transfert supprimé",
      description: `Le transfert de ${transfer.amount.toLocaleString()} MAD a été supprimé`,
      variant: "default"
    });
  };

  // Calculate statistics including miscellaneous expenses deductions
  const stats = useMemo(() => {
    let totalEncaisse = 0;
    let totalDettes = 0;
    let totalSolde = 0;
    let totalEspeces = 0;
    let totalCheques = 0;
    let totalVirements = 0;
    let totalDivers = 0;

    contracts.forEach(contract => {
      const total = contract.total_amount || 0;
      const advance = contract.advance_payment || 0;
      
      console.log(`[💰 DEBUG RECETTE] Contract ${contract.contract_number || contract.id}:`);
      console.log(`- Total: ${total} MAD`);
      console.log(`- Advance Payment (stored): ${advance} MAD`);
      console.log(`- Daily Rate: ${contract.daily_rate} MAD`);
      
      const paymentSummary = getContractPaymentSummary(contract.id);
      
      totalEncaisse += paymentSummary.totalPaid;
      
      if (paymentSummary.isFullyPaid) {
        totalSolde += total;
      } else if (paymentSummary.remainingAmount > 0) {
        totalDettes += paymentSummary.remainingAmount;
      }

      // Note: Do NOT add advance here - it's already counted in payments array below
    });

    // Calculate payments from payments array ONLY (single source of truth)
    payments.forEach(payment => {
      if (payment.paymentMethod === 'Espèces') {
        totalEspeces += payment.amount;
      } else if (payment.paymentMethod === 'Virement') {
        totalVirements += payment.amount;
      } else if (payment.paymentMethod === 'Chèque') {
        totalCheques += payment.amount;
      }
    });

    // Calculate miscellaneous expenses by payment method
    let diversEspeces = 0;
    let diversVirements = 0;
    let diversCheques = 0;

    miscellaneousExpenses.forEach(expense => {
      totalDivers += expense.amount;
      switch (expense.payment_method) {
        case 'Espèces':
          diversEspeces += expense.amount;
          break;
        case 'Virement':
          diversVirements += expense.amount;
          break;
        case 'Chèque':
          diversCheques += expense.amount;
          break;
      }
    });

    // Deduct miscellaneous expenses from totals
    // Note: cashBalance and bankAccount are INITIAL balances only, payments are already counted above
    totalEspeces = totalEspeces - diversEspeces;
    totalVirements = totalVirements - diversVirements;
    totalCheques = totalCheques - diversCheques;

    // NEW: Deduct repair payments from totals by payment method
    const repairPayments = localStorageService.getAll<any>('repairPayments');
    let repairsEspeces = 0;
    let repairsVirements = 0;
    let repairsCheques = 0;
    repairPayments.forEach((p: any) => {
      if (p.paymentMethod === 'Espèces') repairsEspeces += p.amount;
      else if (p.paymentMethod === 'Virement') repairsVirements += p.amount;
      else if (p.paymentMethod === 'Chèque') repairsCheques += p.amount;
    });
    totalEspeces -= repairsEspeces;
    totalVirements -= repairsVirements;
    totalCheques -= repairsCheques;

    // Apply bank transfers effect to payment method totals
    bankTransfers.forEach(transfer => {
      if (transfer.type === 'cash') {
        // Espèces -> Banque: espèces diminuent
        totalEspeces -= transfer.amount;
      } else if (transfer.type === 'check') {
        // Chèque -> Banque: chèques diminuent
        totalCheques -= transfer.amount;
      } else if (transfer.type === 'bank_to_cash') {
        // Banque -> Espèces: espèces augmentent du net (montant - frais)
        totalEspeces += (transfer.amount - transfer.fees);
      }
    });

    // Compute Compte Banque = Virements + transferts entrants - transferts sortants
    const bankTransfersIn = bankTransfers.reduce((sum, t) =>
      (t.type === 'cash' || t.type === 'check') ? sum + t.netAmount : sum, 0
    );
    const bankTransfersOut = bankTransfers.reduce((sum, t) =>
      (t.type === 'bank_to_cash') ? sum + t.amount : sum, 0
    );
    const computedBankBalance = Math.max(0, totalVirements + bankTransfersIn - bankTransfersOut);

    console.log(`[💰 RECETTE TOTALS] Espèces: ${totalEspeces} MAD (diversEspeces: ${diversEspeces})`);
    console.log(`[💰 RECETTE TOTALS] Virements: ${totalVirements} MAD (diversVirements: ${diversVirements})`);
    console.log(`[💰 RECETTE TOTALS] Chèques: ${totalCheques} MAD (diversCheques: ${diversCheques})`);
    console.log(`[💰 RECETTE TOTALS] Total Encaissé: ${totalEncaisse} MAD`);
    console.log(`[💰 RECETTE TOTALS] Dettes Restantes: ${totalDettes} MAD`);

    // NEW: Total vehicle monthly expenses for selected month (Dépenses Véhicules)
    const currentMonthKey = selectedDate.slice(0, 7); // 'YYYY-MM'
    const totalVehiculeExpenses = (monthlyExpenses || [])
      .filter((e) => e.month_year === currentMonthKey)
      .reduce((sum, e) => sum + Number(e.allocated_amount || 0), 0);

    return {
      totalEncaisse,
      totalDettes,
      totalSolde,
      totalEspeces: Math.max(0, totalEspeces),
      totalCheques: Math.max(0, totalCheques),
      totalVirements: Math.max(0, totalVirements),
      bankBalance: computedBankBalance, // Compte Banque
      totalDivers,
      // NEW
      totalVehiculeExpenses
    };
  }, [contracts, payments, cashBalance, bankAccount, bankTransfers, bankBalance, miscellaneousExpenses, monthlyExpenses, selectedDate]);

  // Calculate analytics statistics using filtered contracts for financial analysis
  const analyticsStats = useMemo(() => {
    let totalEncaisse = 0;
    let totalDettes = 0;
    let totalSolde = 0;
    let totalEspeces = 0;
    let totalCheques = 0;
    let totalVirements = 0;

    analyticsFilteredContracts.forEach(contract => {
      const total = contract.total_amount || 0;
      const advance = contract.advance_payment || 0;
      
      const paymentSummary = getContractPaymentSummary(contract.id);
      
      totalEncaisse += paymentSummary.totalPaid;
      
      if (paymentSummary.isFullyPaid) {
        totalSolde += total;
      } else if (paymentSummary.remainingAmount > 0) {
        totalDettes += paymentSummary.remainingAmount;
      }

      if (advance > 0) {
        const paymentMethod = contract.payment_method;
        if (paymentMethod === 'Espèces') {
          totalEspeces += advance;
        } else if (paymentMethod === 'Chèque') {
          totalCheques += advance;
        } else if (paymentMethod === 'Virement') {
          totalVirements += advance;
        }
      }
    });

    // Add filtered payments
    payments.filter(payment => 
      analyticsFilteredContracts.some(contract => contract.id === payment.contractId)
    ).forEach(payment => {
      if (payment.paymentMethod === 'Espèces') {
        totalEspeces += payment.amount;
      } else if (payment.paymentMethod === 'Virement') {
        totalVirements += payment.amount;
      } else if (payment.paymentMethod === 'Chèque') {
        totalCheques += payment.amount;
      }
    });

    return {
      totalEncaisse: Math.max(0, totalEncaisse),
      totalDettes: Math.max(0, totalDettes),
      totalSolde: Math.max(0, totalSolde),
      totalEspeces: Math.max(0, totalEspeces),
      totalCheques: Math.max(0, totalCheques),
      totalVirements: Math.max(0, totalVirements)
    };
  }, [analyticsFilteredContracts, payments]);

  // Data for pie chart (répartition des paiements)
  const pieChartData = useMemo(() => {
    const currentData = [
      { name: "Espèces", value: analyticsStats.totalEspeces, color: "#10b981" },
      { name: "Chèques", value: analyticsStats.totalCheques, color: "#3b82f6" },
      { name: "Virements", value: analyticsStats.totalVirements, color: "#f59e0b" }
    ].filter(item => item.value > 0);
    
    // Store frozen data when chart gets frozen
    if (freezePieChart && frozenPieData.length === 0) {
      setFrozenPieData(currentData);
      return currentData;
    }
    
    return freezePieChart ? frozenPieData : currentData;
  }, [analyticsStats, freezePieChart, frozenPieData]);

  // Data for bar chart (montants par mode de paiement)
  const barChartData = useMemo(() => {
    const currentData = [
      { mode: "Espèces", montant: analyticsStats.totalEspeces },
      { mode: "Chèques", montant: analyticsStats.totalCheques },
      { mode: "Virements", montant: analyticsStats.totalVirements }
    ];
    
    // Store frozen data when chart gets frozen
    if (freezeBarChart && frozenBarData.length === 0) {
      setFrozenBarData(currentData);
      return currentData;
    }
    
    return freezeBarChart ? frozenBarData : currentData;
  }, [analyticsStats, freezeBarChart, frozenBarData]);

  // Data for line chart (historique mensuel)
  const lineChartData = useMemo(() => {
    const months = [
      "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
      "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
    ];

    const data = months.map((month, index) => ({
      month,
      recettes: 0,
      dettes: 0,
      monthIndex: index
    }));

    analyticsFilteredContracts.forEach(contract => {
      if (contract.start_date) {
        try {
          const startDate = parseISO(contract.start_date);
          const monthIndex = startDate.getMonth();
          const year = startDate.getFullYear();
          const currentYear = new Date().getFullYear();
          
          if (year === currentYear) {
            const paymentSummary = getContractPaymentSummary(contract.id);
            
            data[monthIndex].recettes += paymentSummary.totalPaid;
            if (paymentSummary.remainingAmount > 0) {
              data[monthIndex].dettes += paymentSummary.remainingAmount;
            }
          }
        } catch (error) {
          console.error("Error parsing date:", contract.start_date);
        }
      }
    });

    return data;
  }, [analyticsFilteredContracts]);

  // Filter contracts in waiting and in progress (both open and closed with remaining amounts)  
  const contractsWithDebts = useMemo(() => {
    return contracts.filter(contract => {
      const paymentSummary = getContractPaymentSummary(contract.id);
      const financialStatus = getContractFinancialStatusWithPayments(contract, paymentSummary);
      
      // Include contracts that are either "En attente", "Prolongé", "Impayé" (open) or "En cours" (closed with debt)
      return paymentSummary.remainingAmount > 0 && 
             (financialStatus.status === 'en_attente' || 
              financialStatus.status === 'prolonger' || 
              financialStatus.status === 'impaye' || 
              financialStatus.status === 'en_cours');
    }).map(contract => {
      const paymentSummary = getContractPaymentSummary(contract.id);
      const financialStatus = getContractFinancialStatusWithPayments(contract, paymentSummary);
      const contractSummary = computeContractSummary(contract, { advanceMode: 'field' });
      const duration = contractSummary.duration;
      
      return {
        ...contract, // Keep original contract data including advance_payment and total_amount
        duration: duration,
        remaining_amount: paymentSummary.remainingAmount,
        total_paid: paymentSummary.totalPaid,
        financial_status: paymentSummary.isFullyPaid ? 
          { status: "paye", label: "Payé", color: "bg-green-100 text-green-800", description: "Contrat entièrement soldé" } :
          financialStatus,
        payment_summary: paymentSummary
      };
    }).sort((a, b) => b.remaining_amount - a.remaining_amount); // Sort by remaining amount descending
  }, [contracts, payments]);

  // Filter settled contracts (contracts with no remaining amount)
  const settledContracts = useMemo(() => {
    return contracts.filter(contract => {
      const paymentSummary = getContractPaymentSummary(contract.id);
      return paymentSummary.remainingAmount <= 0 && paymentSummary.totalPaid > 0;
    });
  }, [contracts, payments]);

  // Reset frozen data when unfreezing
  const handleFreezePieChart = (freeze: boolean) => {
    setFreezePieChart(freeze);
    if (!freeze) {
      setFrozenPieData([]);
    }
  };
  
  const handleFreezeBarChart = (freeze: boolean) => {
    setFreezeBarChart(freeze);
    if (!freeze) {
      setFrozenBarData([]);
    }
  };

  const handleFreezeCash = (freeze: boolean) => {
    if (freeze && !freezeCash) {
      setFrozenCashAmount(stats.totalEspeces);
    }
    setFreezeCash(freeze);
  };

  const handleFreezeChecks = (freeze: boolean) => {
    if (freeze && !freezeChecks) {
      setFrozenChecksAmount(stats.totalCheques);
    }
    setFreezeChecks(freeze);
  };

  // Handle delete functions
  const handleDeleteTotalEncaisse = () => {
    setPayments([]);
    setCashBalance(0);
    setBankAccount(0);
    toast({
      title: "Total Encaissé réinitialisé",
      description: "Tous les paiements ont été supprimés",
      variant: "default"
    });
  };

  const handleDeleteTotalEspeces = () => {
    setCashBalance(0);
    const updatedPayments = payments.filter(p => p.paymentMethod !== 'Espèces');
    setPayments(updatedPayments);
    toast({
      title: "Total Espèces supprimé",
      description: "Le solde espèces a été remis à zéro",
      variant: "default"
    });
  };

  const handleDeleteBankAccount = () => {
    setBankAccount(0);
    setBankBalance(0);
    const updatedPayments = payments.filter(p => p.paymentMethod !== 'Virement');
    setPayments(updatedPayments);
    toast({
      title: "Compte Banque supprimé",
      description: "Le solde banque a été remis à zéro",
      variant: "default"
    });
  };

  const handleDeleteTotalChecks = () => {
    const updatedPayments = payments.filter(p => p.paymentMethod !== 'Chèque');
    setPayments(updatedPayments);
    toast({
      title: "Total Chèques supprimé",
      description: "Tous les paiements par chèque ont été supprimés",
      variant: "default"
    });
  };

  const handleDeleteMiscExpenses = () => {
    // This would need to be implemented with the misc expenses hook
    toast({
      title: "Fonctionnalité à implémenter", 
      description: "La suppression des dépenses diverses sera disponible prochainement",
      variant: "default"
    });
  };

  const handleDeleteRemainingDebts = () => {
    // This would require updating all contracts to mark them as paid
    toast({
      title: "Fonctionnalité à implémenter",
      description: "La suppression des dettes restantes sera disponible prochainement",
      variant: "default"
    });
  };

  // Handle bank to cash transfer
  const handleBankToCashTransfer = (amount: number) => {
    if (amount > stats.bankBalance) {
      toast({
        title: "Solde insuffisant",
        description: "Le montant dépasse le solde bancaire disponible",
        variant: "destructive"
      });
      return;
    }

    setBankBalance(prev => prev - amount);
    setCashBalance(prev => prev + amount);
    
    toast({
      title: "Transfert effectué",
      description: `${amount.toLocaleString()} MAD transférés de la banque vers les espèces`,
      variant: "default"
    });
  };

  
  // Handle new payment
  const handlePayment = async (contractId: string, paymentData: PaymentData) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;

    // Create new payment record
    const newPayment: Payment = {
      id: crypto.randomUUID(),
      contractId,
      contractNumber: contract.contract_number,
      customerName: contract.customer_name,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      paymentDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      checkReference: paymentData.checkReference,
      checkName: paymentData.checkName,
      checkDepositDate: paymentData.checkDepositDate,
      checkDirection: paymentData.checkDirection,
      checkDepositStatus: paymentData.checkDepositStatus
    };

    // Update payments list
    const newPayments = [...payments, newPayment];
    setPayments(newPayments);

    console.log('[💰 RECETTE] Nouveau paiement enregistré:', newPayment);

    // Get updated payment summary after adding the new payment
    const contractPayments = newPayments.filter(p => p.contractId === contractId);
    const additionalPayments = contractPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const contractSummary = computeContractSummary(contract, { advanceMode: 'field' });
    const totalPaid = contractSummary.avance + additionalPayments;
    const newRemainingAmount = Math.max(0, contractSummary.total - totalPaid);
    
    if (newRemainingAmount <= 0) {
      // Mark contract as completed/paid
      await updateContract(contractId, {
        status: 'completed'
      });
      
      // Force refetch contracts to update the UI
      await refetch();
      
      toast({
        title: "✅ Contrat soldé",
        description: `Le contrat ${contract.contract_number} est maintenant entièrement payé`,
        variant: "default"
      });
    } else {
      // Force refetch contracts to update the UI
      await refetch();
      
      toast({
        title: "✅ Paiement enregistré",
        description: `Paiement de ${paymentData.amount.toLocaleString()} MAD enregistré. Reste: ${newRemainingAmount.toLocaleString()} MAD`,
        variant: "default"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Gestion des Recettes</h1>
              <p className="text-muted-foreground">Vue d'ensemble financière et gestion des paiements</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleRefresh}
                variant="outline"
                className="flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                Actualiser
              </Button>
              <ContractMigrationButton />
              <PDFExportButton
                type="revenue"
                data={{ stats, contractsWithDebts, pieChartData, barChartData, lineChartData, bankTransfers }}
                filename={`recettes-${timeFilter}-${selectedDate}.pdf`}
              />
              <BankTransferDialog
                totalCash={stats.totalEspeces}
                totalChecks={stats.totalCheques}
                bankBalance={stats.bankBalance}
                onTransfer={handleBankTransfer}
              >
                <Button className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Transfert Banque
                </Button>
              </BankTransferDialog>
              <Link to="/">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Retour à l'Accueil
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Report Filters */}
        <ReportFilters
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          showPieChart={showPieChart}
          onShowPieChartChange={setShowPieChart}
          showBarChart={showBarChart}
          onShowBarChartChange={setShowBarChart}
          showLineChart={showLineChart}
          onShowLineChartChange={setShowLineChart}
          freezePieChart={freezePieChart}
          onFreezePieChartChange={handleFreezePieChart}
          freezeBarChart={freezeBarChart}
          onFreezeBarChartChange={handleFreezeBarChart}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* Tableau récapitulatif avec dépenses diverses */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Encaissé</CardTitle>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDeleteTotalEncaisse}
                  className="text-red-500 hover:text-red-700 p-1 h-auto"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">
                {stats.totalEncaisse.toLocaleString()} MAD
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Espèces</CardTitle>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-green-600" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDeleteTotalEspeces}
                  className="text-red-500 hover:text-red-700 p-1 h-auto"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">
                {(freezeCash ? frozenCashAmount : stats.totalEspeces).toLocaleString()} MAD
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleFreezeCash(!freezeCash)}
                className="mt-1"
              >
                {freezeCash ? '🔒 Figé' : '🔓 Actuel'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compte Banque</CardTitle>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDeleteBankAccount}
                  className="text-red-500 hover:text-red-700 p-1 h-auto"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-blue-600">
                {stats.bankBalance.toLocaleString()} MAD
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chèques</CardTitle>
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-yellow-600" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDeleteTotalChecks}
                  className="text-red-500 hover:text-red-700 p-1 h-auto"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-yellow-600">
                {(freezeChecks ? frozenChecksAmount : stats.totalCheques).toLocaleString()} MAD
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleFreezeChecks(!freezeChecks)}
                className="mt-1"
              >
                {freezeChecks ? '🔒 Figé' : '🔓 Actuel'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dépenses Diverses</CardTitle>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-red-600" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDeleteMiscExpenses}
                  className="text-red-500 hover:text-red-700 p-1 h-auto"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-600">
                -{stats.totalDivers.toLocaleString()} MAD
              </div>
            </CardContent>
          </Card>

          {/* NEW: Vehicle Expenses card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dépenses Véhicules</CardTitle>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-600">
                -{(stats.totalVehiculeExpenses || 0).toLocaleString()} MAD
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dettes Restantes</CardTitle>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-600" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDeleteRemainingDebts}
                  className="text-red-500 hover:text-red-700 p-1 h-auto"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-600">
                {stats.totalDettes.toLocaleString()} MAD
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interface avec onglets pour contrats et dépenses diverses */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics">📊 Analyses & Graphiques</TabsTrigger>
            <TabsTrigger value="contracts">💰 Contrats & Paiements</TabsTrigger>
            <TabsTrigger value="expenses">📋 Dépenses Diverses</TabsTrigger>
            <TabsTrigger value="vehicle_expenses">🚗 Dépenses Véhicules</TabsTrigger>
          </TabsList>
          
          <TabsContent value="contracts" className="space-y-6">
            {/* Liste des contrats avec dettes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Contrats en Attente et en cours de Paiement</CardTitle>
                 <div className="flex items-center gap-2">
                   <Button variant="outline" size="sm">
                     <History className="w-4 h-4 mr-2" />
                     Historique Soldés (0)
                   </Button>
                 </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Contrat</th>
                          <th className="text-left p-2">Locataire</th>
                          <th className="text-left p-2">Prix/Jour</th>
                          <th className="text-left p-2">Durée</th>
                          <th className="text-left p-2">Total</th>
                          <th className="text-left p-2">Avance</th>
                          <th className="text-left p-2">Reste à Payer</th>
                          <th className="text-left p-2">Statut</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contractsWithDebts.map((contract) => {
                          const startDate = contract.start_date ? parseISO(contract.start_date) : null;
                          const endDate = contract.end_date ? parseISO(contract.end_date) : null;
                          
                          console.log('[DEBUG] Calling getContractSummaryWithPayments for contract:', contract.id);
                          const summary = getContractSummaryWithPayments(contract.id, contracts);
                          console.log('[DEBUG] Summary result:', summary);
                          const duration = summary?.duration || 0;

                          return (
                            <tr key={contract.id} className="border-b hover:bg-accent/50">
                              <td className="p-2 font-medium">
                                <div className="flex flex-col">
                                  <span>{contract.contract_number}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {startDate ? format(startDate, 'dd/MM/yyyy', { locale: fr }) : 'N/A'} - {endDate ? format(endDate, 'dd/MM/yyyy', { locale: fr }) : 'N/A'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-2">{contract.customer_name}</td>
                              <td className="p-2">{(contract.daily_rate || 0).toLocaleString()} MAD</td>
                              <td className="p-2">{duration} jours</td>
                              <td className="p-2 font-semibold">{(summary?.total || 0).toLocaleString()} MAD</td>
                              <td className="p-2 text-green-600">{(summary?.avance || 0).toLocaleString()} MAD</td>
                              <td className="p-2 text-red-600 font-semibold">
                                {(summary?.reste || 0).toLocaleString()} MAD
                              </td>
                              <td className="p-2">
                                <Badge className={contract.financial_status.color}>
                                  {contract.financial_status.label}
                                </Badge>
                                <div className="text-xs text-gray-500 mt-1">
                                  {contract.financial_status.description}
                                </div>
                              </td>
                               <td className="p-2">
                                 <div className="flex items-center gap-2">
                                   {contract.remaining_amount > 0 ? (
                                     <PaymentDialog
                                       contractId={contract.id}
                                       contractNumber={contract.contract_number}
                                       customerName={contract.customer_name}
                                       remainingAmount={contract.remaining_amount}
                                       onPayment={handlePayment}
                                     >
                                       <Button
                                         size="sm"
                                         className="bg-green-600 hover:bg-green-700 text-white"
                                       >
                                         <CheckCircle className="w-4 h-4 mr-1" />
                                         Régler
                                       </Button>
                                     </PaymentDialog>
                                   ) : (
                                     <Badge className="bg-green-100 text-green-800">
                                       Soldé
                                     </Badge>
                                   )}
                                     
                                      <PaymentHistoryDialog
                                        contractId={contract.id}
                                        contractNumber={contract.contract_number}
                                        customerName={contract.customer_name}
                                        payments={payments}
                                        totalAmount={summary?.total || contract.total_amount}
                                        totalPaid={summary?.avance || 0}
                                        remainingAmount={summary?.reste || contract.remaining_amount}
                                      >
                                        <Button variant="outline" size="sm">
                                          👁️ Détails
                                        </Button>
                                      </PaymentHistoryDialog>
                                 </div>
                               </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    {contractsWithDebts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Aucun contrat en attente ou en cours de paiement
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                {/* Bank Transfer Action */}
                <div className="mt-4 pt-4 border-t flex justify-center">
                  <BankTransferDialog
                    totalCash={stats.totalEspeces}
                    totalChecks={stats.totalCheques}
                    bankBalance={stats.bankBalance}
                    onTransfer={handleBankTransfer}
                  >
                    <Button className="flex items-center gap-2" size="lg">
                      <Send className="w-4 h-4" />
                      Transfert Banque
                    </Button>
                  </BankTransferDialog>
                </div>
                
                {/* Settled Contracts History Button */}
                <div className="mt-4 pt-4 border-t flex justify-center">
                  <SettledContractsDialog
                    settledContracts={settledContracts}
                    payments={payments}
                  >
                    <Button variant="outline" className="flex items-center gap-2" size="lg">
                      <History className="w-4 h-4" />
                      Historique Soldé ({settledContracts.length})
                    </Button>
                  </SettledContractsDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Gestion des Dépenses Diverses</h3>
                <p className="text-sm text-gray-600">Gérez vos charges et dépenses opérationnelles</p>
              </div>
              <MiscellaneousExpenseDialog />
            </div>
            
            {expensesLoading ? (
              <div className="text-center py-8">Chargement des dépenses...</div>
            ) : (
              <MiscellaneousExpenseTable expenses={miscellaneousExpenses} />
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="bg-card p-6 rounded-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Analyses Financières & Graphiques</h2>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPieChart(!showPieChart)}
                  >
                    {showPieChart ? '🥧 Masquer Pie Chart' : '🥧 Pie Chart'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowBarChart(!showBarChart)}
                  >
                    {showBarChart ? '📊 Masquer Bar Chart' : '📊 Bar Chart'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowLineChart(!showLineChart)}
                  >
                    {showLineChart ? '📈 Masquer Line Chart' : '📈 Line Chart'}
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-muted p-4 rounded-lg mb-6">
                <h3 className="text-lg font-medium mb-4">Filtres</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Locataire</label>
                    <input
                      type="text"
                      placeholder="Nom du locataire..."
                      value={tenantFilter}
                      onChange={(e) => setTenantFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">N° Contrat</label>
                    <input
                      type="text"
                      placeholder="Numéro de contrat..."
                      value={contractNumberFilter}
                      onChange={(e) => setContractNumberFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Date</label>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid gap-6">
                {/* Charts - Graphiques de répartition */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Pie Chart - Répartition par mode de paiement */}
                  {showPieChart && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Répartition par Mode de Paiement
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowPieChart(false)}
                            className="text-red-500 hover:text-red-700"
                          >
                            👁️‍🗨️ Masquer
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleFreezePieChart(!freezePieChart)}
                          >
                            {freezePieChart ? '🔒 Figé' : '🔓 Actuel'}
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value.toLocaleString()} MAD`}
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `${value.toLocaleString()} MAD`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!showPieChart && (
                  <Card className="border-dashed">
                    <CardContent className="flex items-center justify-center py-12">
                      <Button
                        variant="outline"
                        onClick={() => setShowPieChart(true)}
                        className="flex items-center gap-2"
                      >
                        👁️ Afficher Pie Chart
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Bar Chart - Montants par mode de paiement */}
                {showBarChart && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Montants par Mode de Paiement
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowBarChart(false)}
                            className="text-red-500 hover:text-red-700"
                          >
                            👁️‍🗨️ Masquer
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleFreezeBarChart(!freezeBarChart)}
                          >
                            {freezeBarChart ? '🔒 Figé' : '🔓 Actuel'}
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mode" />
                            <YAxis tickFormatter={(value) => `${value} MAD`} />
                            <Tooltip formatter={(value: number) => `${value.toLocaleString()} MAD`} />
                            <Bar dataKey="montant" fill="#10b981" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!showBarChart && (
                  <Card className="border-dashed">
                    <CardContent className="flex items-center justify-center py-12">
                      <Button
                        variant="outline"
                        onClick={() => setShowBarChart(true)}
                        className="flex items-center gap-2"
                      >
                        👁️ Afficher Bar Chart
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Line Chart - Historique mensuel */}
              {showLineChart && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Historique Mensuel - Recettes vs Dettes
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowLineChart(false)}
                        className="text-red-500 hover:text-red-700"
                      >
                        👁️‍🗨️ Masquer
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lineChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(value) => `${value} MAD`} />
                          <Tooltip formatter={(value: number) => `${value.toLocaleString()} MAD`} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="recettes" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            name="Recettes Encaissées"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="dettes" 
                            stroke="#ef4444" 
                            strokeWidth={2}
                            name="Dettes en Cours"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dépenses diverses analytics */}
              {!expensesLoading && miscellaneousExpenses.length > 0 && (
                <MiscellaneousExpenseChart expenses={miscellaneousExpenses} />
              )}
              
              {miscellaneousExpenses.length === 0 && !expensesLoading && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500 mb-4">Aucune dépense diverse pour afficher les analyses</p>
                    <MiscellaneousExpenseDialog trigger={
                      <Button>Ajouter votre première dépense</Button>
                    } />
                  </CardContent>
                </Card>
              )}
              </div>
            </div>
          </TabsContent>

          {/* NEW: Vehicle expenses tab */}
          <TabsContent value="vehicle_expenses" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Dépenses Véhicules (mensuelles)</h3>
                <p className="text-sm text-gray-600">Répartition mensuelle par véhicule pour {selectedDate.slice(0,7)}</p>
              </div>
              <Link to="/depenses">
                <Button variant="outline" size="sm">Ouvrir Gestion des Dépenses</Button>
              </Link>
            </div>

            <ScrollArea className="h-[500px]">
              {(() => {
                const monthKey = selectedDate.slice(0,7);
                const map: Record<string, string> = Object.fromEntries(
                  (vehicles || []).map(v => [
                    (v as any).id, `${(v as any).marque || (v as any).brand || ''} ${(v as any).modele || (v as any).model || ''} ${(v as any).annee || (v as any).year || ''}`.trim()
                  ])
                );
                const data = (monthlyExpenses || []).filter(e => e.month_year === monthKey);

                if (data.length === 0) {
                  return <div className="text-center py-8 text-gray-500">Aucune dépense véhicule pour ce mois</div>;
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Véhicule</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Montant</th>
                          <th className="text-left p-2">Mois</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((e) => (
                          <tr key={(e as any).id} className="border-b hover:bg-accent/50">
                            <td className="p-2">{map[(e as any).vehicle_id] || (e as any).vehicle_id}</td>
                            <td className="p-2">{(e as any).expense_type}</td>
                            <td className="p-2 text-red-600">-{Number((e as any).allocated_amount || 0).toLocaleString()} MAD</td>
                            <td className="p-2">{(e as any).month_year}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Recette;