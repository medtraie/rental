
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Eye, FileDown, Wrench, Zap, Car, Calendar, DollarSign } from "lucide-react";
import { Repair } from "@/types/repair";
import { EnhancedTable } from "@/components/enhanced/EnhancedTable";

interface RepairTableProps {
  filteredRepairs: Repair[];
  onViewDetails: (repair: Repair) => void;
  onEditRepair: (repair: Repair) => void;
  onDeleteRepair: (repairId: string) => void;
  onReactivateVehicle: (repair: Repair) => void;
}

const RepairTable = ({ 
  filteredRepairs, 
  onViewDetails, 
  onEditRepair, 
  onDeleteRepair,
  onReactivateVehicle 
}: RepairTableProps) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Mécanique": return <Wrench className="h-4 w-4" />;
      case "Électrique": return <Zap className="h-4 w-4" />;
      case "Garage": return <Car className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    let colorClass = "";
    switch (type) {
      case "Électrique":
        colorClass = "bg-blue-100 text-blue-700 border-blue-200";
        break;
      case "Garage":
        colorClass = "bg-purple-100 text-purple-700 border-purple-200";
        break;
      default: // Mécanique
        colorClass = "bg-orange-100 text-orange-700 border-orange-200";
        break;
    }
    
    return (
      <Badge className={`flex items-center gap-1 font-medium ${colorClass}`}>
        {getTypeIcon(type)}
        {type}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number | undefined) => {
    return `${(amount || 0).toLocaleString()} DH`;
  };

  const columns = [
    {
      key: 'dateReparation',
      label: 'Date',
      sortable: true,
      render: (repair: Repair) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">{formatDate(repair.dateReparation)}</span>
        </div>
      )
    },
    {
      key: 'vehicleInfo',
      label: 'Véhicule',
      sortable: true,
      render: (repair: Repair) => (
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">
              {repair.vehicleInfo.marque} {repair.vehicleInfo.modele}
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              {repair.vehicleInfo.immatriculation}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'typeReparation',
      label: 'Type',
      sortable: true,
      render: (repair: Repair) => getTypeBadge(repair.typeReparation)
    },
    {
      key: 'cout',
      label: 'Coût Total',
      sortable: true,
      render: (repair: Repair) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-foreground" />
          <span className="font-semibold text-foreground">
            {formatCurrency(repair.cout)}
          </span>
        </div>
      )
    },
    {
      key: 'paye',
      label: 'Payé',
      sortable: true,
      render: (repair: Repair) => (
        <span className="font-medium text-green-600">
          {formatCurrency(repair.paye || 0)}
        </span>
      )
    },
    {
      key: 'dette',
      label: 'Dette',
      sortable: true,
      render: (repair: Repair) => (
        <span className={`font-medium ${(repair.dette || 0) > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
          {formatCurrency(repair.dette || 0)}
        </span>
      )
    },
    {
      key: 'paymentMethod',
      label: 'Mode Paiement',
      sortable: true,
      render: (repair: Repair) => (
        <Badge variant="outline">
          {repair.paymentMethod === 'Espèces' && '💵'}
          {repair.paymentMethod === 'Virement' && '🏦'}
          {repair.paymentMethod === 'Chèque' && '🧾'}
          {' '}{repair.paymentMethod || 'Non spécifié'}
        </Badge>
      )
    },
    {
      key: 'note',
      label: 'Remarque',
      sortable: false,
      render: (repair: Repair) => (
        <div className="max-w-xs">
          <span className="text-sm text-foreground truncate block" title={repair.note}>
            {repair.note}
          </span>
        </div>
      )
    },
    {
      key: 'pieceJointe',
      label: 'Pièce jointe',
      sortable: false,
      render: (repair: Repair) => (
        repair.pieceJointe ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(repair.pieceJointe.fileUrl, '_blank')}
            title="Télécharger la pièce jointe"
            className="h-8 hover:bg-blue-50 hover:text-blue-700"
          >
            <FileDown className="h-4 w-4" />
          </Button>
        ) : (
          <span className="text-muted-foreground text-sm">Aucune</span>
        )
      )
    }
  ];

  const renderActions = (repair: Repair) => (
    <div className="flex items-center gap-1">
      <Button 
        variant="ghost" 
        size="sm" 
        title="Voir les détails"
        onClick={() => onViewDetails(repair)}
        className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-700"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        title="Modifier"
        onClick={() => onEditRepair(repair)}
        className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-700"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        title="Réactiver le véhicule"
        onClick={() => onReactivateVehicle(repair)}
        className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-700"
      >
        <Car className="h-4 w-4" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette réparation ? 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDeleteRepair(repair.id)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <EnhancedTable
      data={filteredRepairs}
      columns={columns}
      title="Liste des réparations"
      description={`${filteredRepairs.length} réparation${filteredRepairs.length > 1 ? 's' : ''} trouvée${filteredRepairs.length > 1 ? 's' : ''}`}
      searchPlaceholder="Rechercher par véhicule, type, remarque..."
      actions={renderActions}
      emptyMessage="Aucune réparation ne correspond à la recherche."
      defaultItemsPerPage={25}
      itemsPerPageOptions={[10, 25, 50]}
    />
  );
};

export default RepairTable;
