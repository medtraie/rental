
import { localStorageService } from "@/services/localStorageService";
import { Expense, MonthlyExpense } from "@/types/expense";

const EXPENSE_DATA_TYPE = "expenses";
const MONTHLY_EXPENSE_DATA_TYPE = "monthly_expenses";

export const expenseService = {
  async fetchExpenses(): Promise<Expense[]> {
    return localStorageService.getAll<Expense>(EXPENSE_DATA_TYPE);
  },

  async fetchMonthlyExpenses(): Promise<MonthlyExpense[]> {
    return localStorageService.getAll<MonthlyExpense>(MONTHLY_EXPENSE_DATA_TYPE);
  },

  async addExpense(expenseData: Omit<Expense, "id" | "created_at" | "updated_at">): Promise<Expense> {
    const monthlyExpense = expenseData.total_cost / (expenseData.period_months || 1);
    const newExpense = localStorageService.add<Expense>(EXPENSE_DATA_TYPE, { ...expenseData, monthly_cost: monthlyExpense });
    await this.createMonthlyExpenseRecords(newExpense);
    return newExpense;
  },

  async updateExpense(id: string, expenseData: Partial<Expense>): Promise<Expense> {
    const existingExpense = localStorageService.get<Expense>(EXPENSE_DATA_TYPE, id);
    if (!existingExpense) {
      throw new Error("Expense not found");
    }

    let updateData = { ...existingExpense, ...expenseData };

    if (expenseData.total_cost !== undefined || expenseData.period_months !== undefined) {
      const totalCost = expenseData.total_cost ?? existingExpense.total_cost;
      const periodMonths = expenseData.period_months ?? existingExpense.period_months;
      updateData.monthly_cost = totalCost / (periodMonths || 1);
    }

    const updatedExpense = localStorageService.update<Expense>(EXPENSE_DATA_TYPE, updateData);

    if (
      expenseData.total_cost !== undefined ||
      expenseData.period_months !== undefined ||
      expenseData.start_date !== undefined ||
      expenseData.end_date !== undefined
    ) {
      await localStorageService.deleteWhere(MONTHLY_EXPENSE_DATA_TYPE, (record) => record.expense_id === id);
      await this.createMonthlyExpenseRecords(updatedExpense);
    }

    return updatedExpense;
  },

  async deleteExpense(id: string): Promise<void> {
    localStorageService.delete(EXPENSE_DATA_TYPE, id);
    await localStorageService.deleteWhere(MONTHLY_EXPENSE_DATA_TYPE, (record) => record.expense_id === id);
  },

  async createMonthlyExpenseRecords(expense: Expense): Promise<void> {
    const startDate = new Date(expense.start_date);
    const endDate = new Date(expense.end_date);
    const monthlyRecords: Omit<MonthlyExpense, "id" | "created_at" | "updated_at">[] = [];

    const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (currentDate <= endDate) {
      const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

      monthlyRecords.push({
        expense_id: expense.id,
        vehicle_id: expense.vehicle_id,
        month_year: monthYear,
        allocated_amount: expense.monthly_cost || 0,
        expense_type: expense.type,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    if (monthlyRecords.length > 0) {
      monthlyRecords.forEach((record) => {
        localStorageService.add(MONTHLY_EXPENSE_DATA_TYPE, record);
      });
    }
  },
};
