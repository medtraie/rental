
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";

interface Props {
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  nationalityFilter: string;
  nationalities: string[];
  onNationalityChange: (v: string) => void;
  onAddTenant: () => void;
}

export default function TenantsActionsBar({
  searchTerm,
  onSearchTermChange,
  nationalityFilter,
  nationalities,
  onNationalityChange,
  onAddTenant
}: Props) {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par nom, CIN, permis, téléphone..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={nationalityFilter} onValueChange={onNationalityChange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrer par nationalité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes nationalités</SelectItem>
                {nationalities.map(nationality => (
                  <SelectItem key={nationality} value={nationality}>
                    {nationality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full md:w-auto" onClick={onAddTenant}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter Locataire
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
