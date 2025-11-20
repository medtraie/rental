
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Customer } from "@/hooks/useCustomers";

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => void;
}

const CustomerFormDialog = ({ open, onOpenChange, onSave }: CustomerFormDialogProps) => {
  const [formData, setFormData] = useState({
    last_name: "",
    first_name: "",
    address_morocco: "",
    phone: "",
    address_foreign: "",
    cin: "",
    cin_delivered: "",
    license_number: "",
    license_delivered: "",
    passport_number: "",
    passport_delivered: "",
    birth_date: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.last_name.trim()) {
      return;
    }

    onSave(formData);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      last_name: "",
      first_name: "",
      address_morocco: "",
      phone: "",
      address_foreign: "",
      cin: "",
      cin_delivered: "",
      license_number: "",
      license_delivered: "",
      passport_number: "",
      passport_delivered: "",
      birth_date: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau client</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="last_name">Nom de famille *</Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom</Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cin">Numéro de carte d'identité</Label>
            <Input
              id="cin"
              name="cin"
              value={formData.cin}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_morocco">Adresse au Maroc</Label>
            <Input
              id="address_morocco"
              name="address_morocco"
              value={formData.address_morocco}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_number">Numéro de permis de conduire</Label>
            <Input
              id="license_number"
              name="license_number"
              value={formData.license_number}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerFormDialog;
