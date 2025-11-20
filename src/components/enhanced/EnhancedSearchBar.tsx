import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface ActiveFilter {
  key: string;
  value: string;
  label: string;
}

interface EnhancedSearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
  filters?: FilterOption[];
  activeFilters?: ActiveFilter[];
  onFilterChange?: (key: string, value: string) => void;
  onFilterRemove?: (key: string) => void;
  onClearAllFilters?: () => void;
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  className?: string;
}

export function EnhancedSearchBar({
  searchTerm,
  onSearchChange,
  placeholder = "Rechercher...",
  filters = [],
  activeFilters = [],
  onFilterChange,
  onFilterRemove,
  onClearAllFilters,
  primaryAction,
  className = ""
}: EnhancedSearchBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <Card className={`mb-6 ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Ligne principale: recherche + bouton principal */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Barre de recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-11 text-base bg-background border-2 focus:border-primary transition-colors"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Boutons filtres et action */}
            <div className="flex gap-2">
              {filters.length > 0 && (
                <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="h-11 relative"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filtres
                      {activeFilters.length > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="ml-2 px-1.5 py-0 text-xs h-5 min-w-[20px] bg-primary text-primary-foreground"
                        >
                          {activeFilters.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Filtres</h4>
                        {activeFilters.length > 0 && onClearAllFilters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearAllFilters}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Tout effacer
                          </Button>
                        )}
                      </div>
                      
                      {filters.map((filter) => (
                        <div key={filter.key} className="space-y-2">
                          <label className="text-sm font-medium">{filter.label}</label>
                          <div className="flex flex-wrap gap-2">
                            {filter.options.map((option) => {
                              const isActive = activeFilters.some(
                                f => f.key === filter.key && f.value === option.value
                              );
                              return (
                                <Button
                                  key={option.value}
                                  variant={isActive ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => {
                                    if (onFilterChange) {
                                      if (isActive && onFilterRemove) {
                                        onFilterRemove(filter.key);
                                      } else {
                                        onFilterChange(filter.key, option.value);
                                      }
                                    }
                                  }}
                                  className="text-xs"
                                >
                                  {option.label}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {primaryAction && (
                <Button 
                  onClick={primaryAction.onClick}
                  className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md hover:shadow-lg transition-all"
                >
                  {primaryAction.icon || <Plus className="h-4 w-4 mr-2" />}
                  {primaryAction.label}
                </Button>
              )}
            </div>
          </div>

          {/* Filtres actifs */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground self-center">Filtres actifs:</span>
              {activeFilters.map((filter) => (
                <Badge 
                  key={`${filter.key}-${filter.value}`} 
                  variant="secondary" 
                  className="pl-2 pr-1 py-1 bg-primary/10 text-primary border-primary/20"
                >
                  {filter.label}
                  {onFilterRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFilterRemove(filter.key)}
                      className="ml-1 h-4 w-4 p-0 hover:bg-primary/20 rounded-full"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  )}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}