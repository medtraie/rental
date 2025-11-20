import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Repair, RepairFormData } from "@/types/repair";
import { Vehicle } from "@/hooks/useVehicles";

interface RepairFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: RepairFormData, file: File | null) => void;
  repair?: Repair | null;
  vehicles: Vehicle[];
}

const RepairFormDialog = ({ open, onOpenChange, onSave, repair, vehicles }: RepairFormDialogProps) => {
  const [formData, setFormData] = useState<RepairFormData>({
    vehicleId: "",
    typeReparation: "Mécanique",
    cout: 0,
    paye: 0,
    dette: 0,
    dateReparation: "",
    paymentMethod: "Espèces",
    checkName: "",
    checkReference: "",
    checkDate: "",
    checkDepositDate: "",
    note: "",
  });
  
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or when editing different repair
  useEffect(() => {
    if (open) {
      if (repair) {
        // Editing existing repair
        setFormData({
          vehicleId: repair.vehicleId,
          typeReparation: repair.typeReparation,
          cout: repair.cout,
          paye: repair.paye,
          dette: repair.dette,
          dateReparation: repair.dateReparation,
          paymentMethod: repair.paymentMethod,
          checkName: repair.checkName || "",
          checkReference: repair.checkReference || "",
          checkDate: repair.checkDate || "",
          checkDepositDate: repair.checkDepositDate || "",
          note: repair.note,
        });
        setSelectedDate(new Date(repair.dateReparation));
      } else {
        // Adding new repair
        setFormData({
          vehicleId: "",
          typeReparation: "Mécanique",
          cout: 0,
          paye: 0,
          dette: 0,
          dateReparation: "",
          paymentMethod: "Espèces",
          checkName: "",
          checkReference: "",
          checkDate: "",
          checkDepositDate: "",
          note: "",
        });
        setSelectedDate(undefined);
      }
      setSelectedFile(null);
      setErrors({});
    }
  }, [open, repair]);

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.vehicleId) {
      newErrors.vehicleId = "Veuillez sélectionner un véhicule";
    }
    if (!formData.cout || formData.cout <= 0) {
      newErrors.cout = "Veuillez saisir un coût valide";
    }
    if (!formData.dateReparation) {
      newErrors.dateReparation = "Veuillez sélectionner une date de réparation";
    }
    if (!formData.note.trim()) {
      newErrors.note = "Veuillez saisir une remarque";
    }

    // Check if date is not in the future
    if (formData.dateReparation) {
      const repairDate = new Date(formData.dateReparation);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (repairDate > today) {
        newErrors.dateReparation = "La date de réparation ne peut pas être dans le futur";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSave(formData, selectedFile);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setFormData(prev => ({
      ...prev,
      dateReparation: date ? date.toISOString().split('T')[0] : "",
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, file: "Type de fichier non supporté. Types supportés : JPG, PNG, PDF" }));
        return;
      }

      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, file: "Fichier trop volumineux. Taille maximale : 5 Mo" }));
        return;
      }

      setSelectedFile(file);
      setErrors(prev => ({ ...prev, file: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {repair ? "Modifier la Réparation" : "Ajouter une Nouvelle Réparation"}
          </DialogTitle>
          <DialogDescription>
            {repair ? "Modifier les données de la réparation sélectionnée" : "Ajouter une nouvelle opération de réparation ou maintenance"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="grid gap-4 py-4">
          {/* Vehicle Selection */}
          <div className="grid gap-2">
            <Label htmlFor="vehicle">Sélectionner le véhicule *</Label>
            <Select 
              value={formData.vehicleId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, vehicleId: value }))}
            >
              <SelectTrigger className={cn(errors.vehicleId && "border-red-500")}>
                <SelectValue placeholder="--- Choisir le véhicule ---" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.marque} {vehicle.modele} - {vehicle.immatriculation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vehicleId && <p className="text-sm text-red-500">{errors.vehicleId}</p>}
          </div>

          {/* Display vehicle info when selected */}
          {selectedVehicle && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Informations du véhicule :</p>
              <p className="text-sm text-gray-600">
                {selectedVehicle.marque} {selectedVehicle.modele} - {selectedVehicle.immatriculation}
              </p>
            </div>
          )}

          {/* Repair Type */}
          <div className="grid gap-2">
            <Label htmlFor="type">Type de Réparation *</Label>
            <Select 
              value={formData.typeReparation} 
              onValueChange={(value: "Mécanique" | "Électrique" | "Garage") => 
                setFormData(prev => ({ ...prev, typeReparation: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mécanique">🔧 Mécanique</SelectItem>
                <SelectItem value="Électrique">⚡ Électrique</SelectItem>
                <SelectItem value="Garage">🏢 Garage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cost */}
          <div className="grid gap-2">
            <Label htmlFor="cost">Coût Total (MAD) *</Label>
            <Input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              value={formData.cout || ""}
              onChange={(e) => {
                const cout = parseFloat(e.target.value) || 0;
                setFormData(prev => ({ 
                  ...prev, 
                  cout,
                  dette: cout - prev.paye
                }));
              }}
              placeholder="0.00"
              className={cn(errors.cout && "border-red-500")}
            />
            {errors.cout && <p className="text-sm text-red-500">{errors.cout}</p>}
          </div>

          {/* Paid Amount */}
          <div className="grid gap-2">
            <Label htmlFor="paye">Payé (MAD) *</Label>
            <Input
              id="paye"
              type="number"
              min="0"
              step="0.01"
              value={formData.paye || ""}
              onChange={(e) => {
                const paye = parseFloat(e.target.value) || 0;
                setFormData(prev => ({ 
                  ...prev, 
                  paye,
                  dette: prev.cout - paye
                }));
              }}
              placeholder="0.00"
            />
          </div>

          {/* Debt Amount */}
          <div className="grid gap-2">
            <Label htmlFor="dette">Dette (MAD)</Label>
            <Input
              id="dette"
              type="number"
              value={formData.dette || ""}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Payment Method */}
          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">Mode de paiement *</Label>
            <Select 
              value={formData.paymentMethod} 
              onValueChange={(value: 'Espèces' | 'Virement' | 'Chèque') => 
                setFormData(prev => ({ ...prev, paymentMethod: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Espèces">💵 Espèces</SelectItem>
                <SelectItem value="Virement">🏦 Virement</SelectItem>
                <SelectItem value="Chèque">🧾 Chèque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Check-specific fields */}
          {formData.paymentMethod === "Chèque" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="checkName">Nom complet *</Label>
                <Input
                  id="checkName"
                  value={formData.checkName}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkName: e.target.value }))}
                  placeholder="Nom et prénom"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="checkReference">Référence du chèque *</Label>
                <Input
                  id="checkReference"
                  value={formData.checkReference}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkReference: e.target.value }))}
                  placeholder="Ex: CHQ-123456"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="checkDate">Date du chèque *</Label>
                <Input
                  id="checkDate"
                  type="date"
                  value={formData.checkDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkDate: e.target.value }))}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="checkDepositDate">Date d'encaissement *</Label>
                <Input
                  id="checkDepositDate"
                  type="date"
                  value={formData.checkDepositDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkDepositDate: e.target.value }))}
                  required
                />
              </div>
            </>
          )}

          {/* Repair Date */}
          <div className="grid gap-2">
            <Label>Date de Réparation *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                    errors.dateReparation && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Choisir la date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.dateReparation && <p className="text-sm text-red-500">{errors.dateReparation}</p>}
          </div>

          {/* File Upload */}
          <div className="grid gap-2">
            <Label htmlFor="file">Pièces jointes (facture ou photo)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="file:mr-2 file:rounded file:border-0 file:bg-primary file:text-primary-foreground"
              />
              <Upload className="h-4 w-4 text-gray-400" />
            </div>
            {selectedFile && (
              <p className="text-sm text-green-600">Fichier sélectionné : {selectedFile.name}</p>
            )}
            {errors.file && <p className="text-sm text-red-500">{errors.file}</p>}
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="note">Remarques *</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Exemple : Changement des freins avant, nettoyage du moteur..."
              className={cn(errors.note && "border-red-500")}
              rows={3}
            />
            {errors.note && <p className="text-sm text-red-500">{errors.note}</p>}
          </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700">
            {repair ? "Mettre à jour" : "Sauvegarder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RepairFormDialog;
