
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomers, Customer } from "@/hooks/useCustomers";
import CustomerFormDialog from "./CustomerFormDialog";

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
}

const CustomerSelector = ({ selectedCustomer, onCustomerSelect }: CustomerSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const { customers, loading, addCustomer } = useCustomers();

  const handleCustomerCreate = async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
    const newCustomer = await addCustomer(customerData);
    if (newCustomer) {
      onCustomerSelect(newCustomer);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCustomer 
              ? `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name}`.trim()
              : "Choisir un client..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Rechercher un client..." />
            <CommandList>
              <CommandEmpty>Aucun client trouvé</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setShowCustomerDialog(true);
                    setOpen(false);
                  }}
                  className="font-medium text-blue-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un nouveau client
                </CommandItem>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    onSelect={() => {
                      onCustomerSelect(customer);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{`${customer.first_name || ''} ${customer.last_name}`.trim()}</span>
                      {customer.phone && (
                        <span className="text-sm text-gray-500">{customer.phone}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CustomerFormDialog
        open={showCustomerDialog}
        onOpenChange={setShowCustomerDialog}
        onSave={handleCustomerCreate}
      />
    </>
  );
};

export default CustomerSelector;
