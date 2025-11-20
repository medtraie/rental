
import ContractsHeader from "@/components/ContractsHeader";
import ContractsSearchBar from "@/components/ContractsSearchBar";
import ContractsStats from "@/components/ContractsStats";
import ContractsTable from "@/components/ContractsTable";
import ContractDetailsDialog from "@/components/ContractDetailsDialog";
import ContractEditDialog from "@/components/ContractEditDialog";
import PaymentStatusFilter from "@/components/PaymentStatusFilter";
import { useContractsPageLogic } from "@/hooks/useContractsPageLogic";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractMigrationButton } from "@/components/ContractMigrationButton";

// Options de statut des contrats simplifiées
const contractStatusOptions = [
  { label: "Tous", value: "all" },
  { label: "Ouvert", value: "ouvert" },
  { label: "Fermé", value: "ferme" },
];

const Contracts = () => {
  const {
    contracts,
    loading,
    filteredContracts,
    statusFilter,
    setStatusFilter,
    financialStatusFilter,
    setFinancialStatusFilter,
    searchTerm,
    setSearchTerm,
    handleAddContract,
    handleDeleteContract,
    handleViewDetails,
    handleEditContract,
    handleSaveContract,
    handleSendForSignature,
    selectedContract,
    setSelectedContract,
    isDetailsOpen,
    setIsDetailsOpen,
    isEditOpen,
    setIsEditOpen,
    signatureLoading,
    getPaymentSummary,
  } = useContractsPageLogic();

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Chargement des contrats...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <ContractsHeader />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 py-4">
          {/* Filtre par statut général */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Statut général</span>
            <div className="flex gap-2 flex-wrap">
              {contractStatusOptions.map(opt => (
                <button
                  key={opt.value}
                  className={`px-3 py-1 rounded-full border text-sm font-medium transition-colors
                    ${statusFilter === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-accent"
                    }
                  `}
                  onClick={() => setStatusFilter(opt.value as any)}
                  type="button"
                >
                  {opt.label}
                </button>
              ))}
              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 ml-4"
              >
                <RefreshCcw className="w-4 h-4" />
                Actualiser
              </Button>
            </div>
          </div>
          
          {/* Filtre par état financier */}
          <PaymentStatusFilter 
            financialStatusFilter={financialStatusFilter}
            setFinancialStatusFilter={setFinancialStatusFilter}
          />
        </div>
        <ContractsSearchBar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onAddContract={handleAddContract}
        />
        <ContractMigrationButton />
        <ContractsStats contracts={contracts} />
        <ContractsTable 
          contracts={filteredContracts}
          onViewDetails={handleViewDetails}
          onEditContract={handleEditContract}
          onDeleteContract={handleDeleteContract}
          onSendForSignature={handleSendForSignature}
          signatureLoading={signatureLoading}
          getPaymentSummary={getPaymentSummary}
        />
      </div>
      <ContractDetailsDialog
        contract={selectedContract}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        contracts={contracts}
      />
      <ContractEditDialog
        contract={selectedContract}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={handleSaveContract}
        contracts={contracts}
      />
    </div>
  );
};

export default Contracts;
