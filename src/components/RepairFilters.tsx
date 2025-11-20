
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus } from "lucide-react";

interface RepairFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  filterDateRange: string;
  setFilterDateRange: (range: string) => void;
  onAddRepair: () => void;
}

const RepairFilters = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterDateRange,
  setFilterDateRange,
  onAddRepair
}: RepairFiltersProps) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher dans les réparations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type de réparation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="Mécanique">Mécanique</SelectItem>
                <SelectItem value="Électrique">Électrique</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterDateRange} onValueChange={setFilterDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les périodes</SelectItem>
                <SelectItem value="thisMonth">Ce mois</SelectItem>
                <SelectItem value="lastMonth">Le mois dernier</SelectItem>
                <SelectItem value="thisYear">Cette année</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={onAddRepair} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une réparation
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RepairFilters;
