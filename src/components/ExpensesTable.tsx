
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, ExternalLink, FileText, Calendar, DollarSign, Car } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Expense } from "@/types/expense";
import { Vehicle } from "@/hooks/useVehicles";
import { EnhancedTable } from "@/components/enhanced/EnhancedTable";

interface ExpensesTableProps {
  expenses: Expense[];
  vehicles: Vehicle[];
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
  loading: boolean;
}

const expenseTypeLabels = {
  'vignette': 'Vignette',
  'assurance': 'Assurance',
  'visite_technique': 'Visite technique',
  'gps': 'GPS',
  'credit': 'Crédit',
  'reparation': 'Réparation'
};

const ExpensesTable = ({ expenses, vehicles, onEdit, onDelete, loading }: ExpensesTableProps) => {
  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : 'Non défini';
  };

  const getExpenseTypeColor = (type: string) => {
    const colors = {
      'vignette': 'bg-blue-100 text-blue-800 border-blue-200',
      'assurance': 'bg-green-100 text-green-800 border-green-200',
      'visite_technique': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'gps': 'bg-purple-100 text-purple-800 border-purple-200',
      'credit': 'bg-red-100 text-red-800 border-red-200',
      'reparation': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const columns = [
    {
      key: 'vehicle_id',
      label: 'Véhicule',
      sortable: true,
      render: (expense: Expense) => (
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{getVehicleName(expense.vehicle_id)}</span>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type de Charge',
      sortable: true,
      render: (expense: Expense) => (
        <Badge className={`${getExpenseTypeColor(expense.type)} font-medium`}>
          {expenseTypeLabels[expense.type as keyof typeof expenseTypeLabels]}
        </Badge>
      )
    },
    {
      key: 'total_cost',
      label: 'Coût Total',
      sortable: true,
      render: (expense: Expense) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-semibold text-green-700">
            {expense.total_cost.toLocaleString()} DH
          </span>
        </div>
      )
    },
    {
      key: 'monthly_cost',
      label: 'Coût Mensuel',
      sortable: true,
      render: (expense: Expense) => (
        <span className="font-medium text-foreground">
          {expense.monthly_cost.toLocaleString()} DH
        </span>
      )
    },
    {
      key: 'start_date',
      label: 'Période',
      sortable: true,
      render: (expense: Expense) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            <div className="text-foreground">
              {format(new Date(expense.start_date), 'dd/MM/yyyy', { locale: fr })}
            </div>
            <div className="text-muted-foreground">à</div>
            <div className="text-foreground">
              {format(new Date(expense.end_date), 'dd/MM/yyyy', { locale: fr })}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'period_months',
      label: 'Durée',
      sortable: true,
      render: (expense: Expense) => (
        <span className="text-foreground">{expense.period_months} mois</span>
      )
    },
    {
      key: 'document_url',
      label: 'Document',
      sortable: false,
      render: (expense: Expense) => (
        expense.document_url ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(expense.document_url, '_blank')}
            className="h-8 hover:bg-blue-50 hover:text-blue-700"
            title="Voir le document"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        ) : (
          <span className="text-muted-foreground text-sm">Aucun</span>
        )
      )
    }
  ];

  const renderActions = (expense: Expense) => (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEdit(expense)}
        className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-700"
        title="Modifier"
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
              Êtes-vous sûr de vouloir supprimer cette dépense ? 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(expense.id)}
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
      data={expenses}
      columns={columns}
      title="Liste des dépenses"
      description={`${expenses.length} dépense${expenses.length > 1 ? 's' : ''} enregistrée${expenses.length > 1 ? 's' : ''}`}
      searchPlaceholder="Rechercher par véhicule, type, coût..."
      actions={renderActions}
      loading={loading}
      emptyMessage="Aucune dépense enregistrée. Commencez par ajouter votre première dépense."
      defaultItemsPerPage={25}
      itemsPerPageOptions={[10, 25, 50, 100]}
    />
  );
};

export default ExpensesTable;
