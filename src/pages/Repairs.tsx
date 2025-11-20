
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import RepairFormDialog from "@/components/RepairFormDialog";
import RepairDetailsDialog from "@/components/RepairDetailsDialog";
import RepairStatsCards from "@/components/RepairStatsCards";
import RepairFilters from "@/components/RepairFilters";
import RepairTable from "@/components/RepairTable";
import { useRepairFilters } from "@/hooks/useRepairFilters";
import { useRepairStats } from "@/hooks/useRepairStats";
import { Repair, RepairFormData } from "@/types/repair";
import { useVehicles } from "@/hooks/useVehicles";
import { useRepairs } from "@/hooks/useRepairs";
import LoadingSpinner from "@/components/LoadingSpinner";

const Repairs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null);
  
  const { toast } = useToast();
  
  
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { repairs, loading: repairsLoading, addRepair, updateRepair, deleteRepair, reactivateVehicle } = useRepairs();

  // Utiliser les hooks personnalisés pour le filtrage et les statistiques
  const filteredRepairs = useRepairFilters(repairs, searchTerm, filterType, filterDateRange);
  const stats = useRepairStats(repairs);

  const handleSaveRepair = (formData: RepairFormData, file: File | null) => {
    if (editingRepair) {
      updateRepair(editingRepair.id, formData, file).then(() => {
        toast({
          title: "Mis à jour",
          description: "La réparation a été mise à jour avec succès"
        });
      });
    } else {
      addRepair(formData, file);
    }
    setIsFormOpen(false);
    setEditingRepair(null);
  };
  
  const handleAddClick = () => {
    setEditingRepair(null);
    setIsFormOpen(true);
  }

  const handleEditRepair = (repair: Repair) => {
    setEditingRepair(repair);
    setIsFormOpen(true);
  };

  const handleDeleteRepair = (repairId: string) => {
    deleteRepair(repairId);
  };

  const handleViewDetails = (repair: Repair) => {
    setSelectedRepair(repair);
    setIsDetailsOpen(true);
  };

  const handleReactivateVehicle = (repair: Repair) => {
    if (window.confirm(`Êtes-vous sûr de vouloir réactiver le véhicule ${repair.vehicleInfo.marque} ${repair.vehicleInfo.modele} ? Il sera marqué comme disponible mais tous les enregistrements de maintenance seront conservés.`)) {
      reactivateVehicle(repair.vehicleId);
    }
  };

  if (vehiclesLoading || repairsLoading) {
    return <LoadingSpinner message="Chargement des données..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Wrench className="h-8 w-8 text-card-orange" />
                Gestion des Réparations
              </h1>
              <p className="text-muted-foreground">Enregistrement et gestion de toutes les opérations de maintenance et réparation</p>
            </div>
            <Link to="/">
              <Button variant="outline">Retour à l'accueil</Button>
            </Link>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <RepairStatsCards {...stats} />

        {/* Filtres et actions */}
        <RepairFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterType={filterType}
          setFilterType={setFilterType}
          filterDateRange={filterDateRange}
          setFilterDateRange={setFilterDateRange}
          onAddRepair={handleAddClick}
        />

        {/* Tableau des réparations */}
        <RepairTable
          filteredRepairs={filteredRepairs}
          onViewDetails={handleViewDetails}
          onEditRepair={handleEditRepair}
          onDeleteRepair={handleDeleteRepair}
          onReactivateVehicle={handleReactivateVehicle}
        />

        {/* Dialogues */}
        <RepairFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSave={handleSaveRepair}
          repair={editingRepair}
          vehicles={vehicles}
        />

        <RepairDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          repair={selectedRepair}
          onEdit={handleEditRepair}
        />
      </div>
    </div>
  );
};

export default Repairs;
