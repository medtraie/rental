
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calculator, TrendingUp, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { useExpenses } from "@/hooks/useExpenses";
import { useVehicles, Vehicle } from "@/hooks/useVehicles";
import { Expense } from "@/types/expense";
import ExpenseFormDialog from "@/components/ExpenseFormDialog";
import ExpensesTable from "@/components/ExpensesTable";
import MonthlyExpenseChart from "@/components/MonthlyExpenseChart";
import ExpensesFilter from "@/components/ExpensesFilter";
import ExpenseTypePieChart from "@/components/ExpenseTypePieChart";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from "recharts";
import VehicleSelector from "@/components/VehicleSelector";

const Expenses = () => {
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const { expenses, monthlyExpenses, loading, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { vehicles } = useVehicles();

  // Ajouter l'état de sélection de véhicule
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Filtrage local (pas de changement)
  const [filters, setFilters] = useState({
    type: "",
    vehicleId: "",
    fromDate: null as Date | null,
    toDate: null as Date | null,
    search: "",
  });

  // Mettre à jour le filtre du véhicule lors de la sélection d'un véhicule depuis VehicleSelector
  const handleVehicleSelect = (vehicle: Vehicle | null) => {
    setSelectedVehicleId(vehicle ? vehicle.id : null);
    // Mettre à jour le filtre du véhicule aussi pour être cohérent
    setFilters(f => ({ ...f, vehicleId: vehicle ? vehicle.id : "" }));
  };

  // Appliquer les filtres + filtrage du véhicule sélectionné (si quelque chose est sélectionné)
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      // Si un véhicule est sélectionné, ignorer le filtre interne et se baser uniquement sur le sélectionné
      if (selectedVehicleId && e.vehicle_id !== selectedVehicleId) return false;
      // Si aucun véhicule n'est sélectionné en haut, utiliser le véhicule des filtres comme d'habitude
      if (!selectedVehicleId && filters.vehicleId && e.vehicle_id !== filters.vehicleId) return false;
      if (filters.type && e.type !== filters.type) return false;
      if (filters.fromDate && new Date(e.start_date) < filters.fromDate) return false;
      if (filters.toDate && new Date(e.end_date) > filters.toDate) return false;
      if (filters.search) {
        const entry = `${e.type} ${e.notes || ""}`.toLowerCase();
        if (!entry.includes(filters.search.toLowerCase())) return false;
      }
      return true;
    });
  }, [expenses, filters, selectedVehicleId]);

  // Dépenses mensuelles totales pour chaque véhicule (chaque véhicule séparément)
  const monthlyByVehicle = useMemo(() => {
    const res: Record<string, number> = {};
    monthlyExpenses.forEach(m => {
      res[m.vehicle_id] = (res[m.vehicle_id] || 0) + Number(m.allocated_amount || 0);
    });
    return vehicles.map(v => ({
      vehicle: `${v.brand} ${v.model} ${v.year}`,
      amount: res[v.id] || 0
    }));
  }, [monthlyExpenses, vehicles]);

  // Filtrer les données du graphique selon le véhicule sélectionné
  const vehicleMonthlyExpenses = useMemo(() => {
    if (!selectedVehicleId) return monthlyExpenses;
    return monthlyExpenses.filter(e => e.vehicle_id === selectedVehicleId);
  }, [monthlyExpenses, selectedVehicleId]);

  console.log('Page des dépenses - dépenses:', expenses);
  console.log('Page des dépenses - dépenses mensuelles:', monthlyExpenses);
  console.log('Page des dépenses - véhicules:', vehicles);

  const handleAddExpense = () => {
    setEditingExpense(null);
    setShowExpenseDialog(true);
  };

  const handleEditExpense = (expense: Expense) => {
    console.log('Modification de la dépense:', expense);
    setEditingExpense(expense);
    setShowExpenseDialog(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      await deleteExpense(expenseId);
    }
  };

  // Calculer les statistiques
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.total_cost || 0), 0);
  const currentMonthExpenses = monthlyExpenses
    .filter(expense => {
      try {
        const expenseMonth = new Date(expense.month_year);
        const currentMonth = new Date();
        return expenseMonth.getMonth() === currentMonth.getMonth() && 
               expenseMonth.getFullYear() === currentMonth.getFullYear();
      } catch (error) {
        console.error('Erreur lors du filtrage des dépenses du mois actuel:', error);
        return false;
      }
    })
    .reduce((sum, expense) => sum + Number(expense.allocated_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Gestion des Dépenses</h1>
              <p className="text-muted-foreground">Suivi et gestion des dépenses des véhicules et coûts mensuels</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleAddExpense} disabled={vehicles.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une dépense
              </Button>
              <Link to="/">
                <Button variant="outline">Retour à l'accueil</Button>
              </Link>
            </div>
          </div>
          {vehicles.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                Aucun véhicule enregistré. Veuillez d'abord ajouter un véhicule avant d'ajouter des dépenses.
              </p>
            </div>
          )}
        </div>


        {/* Filtrage des dépenses (Filtres) */}
        <ExpensesFilter
          vehicles={vehicles}
          expenses={expenses}
          filters={filters}
          onChange={setFilters}
        />

        {/* Statistiques et cartes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total des dépenses</p>
                  <p className="text-2xl font-bold">{totalExpenses.toLocaleString()} DH</p>
                  <p className="text-sm text-blue-600">Tous véhicules</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Dépenses du mois actuel</p>
                  <p className="text-2xl font-bold">{currentMonthExpenses.toLocaleString()} DH</p>
                  <p className="text-sm text-green-600">Réparties mensuellement</p>
                </div>
                <Calculator className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nombre de dépenses</p>
                  <p className="text-2xl font-bold">{expenses.length}</p>
                  <p className="text-sm text-purple-600">dépenses enregistrées</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques supplémentaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Distribution des types de dépenses en secteurs Pie */}
          <ExpenseTypePieChart expenses={filteredExpenses} />
          {/* Dépenses mensuelles par véhicule vertical */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedVehicleId
                  ? `Dépenses mensuelles pour ${vehicles.find(v => v.id === selectedVehicleId)?.brand || ""} ${vehicles.find(v => v.id === selectedVehicleId)?.model || ""} ${vehicles.find(v => v.id === selectedVehicleId)?.year || ""}`
                  : "Dépenses mensuelles par véhicule"}
              </CardTitle>
              <CardDescription>
                {selectedVehicleId
                  ? "Répartition des dépenses mensuelles pour ce véhicule"
                  : "Comparaison des dépenses mensuelles entre tous les véhicules"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedVehicleId ? (
                // Graphique pour le véhicule sélectionné
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={
                      // Préparer les données dans le même format que monthlyByVehicle mais pour un seul véhicule
                      (() => {
                        const v = vehicles.find(veh => veh.id === selectedVehicleId);
                        const amount = vehicleMonthlyExpenses.reduce((sum, m) => sum + Number(m.allocated_amount || 0), 0);
                        return v ? [{ vehicle: `${v.brand} ${v.model} ${v.year}`, amount }] : [];
                      })()
                    }
                    layout="vertical"
                    margin={{ left: 30, right: 10, top: 16, bottom: 16 }}
                  >
                    <XAxis type="number" tickFormatter={v => `${v.toLocaleString()} DH`} />
                    <YAxis dataKey="vehicle" type="category" tick={{ fontSize: 13 }} width={110} />
                    <Tooltip formatter={v => `${Number(v).toLocaleString()} DH`} />
                    <Bar dataKey="amount" fill="#3B82F6" name="Coût mensuel" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                // Forme habituelle
                monthlyByVehicle.length === 0 ? (
                  <div className="flex justify-center items-center h-56 text-gray-400">
                    Données insuffisantes
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyByVehicle} layout="vertical" margin={{ left: 30, right: 10, top: 16, bottom: 16 }}>
                      <XAxis type="number" tickFormatter={v => `${v.toLocaleString()} DH`} />
                      <YAxis dataKey="vehicle" type="category" tick={{ fontSize: 13 }} width={110} />
                      <Tooltip formatter={v => `${Number(v).toLocaleString()} DH`} />
                      <Bar dataKey="amount" fill="#3B82F6" name="Coût mensuel" />
                    </BarChart>
                  </ResponsiveContainer>
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* Graphique par défaut ancien (mensuel par type & mois) */}
        <div className="mb-8">
          <MonthlyExpenseChart monthlyExpenses={vehicleMonthlyExpenses} />
        </div>

        {/* Tableau des dépenses après filtrage */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Dépenses</CardTitle>
            <CardDescription>
              Toutes les dépenses enregistrées avec détails et répartition mensuelle
              {selectedVehicleId && (
                <span className="ml-3 text-blue-700 font-medium">
                  - {vehicles.find(v => v.id === selectedVehicleId)?.brand}{" "}
                  {vehicles.find(v => v.id === selectedVehicleId)?.model}{" "}
                  {vehicles.find(v => v.id === selectedVehicleId)?.year}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpensesTable
              expenses={filteredExpenses}
              vehicles={vehicles}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
              loading={loading}
            />
          </CardContent>
        </Card>

        {/* Dialogue */}
        <ExpenseFormDialog
          open={showExpenseDialog}
          onOpenChange={setShowExpenseDialog}
          onSave={editingExpense ? 
            (data) => updateExpense(editingExpense.id, data) :
            addExpense
          }
          vehicles={vehicles}
          expense={editingExpense}
        />
      </div>
    </div>
  );
};

export default Expenses;
