
import { useState, useEffect } from 'react';
import { expenseService } from '@/services/expenseService';
import { useExpenseToasts } from '@/utils/expenseUtils';
import { Expense, MonthlyExpense } from '@/types/expense';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError, showSuccess } = useExpenseToasts();

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await expenseService.fetchExpenses();
      setExpenses(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur s’est produite lors du chargement des dépenses";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyExpenses = async () => {
    try {
      setError(null);
      const data = await expenseService.fetchMonthlyExpenses();
      setMonthlyExpenses(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur s’est produite lors du chargement des dépenses mensuelles";
      setError(errorMessage);
      console.error('Hook error fetching monthly expenses:', error);
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'monthly_cost'>) => {
    try {
      setError(null);
      const newExpense = await expenseService.addExpense(expenseData);
      setExpenses(prev => [newExpense, ...prev]);
      showSuccess("Dépense ajoutée avec succès");
      
      // Refresh monthly expenses after adding
      await fetchMonthlyExpenses();
      return newExpense;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l’ajout de la dépense";
      setError(errorMessage);
      showError(errorMessage);
      return null;
    }
  };

  const updateExpense = async (id: string, expenseData: Partial<Expense>) => {
    try {
      setError(null);
      const updatedExpense = await expenseService.updateExpense(id, expenseData);
      setExpenses(prev => prev.map(exp => exp.id === id ? updatedExpense : exp));
      showSuccess("Dépense mise à jour avec succès");
      
      // Refresh monthly expenses after updating
      await fetchMonthlyExpenses();
      return updatedExpense;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la mise à jour de la dépense";
      setError(errorMessage);
      showError(errorMessage);
      return null;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      setError(null);
      await expenseService.deleteExpense(id);
      setExpenses(prev => prev.filter(exp => exp.id !== id));
      showSuccess("Dépense supprimée avec succès");
      
      // Refresh monthly expenses after deleting
      await fetchMonthlyExpenses();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la suppression de la dépense";
      setError(errorMessage);
      showError(errorMessage);
      return false;
    }
  };

  const refetch = async () => {
    await Promise.all([fetchExpenses(), fetchMonthlyExpenses()]);
  };

  useEffect(() => {
    fetchExpenses();
    fetchMonthlyExpenses();
  }, []);

  return {
    expenses,
    monthlyExpenses,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch
  };
};
