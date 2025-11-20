
import { Edit, Trash2, Eye, Car, Fuel, Settings, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Vehicle } from "@/hooks/useVehicles";

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicleId: string) => void;
  onViewDetails: (vehicle: Vehicle) => void;
  getStatusBadge: (status: string) => { label: string; variant: any; color: string };
}

const VehicleCard = ({ vehicle, onEdit, onDelete, onViewDetails, getStatusBadge }: VehicleCardProps) => {
  const marque = vehicle.marque || vehicle.brand || "";
  const modele = vehicle.modele || vehicle.model || "";
  const immatriculation = vehicle.immatriculation || vehicle.registration || "";
  const annee = vehicle.annee || vehicle.year || new Date().getFullYear();
  const etat = vehicle.etat_vehicule || "disponible";
  const statusConfig = getStatusBadge(etat);

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        {/* Vehicle Image */}
        <div className="w-full h-40 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
          {vehicle.photos && vehicle.photos.length > 0 ? (
            <img 
              src={vehicle.photos[0]} 
              alt={`${marque} ${modele}`}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Car className="w-16 h-16 text-gray-400" />
          )}
        </div>

        {/* Vehicle Info */}
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              🚗 {marque} {modele}
            </h3>
            <p className="text-sm text-gray-500">({annee})</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm flex items-center gap-2">
              <span className="text-gray-600">🔢</span>
              <span className="font-mono">{immatriculation}</span>
            </p>
            
            <div className="flex items-center gap-4">
              <span className="text-sm flex items-center gap-1">
                <Fuel className="w-4 h-4 text-gray-500" />
                {vehicle.type_carburant || "Essence"}
              </span>
              <span className="text-sm flex items-center gap-1">
                <Settings className="w-4 h-4 text-gray-500" />
                {vehicle.boite_vitesse || "Manuel"}
              </span>
            </div>

            <p className="text-sm flex items-center gap-2">
              <span>📈</span>
              <span>{(vehicle.kilometrage || 0).toLocaleString()} km</span>
            </p>

            <p className="text-sm flex items-center gap-2">
              <Palette className="w-4 h-4 text-gray-500" />
              <span>{vehicle.couleur || "Blanc"}</span>
            </p>

            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-green-600">
                💰 {vehicle.prix_par_jour || 200} DH / jour
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">{statusConfig.color}</span>
              <Badge variant={statusConfig.variant}>
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(vehicle)}
          className="flex-1"
        >
          <Eye className="w-4 h-4 mr-1" />
          Détails
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(vehicle)}
        >
          <Edit className="w-4 h-4" />
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le véhicule</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le véhicule {marque} {modele} ({immatriculation})? 
                Cette action ne peut pas être annulée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onDelete(vehicle.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default VehicleCard;
