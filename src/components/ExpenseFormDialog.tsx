
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Expense } from "@/types/expense";
import { Vehicle } from "@/hooks/useVehicles";
import ExpenseImageUploader from "./ExpenseImageUploader";
import ExpenseFormFields from "./expense/ExpenseFormFields";

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'monthly_cost'>) => Promise<any>;
  vehicles: Vehicle[];
  expense?: Expense | null;
}

const ExpenseFormDialog = ({ open, onOpenChange, onSave, vehicles, expense }: ExpenseFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [expenseImageUrl, setExpenseImageUrl] = useState<string>("");
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (open) {
      if (expense) {
        setValue("vehicle_id", expense.vehicle_id);
        setValue("type", expense.type);
        setValue("total_cost", expense.total_cost);
        setValue("start_date", expense.start_date);
        setValue("end_date", expense.end_date);
        setValue("document_url", expense.document_url || "");
        setValue("notes", expense.notes || "");
        setExpenseImageUrl(expense.document_url || "");
      } else {
        reset();
        setExpenseImageUrl("");
      }
    }
  }, [open, expense, setValue, reset]);

  const handleSaveExpense = async (data: any) => {
    setLoading(true);
    
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    const monthsDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    
    const expenseData = {
      ...data,
      total_cost: parseFloat(data.total_cost),
      period_months: Math.max(1, monthsDiff),
      document_url: expenseImageUrl || data.document_url || null
    };
    
    console.log('Saving expense data:', expenseData);
    const result = await onSave(expenseData);
    if (result) {
      reset();
      setExpenseImageUrl("");
      onOpenChange(false);
    }
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    setExpenseImageUrl("");
    onOpenChange(false);
  };

  const handleImageUpload = (url: string) => {
    setExpenseImageUrl(url);
    setValue("document_url", url);
  };

  const handleImageRemove = () => {
    setExpenseImageUrl("");
    setValue("document_url", "");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {expense ? "Modifier la dépense" : "Ajouter une nouvelle dépense"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleSaveExpense)} className="space-y-4">
          <ExpenseFormFields
            register={register}
            setValue={setValue}
            errors={errors}
            vehicles={vehicles}
            expense={expense}
          />

          <ExpenseImageUploader
            label="Image de la dépense (optionnel)"
            initialUrl={expenseImageUrl}
            onUploaded={handleImageUpload}
            onRemoved={handleImageRemove}
          />

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseFormDialog;
