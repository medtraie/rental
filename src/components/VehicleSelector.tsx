
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVehicles, Vehicle } from "@/hooks/useVehicles";
import VehicleFormDialog from "./VehicleFormDialog";

interface VehicleSelectorProps {
  selectedVehicle: Vehicle | null;
  onVehicleSelect: (vehicle: Vehicle | null) => void;
}

const VehicleSelector = ({ selectedVehicle, onVehicleSelect }: VehicleSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [showVehicleDialog, setShowVehicleDialog] = useState(false);
  const { vehicles, loading, addVehicle } = useVehicles();

  const handleVehicleCreate = async (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => {
    const newVehicle = await addVehicle(vehicleData);
    if (newVehicle) {
      onVehicleSelect(newVehicle);
    }
  };

  const getVehicleDisplayName = (vehicle: Vehicle) => {
    const parts = [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean);
    return parts.join(' ');
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedVehicle 
              ? getVehicleDisplayName(selectedVehicle)
              : "Choisir un véhicule..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Rechercher un véhicule..." />
            <CommandList>
              <CommandEmpty>Aucun véhicule trouvé</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setShowVehicleDialog(true);
                    setOpen(false);
                  }}
                  className="font-medium text-blue-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un nouveau véhicule
                </CommandItem>
                {vehicles.map((vehicle) => {
                  const isAvailable = vehicle.etat_vehicule === 'disponible';
                  const statusText = vehicle.etat_vehicule === 'loue' ? 'loué' : 
                                   vehicle.etat_vehicule === 'maintenance' ? 'maintenance' : 'disponible';
                  
                  return (
                    <CommandItem
                      key={vehicle.id}
                      onSelect={() => {
                        if (!isAvailable) {
                          return; // Ne peut pas sélectionner un véhicule non disponible
                        }
                        onVehicleSelect(vehicle);
                        setOpen(false);
                      }}
                      className={!isAvailable ? "opacity-50 cursor-not-allowed" : ""}
                      disabled={!isAvailable}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedVehicle?.id === vehicle.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className={!isAvailable ? "text-gray-400" : ""}>
                          {getVehicleDisplayName(vehicle)}
                        </span>
                        {vehicle.registration && (
                          <span className="text-sm text-gray-500">{vehicle.registration}</span>
                        )}
                        <span className={`text-xs ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                          {statusText}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <VehicleFormDialog
        open={showVehicleDialog}
        onOpenChange={setShowVehicleDialog}
        onSave={handleVehicleCreate}
      />
    </>
  );
};

export default VehicleSelector;
