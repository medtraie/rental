
import { useMemo } from "react";
import { Repair } from "@/types/repair";

export const useRepairFilters = (
  repairs: Repair[],
  searchTerm: string,
  filterType: string,
  filterDateRange: string
) => {
  const filteredRepairs = useMemo(() => {
    return repairs.filter(repair => {
      const matchesSearch = 
        repair.vehicleInfo.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.vehicleInfo.modele.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.vehicleInfo.immatriculation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.note.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === "all" || repair.typeReparation === filterType;
      
      const matchesDate = filterDateRange === "all" || (() => {
        const repairDate = new Date(repair.dateReparation);
        const now = new Date();
        switch (filterDateRange) {
          case "thisMonth":
            return repairDate.getMonth() === now.getMonth() && repairDate.getFullYear() === now.getFullYear();
          case "lastMonth":
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
            return repairDate.getMonth() === lastMonth.getMonth() && repairDate.getFullYear() === lastMonth.getFullYear();
          case "thisYear":
            return repairDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      })();

      return matchesSearch && matchesType && matchesDate;
    });
  }, [repairs, searchTerm, filterType, filterDateRange]);

  return filteredRepairs;
};
