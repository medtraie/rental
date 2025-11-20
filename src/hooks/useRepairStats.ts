
import { useMemo } from "react";
import { Repair } from "@/types/repair";

export const useRepairStats = (repairs: Repair[]) => {
  const stats = useMemo(() => {
    const totalRepairs = repairs.length;
    const mechanicalRepairs = repairs.filter(r => r.typeReparation === "Mécanique").length;
    const electricalRepairs = repairs.filter(r => r.typeReparation === "Électrique").length;
    const totalCost = repairs.reduce((sum, repair) => sum + repair.cout, 0);

    return {
      totalRepairs,
      mechanicalRepairs,
      electricalRepairs,
      totalCost
    };
  }, [repairs]);

  return stats;
};
