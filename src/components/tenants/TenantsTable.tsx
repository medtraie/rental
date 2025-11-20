
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Eye, Edit, Trash2, Phone, User, MapPin, CreditCard, Globe } from "lucide-react";
import { Tenant } from "@/pages/Customers";
import { EnhancedTable } from "@/components/enhanced/EnhancedTable";

interface Props {
  tenants: Tenant[];
  onView: (tenant: Tenant) => void;
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenantId: string) => void;
  searchTerm: string;
}

export default function TenantsTable({
  tenants,
  onView,
  onEdit,
  onDelete,
  searchTerm
}: Props) {
  const columns = [
    {
      key: 'nom',
      label: 'Nom',
      sortable: true,
      render: (tenant: Tenant) => (
        <div className="font-semibold text-foreground">{tenant.nom}</div>
      )
    },
    {
      key: 'prenom',
      label: 'Prénom',
      sortable: true,
      render: (tenant: Tenant) => (
        <div className="text-foreground">{tenant.prenom}</div>
      )
    },
    {
      key: 'telephone',
      label: 'Téléphone',
      sortable: true,
      render: (tenant: Tenant) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{tenant.telephone}</span>
        </div>
      )
    },
    {
      key: 'cin',
      label: 'CIN',
      sortable: true,
      render: (tenant: Tenant) => (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{tenant.cin}</span>
        </div>
      )
    },
    {
      key: 'permis',
      label: 'Permis',
      sortable: true,
      render: (tenant: Tenant) => (
        <span className="font-mono text-sm">{tenant.permis}</span>
      )
    },
    {
      key: 'nationalite',
      label: 'Nationalité',
      sortable: true,
      render: (tenant: Tenant) => (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span>{tenant.nationalite}</span>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (tenant: Tenant) => (
        <Badge className={`font-medium ${
          tenant.type === "Locataire Principal"
            ? "bg-blue-100 text-blue-800 border-blue-200"
            : "bg-purple-100 text-purple-800 border-purple-200"
        }`}>
          {tenant.type}
        </Badge>
      )
    },
    {
      key: 'adresse',
      label: 'Adresse',
      sortable: true,
      render: (tenant: Tenant) => (
        <div className="flex items-start gap-2 max-w-xs">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="text-sm truncate" title={tenant.adresse}>{tenant.adresse}</span>
        </div>
      )
    }
  ];

  const renderActions = (tenant: Tenant) => (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        title="Voir détails"
        onClick={() => onView(tenant)}
        className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-700"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        title="Modifier"
        onClick={() => onEdit(tenant)}
        className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-700"
      >
        <Edit className="h-4 w-4" />
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
              Êtes-vous sûr de vouloir supprimer le locataire {tenant.prenom} {tenant.nom} ? 
              Cette action est irréversible et supprimera toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(tenant.id)}
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
      data={tenants}
      columns={columns}
      title="Liste des locataires"
      description={`${tenants.length} locataire${tenants.length > 1 ? 's' : ''} enregistré${tenants.length > 1 ? 's' : ''}`}
      searchPlaceholder="Rechercher par nom, téléphone, CIN, permis..."
      actions={renderActions}
      emptyMessage={
        searchTerm 
          ? "Aucun locataire ne correspond à votre recherche. Essayez de modifier vos critères."
          : "Aucun locataire enregistré. Commencez par ajouter votre premier locataire."
      }
      defaultItemsPerPage={25}
      itemsPerPageOptions={[10, 25, 50]}
    />
  );
}
