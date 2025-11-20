import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Calendar, DollarSign, TrendingUp, Car } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import MetricsSection from "@/features/reports/MetricsSection";
import VehiclePlanningSection from "@/features/reports/VehiclePlanningSection";
import AllVehiclesSection from "@/features/reports/AllVehiclesSection";
import RevenueSection from "@/features/reports/RevenueSection";
import TenantSection from "@/features/reports/TenantSection";
import VehicleComparisonSection from "@/features/reports/VehicleComparisonSection";
import MonthlyRevenueSection from "@/features/reports/MonthlyRevenueSection";
import { useVehicles } from "@/hooks/useVehicles";
import { useContracts } from "@/hooks/useContracts";
import { useExpenses } from "@/hooks/useExpenses";
import { computeContractSummary } from "@/utils/contractMath";
import type { Contract as RevenueChartContract } from "@/components/RevenueChart";
import type { Contract as ServiceContract } from "@/services/localStorageService";

interface Contract {
  id: string;
  customer_name?: string;
  vehicle?: string;
  start_date?: string;
  end_date?: string;
  daily_rate?: number;
  total_amount?: number;
  status?: 'ouvert' | 'ferme' | 'draft' | 'sent' | 'signed' | 'completed' | 'cancelled';
  vehicleId?: string;
  nombreDeJour?: number;
  prolongationAu?: string;
  nombreDeJourProlonge?: number;
  // For compatibility
  customerName?: string;
}

interface Vehicle {
  id: string;
  marque: string;
  modele: string;
  immatriculation: string;
  annee?: number;
  etat_vehicule?: string;
}

interface FilterState {
  periode: { start: string; end: string };
  vehicleId: string;
  tenantName: string;
  contractStatus: string;
  vehicleStatus: string;
  expenseType: string;
}

const Reports = () => {
  const { contracts: allContracts, refetch: refetchContracts } = useContracts();
  const { vehicles: allVehicles, refetch: refetchVehicles } = useVehicles();
  const { expenses: allExpenses } = useExpenses();

  // Force refresh data when component mounts and every 30 seconds
  useEffect(() => {
    console.log("[Reports] Component mounted, fetching contract data...");
    refetchContracts();
    
    // Set up periodic refresh for real-time data sync
    const interval = setInterval(() => {
      console.log("[Reports] Auto-refreshing contract data for financial status sync...");
      refetchContracts();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [refetchContracts]);

  const contracts: Contract[] = useMemo(() => {
    console.log("[Reports] Processing contracts:", allContracts?.length || 0);
    return allContracts?.map(c => {
      const contractWithAmount = {...c, total_amount: Number(c.total_amount)};
      // Use centralized calculation logic
      const summary = computeContractSummary(contractWithAmount, { advanceMode: 'field' });
      const updatedContract = { ...contractWithAmount, total_amount: summary.total };
      
      // Enhanced logging for troubleshooting extension amounts
      const hasExtension = updatedContract.contract_data?.extensionAmount > 0;
      const hasOverdue = updatedContract.contract_data?.overdueAmount > 0;
      
      console.log("[Reports] Contract", c.contract_number, 
        "- Original amount:", c.total_amount,
        "- Updated amount:", updatedContract.total_amount,
        "- Summary:", summary);
      
      return {
        ...updatedContract,
        contractNumber: updatedContract.contract_number,
        vehicleName: updatedContract.vehicle,
        startDate: updatedContract.start_date,
        endDate: updatedContract.end_date,
        totalAmount: summary.total,
      };
    }) || [];
  }, [allContracts]);
  
  const vehicles: Vehicle[] = useMemo(() =>
    (allVehicles || [])
      .filter(v => v.marque && v.modele && v.immatriculation)
      .map(v => ({
        ...v,
        marque: v.marque!,
        modele: v.modele!,
        immatriculation: v.immatriculation!,
      }))
  , [allVehicles]);

  const [filters, setFilters] = useState<FilterState>({
    periode: { start: "", end: "" },
    vehicleId: "all",
    tenantName: "",
    contractStatus: "",
    vehicleStatus: "",
    expenseType: ""
  });

  // Calculate statistics with financial status
  const stats = useMemo(() => {
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === "signed").length;
    const completedContracts = contracts.filter(c => c.status === "completed").length;
    const upcomingContracts = contracts.filter(c => c.status === "draft" || c.status === "sent").length;

    // Calculate contracts by financial status
    const overdueContracts = contracts.filter(c => {
      const summary = computeContractSummary(c as ServiceContract, { advanceMode: 'field' });
      return c.status === 'ouvert' && summary.overdueDays > 0;
    }).length;

    const extendedContracts = contracts.filter(c => {
      const summary = computeContractSummary(c as ServiceContract, { advanceMode: 'field' });
      return summary.extensionDays > 0;
    }).length;

    const paidContracts = contracts.filter(c => {
      const summary = computeContractSummary(c as ServiceContract, { advanceMode: 'field' });
      return summary.statut === 'payé';
    }).length;

    const pendingContracts = contracts.filter(c => {
      const summary = computeContractSummary(c as ServiceContract, { advanceMode: 'field' });
      return summary.statut === 'en attente';
    }).length;

    const totalRevenue = contracts.reduce((sum, contract) => {
      return sum + (contract.total_amount || 0);
    }, 0);

    const totalExpenses = (allExpenses || []).reduce((sum, expense) => sum + expense.total_cost, 0);

    const totalDaysRented = contracts.reduce((sum, contract) => {
      if (!contract.start_date || !contract.end_date) return sum;
      const start = new Date(contract.start_date);
      const end = new Date(contract.end_date);
      const diffInMs = end.getTime() - start.getTime();
      if (diffInMs < 0) return sum;
      const days = Math.ceil(diffInMs / (1000 * 60 * 60 * 24)) + 1;
      
      // Add overdue days for unpaid contracts
      const summary = computeContractSummary(contract as ServiceContract, { advanceMode: 'field' });
      return sum + days + summary.overdueDays;
    }, 0);

    // Calculate overdue revenue
    const overdueRevenue = contracts.reduce((sum, contract) => {
      const summary = computeContractSummary(contract as ServiceContract, { advanceMode: 'field' });
      const dailyRate = contract.daily_rate || 0;
      return sum + (summary.overdueDays * dailyRate);
    }, 0);

    return {
      totalContracts,
      activeContracts,
      completedContracts,
      upcomingContracts,
      overdueContracts,
      extendedContracts,
      paidContracts,
      pendingContracts,
      totalRevenue,
      totalExpenses,
      totalDaysRented,
      overdueRevenue,
      netProfit: totalRevenue - totalExpenses
    };
  }, [contracts, allExpenses]);

  // Contracts prepared for child components requiring different prop shapes
  const contractsForPlanning = useMemo(() => {
    return contracts.map(c => {
      let { nombreDeJour } = c;
      // If nombreDeJour is not available on the contract, calculate it from dates
      if (nombreDeJour === undefined && c.start_date && c.end_date) {
        try {
          const start = new Date(c.start_date);
          const end = new Date(c.end_date);
          const diffInMs = end.getTime() - start.getTime();
          
          if (diffInMs >= 0) {
            // Calculate number of days. A rental from 15th to 19th is 4 days.
            nombreDeJour = Math.round(diffInMs / (1000 * 60 * 60 * 24));
          }
        } catch (e) {
          console.error(`Could not calculate duration for contract ${c.id}:`, e);
        }
      }
      return { ...c, customerName: c.customer_name, nombreDeJour };
    });
  }, [contracts]);

  const contractsForRevenue = useMemo(() => {
    return contracts.map(c => ({
      ...c,
      customerName: c.customer_name || "",
      startDate: c.start_date || "",
      endDate: c.end_date || "",
      dailyRate: c.daily_rate || 0,
      totalAmount: String(c.total_amount || 0),
      vehicle: c.vehicle || "",
    }));
  }, [contracts]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Rapports et Analyses</h1>
              <p className="text-muted-foreground">Rapports financiers et analyses de performance opérationnelle</p>
            </div>
            <Link to="/">
              <Button variant="outline">Retour à l'Accueil</Button>
            </Link>
          </div>
        </div>

        {/* Section de filtres supprimée */}

        <MetricsSection stats={stats} />

        <MonthlyRevenueSection contracts={contracts} />

        <VehiclePlanningSection
          vehicles={vehicles}
          contracts={contracts as Contract[]}
          filters={filters}
        />

        <AllVehiclesSection
          vehicles={vehicles}
          onRefresh={refetchVehicles}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <RevenueSection
            vehicles={vehicles}
            contracts={contractsForRevenue as RevenueChartContract[]}
            filters={filters}
          />
        </div>

        {/* Vehicle Comparison Section */}
        <VehicleComparisonSection
          vehicles={vehicles}
          contracts={contracts}
          expenses={allExpenses || []}
        />

        {/* Tenant Section - moved after Vehicle Comparison */}
        <div className="mb-8">
          <TenantSection
            contracts={contracts as any}
            filters={filters}
          />
        </div>

        {/* Section de rapport des dépenses supprimée */}

        {/* Section de rapports personnalisés supprimée */}
      </div>
    </div>
  );
};

export type { Contract, Vehicle, FilterState };
export default Reports;
