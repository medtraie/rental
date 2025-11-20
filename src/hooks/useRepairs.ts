
import { useState, useEffect, useCallback } from "react";
import { Repair, RepairFormData, RepairPayment } from "@/types/repair";
import { Vehicle, VehicleStatus } from "@/types/vehicle";
import { localStorageService } from "@/services/localStorageService";
import { useToast } from "@/hooks/use-toast";

const REPAIR_DATA_TYPE = "repairs";
const VEHICLE_DATA_TYPE = "vehicles";
const REPAIR_PAYMENT_DATA_TYPE = "repairPayments";

export const useRepairs = (vehicleId?: string) => {
  const { toast } = useToast();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRepairs = useCallback(async () => {
    setLoading(true);
    try {
      const allRepairs = localStorageService.getAll<Repair>(REPAIR_DATA_TYPE);
      const filteredRepairs = vehicleId ? allRepairs.filter((r) => r.vehicleId === vehicleId) : allRepairs;
      setRepairs(filteredRepairs);
    } catch (error) {
      console.error("Error fetching repairs:", error);
      toast({ title: "Erreur", description: "Une erreur s'est produite lors du chargement des réparations.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, vehicleId]);

  useEffect(() => {
    fetchRepairs();
  }, [fetchRepairs]);

  const addRepair = async (repairData: RepairFormData, file: File | null) => {
    setLoading(true);
    try {
      const vehicle = localStorageService.get<Vehicle>(VEHICLE_DATA_TYPE, repairData.vehicleId);
      if (!vehicle) throw new Error("Véhicule introuvable");

      const repairToSave = {
        ...repairData,
        vehicleInfo: { marque: vehicle.marque || vehicle.brand || "N/A", modele: vehicle.modele || vehicle.model || "N/A", immatriculation: vehicle.immatriculation || vehicle.registration || "N/A" },
        pieceJointe: file ? { fileName: file.name, fileUrl: URL.createObjectURL(file), fileType: file.type } : undefined,
      };

      const newRepair = localStorageService.add<Repair>(REPAIR_DATA_TYPE, repairToSave);

      localStorageService.update<Vehicle>(VEHICLE_DATA_TYPE, { ...vehicle, etat_vehicule: "maintenance" });

      if (repairData.paye > 0) {
        const treasuryMovement = {
          id: `repair-payment-${newRepair.id}`,
          repairId: newRepair.id,
          date: repairData.dateReparation,
          type: "reparation",
          amount: repairData.paye,
          paymentMethod: repairData.paymentMethod,
          reference: `Réparation ${repairData.typeReparation} - ${vehicle.marque} ${vehicle.modele}`,
          description: repairData.note,
          vehicleInfo: `${vehicle.immatriculation}`,
          created_at: new Date().toISOString(),
        };
        localStorageService.addItemToArray(REPAIR_PAYMENT_DATA_TYPE, treasuryMovement);
      }

      fetchRepairs();
      const debtMessage = repairData.dette > 0 ? ` Une dette de ${repairData.dette.toFixed(2)} MAD a été enregistrée.` : "";
      toast({ title: "Succès", description: `Réparation ajoutée avec succès. Le véhicule est maintenant en maintenance.${debtMessage}` });
    } catch (error: any) {
      console.error("=== Error adding repair ===", error);
      toast({ title: "Erreur", description: `Une erreur s'est produite lors de l'ajout de la réparation: ${error?.message || error?.toString()}` });
    } finally {
      setLoading(false);
    }
  };

  const updateRepair = async (id: string, repairData: RepairFormData, file: File | null) => {
    setLoading(true);
    try {
      const vehicle = localStorageService.get<Vehicle>(VEHICLE_DATA_TYPE, repairData.vehicleId);
      if (!vehicle) throw new Error("Véhicule introuvable");

      const existingRepair = localStorageService.get<Repair>(REPAIR_DATA_TYPE, id);
      if (!existingRepair) throw new Error("Réparation introuvable");

      const updateData = {
        ...existingRepair,
        ...repairData,
        vehicleInfo: { marque: vehicle.marque || vehicle.brand || "N/A", modele: vehicle.modele || vehicle.model || "N/A", immatriculation: vehicle.immatriculation || vehicle.registration || "N/A" },
        ...(file && { pieceJointe: { fileName: file.name, fileUrl: URL.createObjectURL(file), fileType: file.type } }),
      };

      const updatedRepair = localStorageService.update<Repair>(REPAIR_DATA_TYPE, updateData);
      if (!updatedRepair) throw new Error("Réparation introuvable");

      fetchRepairs();
      toast({ title: "Mis à jour", description: "Réparation mise à jour avec succès." });
    } catch (error) {
      console.error("Error updating repair:", error);
      toast({ title: "Erreur", description: "Échec de la mise à jour de la réparation.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deleteRepair = async (id: string) => {
    try {
      const repair = localStorageService.get<Repair>(REPAIR_DATA_TYPE, id);
      const deleted = localStorageService.delete(REPAIR_DATA_TYPE, id);
      if (!deleted) throw new Error("Réparation introuvable");

      if (repair) {
        const otherRepairs = localStorageService.getAll<Repair>(REPAIR_DATA_TYPE).filter((r) => r.id !== id && r.vehicleId === repair.vehicleId);
        if (otherRepairs.length === 0) {
          const contracts = localStorageService.getAll("contracts");
          const hasActiveContract = contracts.some((c: any) => c.vehicleId === repair.vehicleId && ["ouvert", "draft", "sent", "signed"].includes(c.status));
          if (!hasActiveContract) {
            const vehicle = localStorageService.get<Vehicle>(VEHICLE_DATA_TYPE, repair.vehicleId);
            if (vehicle) {
              localStorageService.update<Vehicle>(VEHICLE_DATA_TYPE, { ...vehicle, etat_vehicule: "disponible" });
            }
          }
        }
      }

      fetchRepairs();
      toast({ title: "Supprimé", description: "Réparation supprimée avec succès." });
    } catch (error) {
      console.error("Error deleting repair:", error);
      toast({ title: "Erreur", description: "Échec de la suppression de la réparation.", variant: "destructive" });
    }
  };

  const reactivateVehicle = async (vehicleId: string) => {
    try {
      const vehicle = localStorageService.get<Vehicle>(VEHICLE_DATA_TYPE, vehicleId);
      if (vehicle) {
        localStorageService.update<Vehicle>(VEHICLE_DATA_TYPE, { ...vehicle, etat_vehicule: "disponible" });
        toast({ title: "Succès", description: "Le véhicule a été réactivé et est maintenant disponible. Tous les enregistrements de maintenance sont conservés." });
      }
    } catch (error) {
      console.error("Error reactivating vehicle:", error);
      toast({ title: "Erreur", description: "Impossible de réactiver le véhicule.", variant: "destructive" });
    }
  };

  return { repairs, loading, addRepair, updateRepair, deleteRepair, reactivateVehicle };
};
