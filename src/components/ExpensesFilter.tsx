
import { useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Vehicle } from "@/hooks/useVehicles";
import { Expense } from "@/types/expense";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type Props = {
  vehicles: Vehicle[];
  expenses: Expense[];
  filters: {
    type: string;
    vehicleId: string;
    fromDate: Date | null;
    toDate: Date | null;
    search: string;
  };
  onChange: (filters: Props["filters"]) => void;
};

const expenseTypes = [
  { value: "vignette", label: "Vignette" },
  { value: "assurance", label: "Assurance" },
  { value: "visite_technique", label: "Visite technique" },
  { value: "gps", label: "GPS" },
  { value: "credit", label: "Crédit" },
  { value: "reparation", label: "Réparation" },
];

const ExpensesFilter = ({ vehicles, filters, onChange }: Props) => {
  // Helper to convert Select visible value ("all" means unset/neutral) to internal state
  const typeValue = filters.type === "" ? "all" : filters.type;
  const vehicleValue = filters.vehicleId === "" ? "all" : filters.vehicleId;

  return (
    <div className="flex flex-wrap gap-3 bg-card rounded-lg shadow px-4 py-3 mb-6 items-end">
      {/* Type de charge */}
      <div className="w-40">
        <label className="block mb-1 text-xs font-medium text-gray-700">Type de charge</label>
        <Select 
          value={typeValue} 
          onValueChange={type => onChange({ ...filters, type: type === "all" ? "" : type })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir le type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {expenseTypes.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Période */}
      <div>
        <label className="block mb-1 text-xs font-medium text-gray-700">Du</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={"outline"} className="w-36 flex justify-between">
              {filters.fromDate ? format(filters.fromDate, 'dd/MM/yyyy', { locale: fr }) : "Choisir la date"}
              <CalendarIcon className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.fromDate!}
              onSelect={date => onChange({ ...filters, fromDate: date ?? null })}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <label className="block mb-1 text-xs font-medium text-gray-700">Au</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={"outline"} className="w-36 flex justify-between">
              {filters.toDate ? format(filters.toDate, 'dd/MM/yyyy', { locale: fr }) : "Choisir la date"}
              <CalendarIcon className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.toDate!}
              onSelect={date => onChange({ ...filters, toDate: date ?? null })}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      {/* Recherche */}
      <div className="flex-1 min-w-[130px]">
        <label className="block mb-1 text-xs font-medium text-gray-700">Recherche</label>
        <input
          type="text"
          placeholder="Rechercher par type ou remarques..."
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          className="w-full bg-gray-50 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
      {/* Bouton reset */}
      <div>
        <Button
          type="button"
          className="mt-5"
          variant="outline"
          onClick={() => onChange({ type: '', vehicleId: '', fromDate: null, toDate: null, search: '' })}
        >
          Réinitialiser
        </Button>
      </div>
    </div>
  );
};

export default ExpensesFilter;
