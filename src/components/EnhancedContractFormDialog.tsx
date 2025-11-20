import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VehicleDiagram from "./VehicleDiagram";
import FuelGauge from "./FuelGauge";
import CustomerSelector from "./CustomerSelector";
import VehicleSelector from "./VehicleSelector";
import ContractSignatureFields from "./contracts/ContractSignatureFields";
import { usePDFGeneration, ContractPDFData } from "@/hooks/usePDFGeneration";
import { Customer } from "@/hooks/useCustomers";
import { Vehicle } from "@/hooks/useVehicles";
import { Contract } from "@/hooks/useContracts";
import { computeContractSummary, computeTotal, daysBetween } from "@/utils/contractMath";
import { format } from "date-fns";

interface ContractFormDialogProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (updatedContract: Contract) => void;
  mode: 'view' | 'edit';
  contracts?: any[]; // Pour calculer la prochaine série
}

interface DamagePoint {
  id: string;
  x: number;
  y: number;
}

const EnhancedContractFormDialog = ({ contract, open, onOpenChange, onSave, mode, contracts = [] }: ContractFormDialogProps) => {
  const { toast } = useToast();
  const { generatePDF, generatePDFBlob } = usePDFGeneration();

  // Customer and Vehicle state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [formData, setFormData] = useState({
    // Locataire (Main Renter)
    customerLastName: "",
    customerFirstName: "",
    customerAddressMorocco: "",
    customerPhone: "",
    customerAddressForeign: "",
    customerCin: "",
    customerCinDelivered: "",
    customerLicenseNumber: "",
    customerLicenseDelivered: "",
    customerPassportNumber: "",
    customerPassportDelivered: "",
    customerBirthDate: "",
    
    // 2ème Conducteur (Second Driver) - Optional
    secondDriverLastName: "",
    secondDriverFirstName: "",
    secondDriverAddressMorocco: "",
    secondDriverPhone: "",
    secondDriverAddressForeign: "",
    secondDriverCin: "",
    secondDriverCinDelivered: "",
    secondDriverLicenseNumber: "",
    secondDriverLicenseDelivered: "",
    secondDriverPassportNumber: "",
    secondDriverPassportDelivered: "",
    
    // Véhicule - Livraison du Véhicule
    vehicleBrand: "",
    vehicleModel: "",
    vehicleRegistration: "",
    vehicleYear: "",
    vehicleKmDepart: "",
    deliveryLocation: "",
    deliveryDateTime: "",
    rentalDays: "",
    vehicleStateDelivery: "",
    emergencyEquipmentDelivery: "",
    observationsDelivery: "",
    
    // Véhicule - Reprise du Véhicule
    returnDateTime: "",
    returnLocation: "",
    extensionUntil: "",
    vehicleKmReturn: "",
    extendedDays: "",
    vehicleStateReturn: "",
    emergencyEquipmentReturn: "",
    observationsReturn: "",
    
    // Facturation
    dailyPrice: "",
    totalPrice: "",
    advance: "",
    remaining: "",
    paymentMethod: "",
    
    // Signatures
    deliveryDate: "",
    returnDate: "",
    delivery_agent_signature: "",
    delivery_tenant_signature: "",
    return_agent_signature: "",
    return_tenant_signature: "",

    // Contract Serie
    contractSerie: ""
  });

  // Calculate next contract series
  const getNextContractSerie = (contracts: any[]) => {
    if (!contracts || contracts.length === 0) {
      return "BONA2025001";
    }
    
    // Trouver le plus grand numéro de série
    let maxNumber = 0;
    contracts.forEach(contract => {
      const contractNumber = contract.contract_number || contract.contractSerie || "";
      const match = contractNumber.match(/BONA(\d{4})(\d{3})/);
      if (match) {
        const year = parseInt(match[1]);
        const number = parseInt(match[2]);
        if (year === new Date().getFullYear() && number > maxNumber) {
          maxNumber = number;
        }
      }
    });
    
    const currentYear = new Date().getFullYear();
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
    return `BONA${currentYear}${nextNumber}`;
  };

  // Interactive elements state
  const [deliveryFuelLevel, setDeliveryFuelLevel] = useState(100);
  const [returnFuelLevel, setReturnFuelLevel] = useState(100);
  const [deliveryDamages, setDeliveryDamages] = useState<DamagePoint[]>([]);
  const [returnDamages, setReturnDamages] = useState<DamagePoint[]>([]);

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerLastName: customer.last_name,
        customerFirstName: customer.first_name || "",
        customerPhone: customer.phone || "",
        customerCin: customer.cin || "",
        customerAddressMorocco: customer.address_morocco || "",
        customerLicenseNumber: customer.license_number || "",
        customerBirthDate: customer.birth_date || "",
      }));
    }
  };

  // Handle vehicle selection
  const handleVehicleSelect = (vehicle: Vehicle | null) => {
    setSelectedVehicle(vehicle);
    if (vehicle) {
      setFormData(prev => ({
        ...prev,
        vehicleBrand: vehicle.brand,
        vehicleModel: vehicle.model || "",
        vehicleYear: vehicle.year?.toString() || "",
        vehicleRegistration: vehicle.registration || "",
      }));
    }
  };

  // Load contract data when editing
  useEffect(() => {
    if (contract && open) {
      // Parse customer name (assuming format "FirstName LastName")
      const nameParts = contract.customer_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Parse vehicle info (assuming format "Brand Model Year")
      const vehicleParts = contract.vehicle.split(' ');
      const brand = vehicleParts[0] || '';
      const model = vehicleParts.slice(1, -1).join(' ') || '';
      const year = vehicleParts[vehicleParts.length - 1] || '';

      // Calculate rental duration using centralized function
      const startDate = new Date(contract.start_date);
      const endDate = new Date(contract.end_date);
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      const diffDays = daysBetween(startDateStr, endDateStr, { inclusive: false });

      // Load preserved contract data if available
      const savedData = contract.contract_data || {};
      
      // 🚨 CRITICAL FIX: Ensure both rental fields have the same value
      const correctRentalValue = savedData.rentalDuration || savedData.rentalDays || diffDays.toString();
      console.log(`[🚨 CONTRACT LOAD] Setting both rentalDays and rentalDuration to: ${correctRentalValue}`);

      setFormData({
        customerLastName: savedData.customerLastName || lastName,
        customerFirstName: savedData.customerFirstName || firstName,
        customerAddressMorocco: savedData.customerAddressMorocco || "",
        customerPhone: savedData.customerPhone || contract.customer_phone || "",
        customerAddressForeign: savedData.customerAddressForeign || "",
        customerCin: savedData.customerCin || contract.customer_national_id || "",
        customerCinDelivered: savedData.customerCinDelivered || "",
        customerLicenseNumber: savedData.customerLicenseNumber || "",
        customerLicenseDelivered: savedData.customerLicenseDelivered || "",
        customerPassportNumber: savedData.customerPassportNumber || "",
        customerPassportDelivered: savedData.customerPassportDelivered || "",
        customerBirthDate: savedData.customerBirthDate || "",
        secondDriverLastName: savedData.secondDriverLastName || "",
        secondDriverFirstName: savedData.secondDriverFirstName || "",
        secondDriverAddressMorocco: savedData.secondDriverAddressMorocco || "",
        secondDriverPhone: savedData.secondDriverPhone || "",
        secondDriverAddressForeign: savedData.secondDriverAddressForeign || "",
        secondDriverCin: savedData.secondDriverCin || "",
        secondDriverCinDelivered: savedData.secondDriverCinDelivered || "",
        secondDriverLicenseNumber: savedData.secondDriverLicenseNumber || "",
        secondDriverLicenseDelivered: savedData.secondDriverLicenseDelivered || "",
        secondDriverPassportNumber: savedData.secondDriverPassportNumber || "",
        secondDriverPassportDelivered: savedData.secondDriverPassportDelivered || "",
        vehicleBrand: savedData.vehicleBrand || brand,
        vehicleModel: savedData.vehicleModel || model,
        vehicleRegistration: savedData.vehicleRegistration || "",
        vehicleYear: savedData.vehicleYear || year,
        vehicleKmDepart: savedData.vehicleKmDepart || "0",
        deliveryLocation: savedData.deliveryLocation || "",
        deliveryDateTime: savedData.deliveryDateTime || contract.start_date + "T09:00",
        rentalDays: correctRentalValue,
        vehicleStateDelivery: savedData.vehicleStateDelivery || "",
        emergencyEquipmentDelivery: savedData.emergencyEquipmentDelivery || "",
        observationsDelivery: savedData.observationsDelivery || contract.notes || "",
        returnDateTime: savedData.returnDateTime || contract.end_date + "T18:00",
        returnLocation: savedData.returnLocation || "",
        extensionUntil: savedData.extensionUntil || "",
        vehicleKmReturn: savedData.vehicleKmReturn || "",
        extendedDays: savedData.extendedDays || "0",
        vehicleStateReturn: savedData.vehicleStateReturn || "",
        emergencyEquipmentReturn: savedData.emergencyEquipmentReturn || "",
        observationsReturn: savedData.observationsReturn || "",
        dailyPrice: savedData.dailyPrice || contract.daily_rate?.toString() || "0",
        totalPrice: savedData.totalPrice || contract.total_amount.toString(),
        // 🚨 CRITICAL DEBUG: Log advance values being used
        ...(() => {
          console.log(`[💰 ADVANCE DEBUG] Contract ID: ${contract.id}`);
           console.log(`[💰 ADVANCE DEBUG] savedData.advance: ${savedData?.advance} MAD`);
           console.log(`[💰 ADVANCE DEBUG] contract.advance_payment: ${contract.advance_payment} MAD`);
           console.log(`[💰 ADVANCE DEBUG] Final advance value: ${savedData?.advance || contract.advance_payment?.toString() || "0"} MAD`);
          return {};
        })(),
        // 🚨 CRITICAL: Always prioritize contract.advance_payment over cached data to maintain consistency
        advance: (() => {
          const contractAdvance = contract.advance_payment?.toString() || "0";
          const cachedAdvance = savedData?.advance || "0";
          
          console.log(`[🔧 FORM LOAD] Contract advance_payment: ${contractAdvance} DH`);
          console.log(`[🔧 FORM LOAD] Cached advance: ${cachedAdvance} DH`);
          
          // Always use the contract's stored advance_payment to avoid discrepancies
          console.log(`[✅ FORM LOAD] Using contract advance_payment: ${contractAdvance} DH`);
          return contractAdvance;
        })(),
        remaining: savedData.remaining || contract.total_amount.toString(),
        paymentMethod: savedData.paymentMethod || contract.payment_method || "",
        deliveryDate: savedData.deliveryDate || contract.start_date,
        returnDate: savedData.returnDate || contract.end_date,
        delivery_agent_signature: savedData.delivery_agent_signature || "",
        delivery_tenant_signature: savedData.delivery_tenant_signature || "",
        return_agent_signature: savedData.return_agent_signature || "",
        return_tenant_signature: savedData.return_tenant_signature || "",
        contractSerie: contract.contract_number || savedData.contractSerie || getNextContractSerie(contracts)
      });

      // CRITICAL FIX: Restore interactive elements with detailed logging
      const restoredDeliveryFuel = contract.delivery_fuel_level ?? savedData.delivery_fuel_level ?? 100;
      const restoredReturnFuel = contract.return_fuel_level ?? savedData.return_fuel_level ?? 100; 
      const restoredDeliveryDamages = contract.delivery_damages ?? savedData.delivery_damages ?? [];
      const restoredReturnDamages = contract.return_damages ?? savedData.return_damages ?? [];

    // 🚨 CRITICAL DEBUG: Check if there's cached form data that's overriding contract values
    const localStorageKey = `contract_form_${contract.id}`;
    const cachedData = localStorage.getItem(localStorageKey);
    if (cachedData) {
      console.log(`[⚠️ CACHE WARNING] Found cached data for contract ${contract.id}:`, JSON.parse(cachedData));
      console.log(`[⚠️ CACHE WARNING] This might be overriding actual contract advance_payment: ${contract.advance_payment} DH`);
    }
    
    console.log(`[EnhancedContractFormDialog] Restoring contract ${contract.id}:`);
    console.log(`- Contract advance_payment: ${contract.advance_payment} DH`);
    console.log(`- SavedData advance: ${savedData?.advance} DH`);
    console.log(`- Final form advance: ${savedData?.advance || contract.advance_payment?.toString() || "0"} DH`);
      console.log(`- Delivery fuel: ${restoredDeliveryFuel}`);
      console.log(`- Return fuel: ${restoredReturnFuel}`);
      console.log(`- Delivery damages:`, restoredDeliveryDamages);
      console.log(`- Return damages:`, restoredReturnDamages);

      setDeliveryFuelLevel(restoredDeliveryFuel);
      setReturnFuelLevel(restoredReturnFuel);
      setDeliveryDamages(restoredDeliveryDamages);
      setReturnDamages(restoredReturnDamages);
    }
  }, [contract, open]);

  // 🎯 SOLUTION DEFINITIVE: Une seule fonction pour synchroniser les champs
  const handleRentalDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log(`[🚨 RENTAL DAYS CHANGE] Nouvelle valeur: ${value}`);
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        rentalDays: value,
        extendedDays: "0", // Reset extensions
        extensionUntil: ""
      };
      console.log(`[✅ FORMDATA UPDATED] rentalDays: ${value}, Durée calculée: ${(parseInt(value) || 0) + (parseInt(newFormData.extendedDays) || 0)}`);
      return newFormData;
    });
  };

  // Calcul en temps réel de la durée - utilisation de la logique centralisée
  const getCurrentDuration = () => {
    // Priorité à la valeur saisie manuellement
    const manualDays = parseInt(formData.rentalDays) || 0;
    const extendedDays = parseInt(formData.extendedDays) || 0;
    
    // Si on a des dates ET aucune valeur manuelle, calculer depuis les dates
    if ((!manualDays || manualDays === 0) && formData.deliveryDateTime && formData.returnDateTime) {
      const startDate = formData.deliveryDateTime.substring(0, 10);
      const endDate = formData.returnDateTime.substring(0, 10);
      const calculatedDuration = daysBetween(startDate, endDate, { inclusive: false });
      return calculatedDuration + extendedDays;
    }
    
    // Sinon utiliser la valeur manuelle
    return Math.max(1, manualDays + extendedDays);
  };

  // Plus besoin de synchronisation - une seule source de vérité

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    console.log(`[🔥 INPUT] Field changed: ${name} = "${value}"`);
    
    setFormData(prev => {
      let newData = {
        ...prev,
        [name]: value
      };

      // *** 🎯 SOURCE UNIQUE: Plus de synchronisation nécessaire ***
      // rentalDays est la seule source de vérité
      
      // Handle extension logic - modifier seulement rentalDays
      if (name === 'extensionUntil' && value) {
        const originalEndDate = new Date(prev.returnDateTime || prev.deliveryDateTime);
        const extensionDate = new Date(value);
        if (extensionDate > originalEndDate) {
          const startDateStr = format(originalEndDate, 'yyyy-MM-dd');
          const endDateStr = format(extensionDate, 'yyyy-MM-dd');
          const diffDays = daysBetween(startDateStr, endDateStr, { inclusive: false });
          newData.extendedDays = diffDays.toString();
          console.log(`[📊 EXTENSION AUTO] Extended by ${diffDays} days`);
        }
      }

      if (name === 'extendedDays' && value && parseInt(value) > 0) {
        const originalEndDate = new Date(prev.returnDateTime || prev.deliveryDateTime);
        const extensionDate = new Date(originalEndDate);
        extensionDate.setDate(extensionDate.getDate() + parseInt(value));
        newData.extensionUntil = extensionDate.toISOString().split('T')[0];
        console.log(`[📊 EXTENSION MANUAL] Extended by ${value} days`);
      }

      // حساب الأسعار عند تغيير السعر اليومي أو العربون

      // Recalculs pour autres champs financiers avec gestion des impayés
      if (name === 'dailyPrice' || name === 'advance') {
        const dailyPrice = parseFloat(name === 'dailyPrice' ? value : newData.dailyPrice) || 0;
        const currentRentalDays = parseInt(newData.rentalDays) || 0;
        const currentExtendedDays = parseInt(newData.extendedDays) || 0;
        let duration = currentRentalDays + currentExtendedDays;
        const advance = parseFloat(name === 'advance' ? value : newData.advance) || 0;
        
        // Ajouter les jours impayés si le contrat est ouvert et dépassé
        if (contract && contract.status === 'ouvert') {
          try {
            const today = new Date();
            let effectiveEndDate = new Date();
            
            if (newData.returnDateTime) {
              effectiveEndDate = new Date(newData.returnDateTime);
            } else if (contract.end_date) {
              effectiveEndDate = new Date(contract.end_date);
            }
            
            // Ajouter les prolongations si présentes
            const extendedDays = parseInt(newData.extendedDays) || 0;
            if (newData.extensionUntil && newData.extensionUntil !== "") {
              effectiveEndDate = new Date(newData.extensionUntil);
            } else if (extendedDays > 0) {
              effectiveEndDate.setDate(effectiveEndDate.getDate() + extendedDays);
            }
            
            // Calculer les jours de dépassement using centralized function
            if (today > effectiveEndDate) {
              const startDateStr = format(effectiveEndDate, 'yyyy-MM-dd');
              const endDateStr = format(today, 'yyyy-MM-dd');
              const overdueDays = daysBetween(startDateStr, endDateStr, { inclusive: false });
              duration += overdueDays;
            }
          } catch (error) {
            console.warn("Erreur lors du calcul des jours impayés:", error);
          }
        }
        
        const totalPrice = dailyPrice * duration;
        newData.totalPrice = totalPrice.toString();
        newData.remaining = (totalPrice - advance).toString();
      }

      return newData;
    });
  };

  // Function to check if contract should be closed automatically
  const shouldCloseContract = () => {
    const returnFields = [
      formData.returnDateTime,
      formData.returnLocation,
      formData.vehicleKmReturn,
      formData.returnDate
    ];
    
    // Check if at least 3 out of 4 key return fields are filled
    const filledReturnFields = returnFields.filter(field => field && field.trim() !== "").length;
    
    return filledReturnFields >= 3;
  };

  const calculateTotalPrice = () => {
    // Utiliser la logique centralisée pour calculer le prix total
    const dailyPrice = parseFloat(formData.dailyPrice) || 0;
    const totalDuration = getCurrentDuration();
    
    if (dailyPrice > 0 && totalDuration > 0) {
      const total = computeTotal(dailyPrice, totalDuration);
      console.log(`[✅ CALCUL CENTRALISÉ] Prix: ${dailyPrice} DH/j × ${totalDuration}j = ${total} DH`);
      return total;
    }
    
    console.log(`[❌ CALCUL IMPOSSIBLE] Prix: ${dailyPrice}, Durée: ${totalDuration}`);
    return 0;
    return 0;
  };

  const calculateRemaining = () => {
    const total = calculateTotalPrice();
    const advance = parseFloat(formData.advance) || 0;
    const remaining = Math.max(0, total - advance);
    
    console.log(`[💰 CALCUL RESTE] Total: ${total} DH - Avance: ${advance} DH = Reste: ${remaining} DH`);
    return remaining;
  };

  // Handle signature changes
  const handleSignatureChange = (type: string, signatureData: string) => {
    console.log(`[EnhancedContractFormDialog] handleSignatureChange called for type: ${type}`);
    console.log(`[EnhancedContractFormDialog] Signature data received: ${signatureData ? `SUCCESS - length: ${signatureData.length}` : 'EMPTY'}`);
    console.log(`[EnhancedContractFormDialog] Current formData for ${type}:`, formData[type as keyof typeof formData] ? `EXISTS - length: ${formData[type as keyof typeof formData]?.toString().length}` : 'EMPTY');
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [type]: signatureData
      };
      console.log(`[EnhancedContractFormDialog] Updated formData for ${type}:`, newFormData[type as keyof typeof newFormData] ? `SET - length: ${newFormData[type as keyof typeof newFormData]?.toString().length}` : 'EMPTY');
      return newFormData;
    });
  };

  const handleGeneratePDF = async () => {
    if (!contract) return;

    // Log all signatures before PDF generation
    console.log('[EnhancedContractFormDialog] About to generate PDF - Current signature status:');
    console.log('- delivery_agent_signature:', formData.delivery_agent_signature ? `Present (${formData.delivery_agent_signature.length} chars)` : 'MISSING');
    console.log('- delivery_tenant_signature:', formData.delivery_tenant_signature ? `Present (${formData.delivery_tenant_signature.length} chars)` : 'MISSING');
    console.log('- return_agent_signature:', formData.return_agent_signature ? `Present (${formData.return_agent_signature.length} chars)` : 'MISSING');
    console.log('- return_tenant_signature:', formData.return_tenant_signature ? `Present (${formData.return_tenant_signature.length} chars)` : 'MISSING');

    const totalPrice = calculateTotalPrice() || contract.total_amount;

    const pdfData: ContractPDFData = {
      contractNumber: formData.contractSerie,
      customerLastName: formData.customerLastName,
      customerFirstName: formData.customerFirstName,
      customerAddressMorocco: formData.customerAddressMorocco,
      customerPhone: formData.customerPhone,
      customerAddressForeign: formData.customerAddressForeign,
      customerCin: formData.customerCin,
      customerCinDelivered: formData.customerCinDelivered,
      customerLicenseNumber: formData.customerLicenseNumber,
      customerLicenseDelivered: formData.customerLicenseDelivered,
      customerPassportNumber: formData.customerPassportNumber,
      customerPassportDelivered: formData.customerPassportDelivered,
      customerBirthDate: formData.customerBirthDate,
      secondDriverLastName: formData.secondDriverLastName,
      secondDriverFirstName: formData.secondDriverFirstName,
      secondDriverAddressMorocco: formData.secondDriverAddressMorocco,
      secondDriverPhone: formData.secondDriverPhone,
      secondDriverAddressForeign: formData.secondDriverAddressForeign,
      secondDriverCin: formData.secondDriverCin,
      secondDriverCinDelivered: formData.secondDriverCinDelivered,
      secondDriverLicenseNumber: formData.secondDriverLicenseNumber,
      secondDriverLicenseDelivered: formData.secondDriverLicenseDelivered,
      secondDriverPassportNumber: formData.secondDriverPassportNumber,
      secondDriverPassportDelivered: formData.secondDriverPassportDelivered,
      vehicleBrand: formData.vehicleBrand,
      vehicleModel: formData.vehicleModel,
      vehicleRegistration: formData.vehicleRegistration,
      vehicleYear: formData.vehicleYear,
      vehicleKmDepart: formData.vehicleKmDepart,
      deliveryLocation: formData.deliveryLocation,
      deliveryDateTime: formData.deliveryDateTime,
      rentalDays: formData.rentalDays,
      emergencyEquipmentDelivery: formData.emergencyEquipmentDelivery,
      observationsDelivery: formData.observationsDelivery,
      deliveryFuelLevel,
      deliveryDamages, // CRITICAL: Pass damage points to PDF
      returnDateTime: formData.returnDateTime,
      returnLocation: formData.returnLocation, 
      extensionUntil: formData.extensionUntil,
      vehicleKmReturn: formData.vehicleKmReturn,
      extendedDays: formData.extendedDays,
      emergencyEquipmentReturn: formData.emergencyEquipmentReturn,
      observationsReturn: formData.observationsReturn,
      returnFuelLevel,
      returnDamages, // CRITICAL: Pass damage points to PDF
      dailyPrice: formData.dailyPrice,
      rentalDuration: getCurrentDuration().toString(),
      totalPrice: totalPrice,
      advance: formData.advance,
      remaining: calculateRemaining(),
      paymentMethod: formData.paymentMethod,
      deliveryDate: formData.deliveryDate,
      returnDate: formData.returnDate,
      // Include electronic signatures  
      delivery_agent_signature: formData.delivery_agent_signature,
      delivery_tenant_signature: formData.delivery_tenant_signature,
      return_agent_signature: formData.return_agent_signature,
      return_tenant_signature: formData.return_tenant_signature,
    };

    console.log('[EnhancedContractFormDialog] PDF data being sent:');
    console.log('- delivery_agent_signature in pdfData:', pdfData.delivery_agent_signature ? `Present (${pdfData.delivery_agent_signature.length} chars)` : 'MISSING');
    console.log('- delivery_tenant_signature in pdfData:', pdfData.delivery_tenant_signature ? `Present (${pdfData.delivery_tenant_signature.length} chars)` : 'MISSING');
    console.log('- return_agent_signature in pdfData:', pdfData.return_agent_signature ? `Present (${pdfData.return_agent_signature.length} chars)` : 'MISSING');
    console.log('- return_tenant_signature in pdfData:', pdfData.return_tenant_signature ? `Present (${pdfData.return_tenant_signature.length} chars)` : 'MISSING');

    const fileName = `Contrat_${formData.contractSerie}.pdf`;
    const success = await generatePDF(pdfData, fileName);
    
    if (success) {
      toast({
        title: "PDF généré",
        description: "Le contrat PDF a été généré avec succès"
      });
    } else {
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération du PDF",
        variant: "destructive"
      });
    }
  };

  const handleShareWhatsAppFull = async () => {
    if (!contract) return;

    const totalPrice = calculateTotalPrice() || contract.total_amount;

    const pdfData: ContractPDFData = {
      contractNumber: formData.contractSerie,
      customerLastName: formData.customerLastName,
      customerFirstName: formData.customerFirstName,
      customerAddressMorocco: formData.customerAddressMorocco,
      customerPhone: formData.customerPhone,
      customerAddressForeign: formData.customerAddressForeign,
      customerCin: formData.customerCin,
      customerCinDelivered: formData.customerCinDelivered,
      customerLicenseNumber: formData.customerLicenseNumber,
      customerLicenseDelivered: formData.customerLicenseDelivered,
      customerPassportNumber: formData.customerPassportNumber,
      customerPassportDelivered: formData.customerPassportDelivered,
      customerBirthDate: formData.customerBirthDate,
      secondDriverLastName: formData.secondDriverLastName,
      secondDriverFirstName: formData.secondDriverFirstName,
      secondDriverAddressMorocco: formData.secondDriverAddressMorocco,
      secondDriverPhone: formData.secondDriverPhone,
      secondDriverAddressForeign: formData.secondDriverAddressForeign,
      secondDriverCin: formData.secondDriverCin,
      secondDriverCinDelivered: formData.secondDriverCinDelivered,
      secondDriverLicenseNumber: formData.secondDriverLicenseNumber,
      secondDriverLicenseDelivered: formData.secondDriverLicenseDelivered,
      secondDriverPassportNumber: formData.secondDriverPassportNumber,
      secondDriverPassportDelivered: formData.secondDriverPassportDelivered,
      vehicleBrand: formData.vehicleBrand,
      vehicleModel: formData.vehicleModel,
      vehicleRegistration: formData.vehicleRegistration,
      vehicleYear: formData.vehicleYear,
      vehicleKmDepart: formData.vehicleKmDepart,
      deliveryLocation: formData.deliveryLocation,
      deliveryDateTime: formData.deliveryDateTime,
      rentalDays: formData.rentalDays,
      emergencyEquipmentDelivery: formData.emergencyEquipmentDelivery,
      observationsDelivery: formData.observationsDelivery,
      deliveryFuelLevel,
      deliveryDamages,
      returnDateTime: formData.returnDateTime,
      returnLocation: formData.returnLocation,
      extensionUntil: formData.extensionUntil,
      vehicleKmReturn: formData.vehicleKmReturn,
      extendedDays: formData.extendedDays,
      emergencyEquipmentReturn: formData.emergencyEquipmentReturn,
      observationsReturn: formData.observationsReturn,
      returnFuelLevel,
      returnDamages,
      dailyPrice: formData.dailyPrice,
      rentalDuration: getCurrentDuration().toString(),
      totalPrice: totalPrice,
      advance: formData.advance,
      remaining: calculateRemaining(),
      paymentMethod: formData.paymentMethod,
      deliveryDate: formData.deliveryDate,
      returnDate: formData.returnDate,
      delivery_agent_signature: formData.delivery_agent_signature,
      delivery_tenant_signature: formData.delivery_tenant_signature,
      return_agent_signature: formData.return_agent_signature,
      return_tenant_signature: formData.return_tenant_signature,
    };

    try {
      const blob = await generatePDFBlob(pdfData);
      if (!blob) throw new Error("PDF blob generation failed");

      const fileName = `Contrat-${pdfData.contractNumber || "BONATOURS"}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });

      const navAny = navigator as any;
      if (navAny.canShare && navAny.canShare({ files: [file] })) {
        await navAny.share({
          files: [file],
          title: "Contrat de Location",
          text: "Veuillez trouver le contrat de location en pièce jointe.",
        });
      } else {
        const url = URL.createObjectURL(blob);
        const text = encodeURIComponent(`Contrat BONATOURS ${pdfData.contractNumber}\n${url}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (e) {
      console.error("WhatsApp share failed:", e);
      toast({
        title: "Partage WhatsApp échoué",
        description: "Impossible de partager le PDF via WhatsApp. Réessayez.",
        variant: "destructive"
      });
    }
  };

  const handleSave = () => {
    if (!contract || !onSave) return;

    // Log all signatures before saving
    console.log('[EnhancedContractFormDialog] About to save contract - Current signature status:');
    console.log('- delivery_agent_signature:', formData.delivery_agent_signature ? `Present (${formData.delivery_agent_signature.length} chars)` : 'MISSING');
    console.log('- delivery_tenant_signature:', formData.delivery_tenant_signature ? `Present (${formData.delivery_tenant_signature.length} chars)` : 'MISSING');  
    console.log('- return_agent_signature:', formData.return_agent_signature ? `Present (${formData.return_agent_signature.length} chars)` : 'MISSING');
    console.log('- return_tenant_signature:', formData.return_tenant_signature ? `Present (${formData.return_tenant_signature.length} chars)` : 'MISSING');

    // Calculate total amount using centralized function if dailyRate and dates are provided
    let totalAmount = contract.total_amount;
    if (formData.dailyPrice && formData.deliveryDateTime && formData.returnDateTime) {
      const startDateStr = formData.deliveryDateTime;
      const endDateStr = formData.returnDateTime;
      const diffDays = daysBetween(startDateStr, endDateStr, { inclusive: false });
      const total = diffDays * parseFloat(formData.dailyPrice);
      totalAmount = total;
    }

    // Determine contract status based on return fields - AUTOMATIC CLOSURE
    let status = contract.status;
    
    if (shouldCloseContract()) {
      status = "ferme"; // Automatically close when return fields are filled
    } else {
      status = "ouvert"; // Keep as open when creating or not ready to close
    }

    console.log(`[EnhancedContractFormDialog] Saving contract with interactive data:`);
    console.log(`- Delivery fuel: ${deliveryFuelLevel}`);
    console.log(`- Return fuel: ${returnFuelLevel}`);
    console.log(`- Delivery damages:`, deliveryDamages);
    console.log(`- Return damages:`, returnDamages);

    const updatedContract: Contract = {
      ...contract,
      customer_name: `${formData.customerFirstName} ${formData.customerLastName}`.trim(),
      customer_phone: formData.customerPhone,
      customer_national_id: formData.customerCin,
      vehicle: `${formData.vehicleBrand} ${formData.vehicleModel} ${formData.vehicleYear}`.trim(),
      start_date: formData.deliveryDateTime.split('T')[0],
      end_date: formData.returnDateTime ? formData.returnDateTime.split('T')[0] : contract.end_date,
      daily_rate: parseFloat(formData.dailyPrice) || contract.daily_rate,
      total_amount: totalAmount,
      advance_payment: parseFloat(formData.advance) || 0, // 🚨 CRITICAL FIX: Save advance from form
      // DEBUG: Log advance payment being saved
      ...(() => {
        console.log(`[💾 SAVING CONTRACT] Advance from form: ${formData.advance} DH -> Parsed: ${parseFloat(formData.advance) || 0} DH`);
        return {};
      })(),
      status,
      payment_method: formData.paymentMethod as 'Espèces' | 'Chèque' | 'Virement' || undefined,
      notes: formData.observationsDelivery,
      contract_number: formData.contractSerie,
      // CRITICAL FIX: Preserve all interactive data with detailed logging
      delivery_fuel_level: deliveryFuelLevel,
      return_fuel_level: returnFuelLevel,
      delivery_damages: deliveryDamages,
      return_damages: returnDamages,
      contract_data: {
        ...formData,
        // Ensure interactive data is also preserved in contract_data
        delivery_fuel_level: deliveryFuelLevel,
        return_fuel_level: returnFuelLevel,
        delivery_damages: deliveryDamages,
        return_damages: returnDamages
      }
    };

    console.log('[EnhancedContractFormDialog] Contract being saved with signature data:');
    console.log('- delivery_agent_signature in contract_data:', updatedContract.contract_data?.delivery_agent_signature ? `Present (${updatedContract.contract_data.delivery_agent_signature.length} chars)` : 'MISSING');
    console.log('- delivery_tenant_signature in contract_data:', updatedContract.contract_data?.delivery_tenant_signature ? `Present (${updatedContract.contract_data.delivery_tenant_signature.length} chars)` : 'MISSING');
    console.log('- return_agent_signature in contract_data:', updatedContract.contract_data?.return_agent_signature ? `Present (${updatedContract.contract_data.return_agent_signature.length} chars)` : 'MISSING'); 
    console.log('- return_tenant_signature in contract_data:', updatedContract.contract_data?.return_tenant_signature ? `Present (${updatedContract.contract_data.return_tenant_signature.length} chars)` : 'MISSING');

    onSave(updatedContract);
    onOpenChange(false);
    
    const statusMessage = shouldCloseContract() ? 
      `Le contrat ${formData.contractSerie} a été mis à jour et son statut a été changé à "Fermé" automatiquement` : 
      `Le contrat ${formData.contractSerie} a été mis à jour avec succès`;
    
    toast({
      title: "Mise à jour réussie",
      description: statusMessage
    });
  };

  if (!contract) return null;

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="text-center mb-6">
            <div className="text-2xl font-bold text-gray-800 mb-2">BONATOURS</div>
            <div className="text-lg text-gray-600 mb-1">LOCATION DE VOITURES</div>
            <div className="text-sm text-gray-500 mb-4">
              10 Avenue des Far, 3ème Étage - Bureau N° 308 - Casablanca - Maroc<br/>
              Tél: 0522228704 - Fax: 05 22 47 17 80<br/>
              GSM: 06 62 59 63 07<br/>
              E-mail: bonatours308@gmail.com
            </div>
            <div className="text-center mb-4">
              <div className="text-lg font-semibold">Courte et longue durée 7/7</div>
              <div className="inline-block border-2 border-gray-400 px-4 py-2 rounded">
                <span className="text-lg font-bold">CONTRAT DE LOCATION</span>
              </div>
              <div className="text-right mt-2">N°: {formData.contractSerie}</div>
            </div>
          </div>
          <DialogTitle className="text-center">
            {mode === 'view' ? 'Détails du Contrat' : 'Modifier le Contrat'} {formData.contractSerie || contract.contract_number}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Contract Serie Field */}
          {!isReadOnly && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="contractSerie" className="text-sm font-medium">Série du Contrat</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="contractSerie"
                    name="contractSerie"
                    value={formData.contractSerie}
                    onChange={handleInputChange}
                    className="text-sm"
                    placeholder="Ex: BONA2025001"
                  />
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const nextSerie = getNextContractSerie(contracts);
                      setFormData(prev => ({ ...prev, contractSerie: nextSerie }));
                    }}
                    className="whitespace-nowrap"
                  >
                    Suivant: {getNextContractSerie(contracts)}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Dernière série utilisée: {contracts?.length > 0 ? 
                    contracts.sort((a, b) => (b.contract_number || "").localeCompare(a.contract_number || ""))[0]?.contract_number || "Aucune" 
                    : "Aucune"}
                </p>
              </div>
            </div>
          )}

          {/* LOCATAIRE Section */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="bg-gray-800 text-white p-2 rounded mb-4 text-center">
              <h3 className="text-lg font-bold">LOCATAIRE</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Locataire Principal */}
              <div className="space-y-4">
                <h4 className="font-semibold text-center text-gray-700 border-b pb-2">Locataire</h4>
                
                {!isReadOnly && (
                  <div className="space-y-2">
                    <Label>Sélectionner un client</Label>
                    <CustomerSelector
                      selectedCustomer={selectedCustomer}
                      onCustomerSelect={handleCustomerSelect}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="customerLastName" className="text-sm">Nom</Label>
                    <Input
                      id="customerLastName"
                      name="customerLastName"
                      value={formData.customerLastName}
                      onChange={handleInputChange}
                      className="text-sm"
                      readOnly={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerFirstName" className="text-sm">Prénom</Label>
                    <Input
                      id="customerFirstName"
                      name="customerFirstName"
                      value={formData.customerFirstName}
                      onChange={handleInputChange}
                      className="text-sm"
                      readOnly={isReadOnly}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerAddressMorocco" className="text-sm">Adresse au Maroc</Label>
                  <Input
                    id="customerAddressMorocco"
                    name="customerAddressMorocco"
                    value={formData.customerAddressMorocco}
                    onChange={handleInputChange}
                    className="text-sm"
                    readOnly={isReadOnly}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone" className="text-sm">Téléphone</Label>
                    <Input
                      id="customerPhone"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      className="text-sm"
                      readOnly={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerCin" className="text-sm">N° CIN</Label>
                    <Input
                      id="customerCin"
                      name="customerCin"
                      value={formData.customerCin}
                      onChange={handleInputChange}
                      className="text-sm"
                      readOnly={isReadOnly}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerLicenseNumber" className="text-sm">N° Permis</Label>
                  <Input
                    id="customerLicenseNumber"
                    name="customerLicenseNumber"
                    value={formData.customerLicenseNumber}
                    onChange={handleInputChange}
                    className="text-sm"
                    readOnly={isReadOnly}
                  />
                </div>
              </div>

              {/* Second Driver Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-center text-gray-700 border-b pb-2">2ème Conducteur (Optionnel)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="secondDriverLastName" className="text-sm">Nom</Label>
                    <Input
                      id="secondDriverLastName"
                      name="secondDriverLastName"
                      value={formData.secondDriverLastName}
                      onChange={handleInputChange}
                      className="text-sm"
                      readOnly={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondDriverFirstName" className="text-sm">Prénom</Label>
                    <Input
                      id="secondDriverFirstName"
                      name="secondDriverFirstName"
                      value={formData.secondDriverFirstName}
                      onChange={handleInputChange}
                      className="text-sm"
                      readOnly={isReadOnly}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondDriverPhone" className="text-sm">Téléphone</Label>
                  <Input
                    id="secondDriverPhone"
                    name="secondDriverPhone"
                    value={formData.secondDriverPhone}
                    onChange={handleInputChange}
                    className="text-sm"
                    readOnly={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondDriverCin" className="text-sm">N° CIN</Label>
                  <Input
                    id="secondDriverCin"
                    name="secondDriverCin"
                    value={formData.secondDriverCin}
                    onChange={handleInputChange}
                    className="text-sm"
                    readOnly={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondDriverLicenseNumber" className="text-sm">N° Permis</Label>
                  <Input
                    id="secondDriverLicenseNumber"
                    name="secondDriverLicenseNumber"
                    value={formData.secondDriverLicenseNumber}
                    onChange={handleInputChange}
                    className="text-sm"
                    readOnly={isReadOnly}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* VEHICLE Section */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="bg-gray-800 text-white p-2 rounded mb-4 text-center">
              <h3 className="text-lg font-bold">VÉHICULE</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Livraison du Véhicule */}
              <div className="space-y-4">
                <h4 className="font-semibold text-center text-gray-700 border-b pb-2">Livraison du Véhicule</h4>
                
                {!isReadOnly && (
                  <div className="space-y-2">
                    <Label>Sélectionner un véhicule</Label>
                    <VehicleSelector
                      selectedVehicle={selectedVehicle}
                      onVehicleSelect={handleVehicleSelect}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleBrand" className="text-sm">Marque *</Label>
                    <Input id="vehicleBrand" name="vehicleBrand" value={formData.vehicleBrand} onChange={handleInputChange} className="text-sm" required readOnly={isReadOnly} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleModel" className="text-sm">Modèle</Label>
                    <Input id="vehicleModel" name="vehicleModel" value={formData.vehicleModel} onChange={handleInputChange} className="text-sm" readOnly={isReadOnly} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleRegistration" className="text-sm">Immatricule</Label>
                    <Input id="vehicleRegistration" name="vehicleRegistration" value={formData.vehicleRegistration} onChange={handleInputChange} className="text-sm" readOnly={isReadOnly} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleYear" className="text-sm">Année</Label>
                    <Input id="vehicleYear" name="vehicleYear" value={formData.vehicleYear} onChange={handleInputChange} className="text-sm" type="number" readOnly={isReadOnly} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleKmDepart" className="text-sm">Km Départ</Label>
                    <Input id="vehicleKmDepart" name="vehicleKmDepart" value={formData.vehicleKmDepart} onChange={handleInputChange} className="text-sm" type="number" readOnly={isReadOnly} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryLocation" className="text-sm">Lieu de Livraison</Label>
                    <Input id="deliveryLocation" name="deliveryLocation" value={formData.deliveryLocation} onChange={handleInputChange} className="text-sm" readOnly={isReadOnly} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryDateTime" className="text-sm">Date et Heure de Livraison *</Label>
                    <Input id="deliveryDateTime" name="deliveryDateTime" type="datetime-local" value={formData.deliveryDateTime} onChange={handleInputChange} className="text-sm" required readOnly={isReadOnly} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rentalDays" className="text-sm font-semibold text-blue-700">Nombre de Jours ⚡</Label>
                    <Input 
                      id="rentalDays" 
                      name="rentalDays" 
                      value={formData.rentalDays} 
                      onChange={handleRentalDaysChange}
                      className="text-sm font-bold border-blue-300 focus:border-blue-500" 
                      type="number" 
                      readOnly={isReadOnly}
                      placeholder="Saisir le nombre de jours"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">État du Véhicule - Livraison</Label>
                  <VehicleDiagram 
                    onDamageChange={isReadOnly ? undefined : setDeliveryDamages}
                    initialDamages={deliveryDamages}
                  />
                </div>
                <div className="space-y-2">
                  <FuelGauge 
                    value={deliveryFuelLevel} 
                    onChange={isReadOnly ? undefined : setDeliveryFuelLevel} 
                    label="Niveau de carburant à la livraison" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyEquipmentDelivery" className="text-sm">Roues de secours et accessoires</Label>
                  <Textarea id="emergencyEquipmentDelivery" name="emergencyEquipmentDelivery" value={formData.emergencyEquipmentDelivery} onChange={handleInputChange} className="text-sm" rows={2} readOnly={isReadOnly} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observationsDelivery" className="text-sm">Observations</Label>
                  <Textarea id="observationsDelivery" name="observationsDelivery" value={formData.observationsDelivery} onChange={handleInputChange} className="text-sm" rows={2} readOnly={isReadOnly} />
                </div>
              </div>

              {/* Reprise du Véhicule */}
              <div className="space-y-4">
                <h4 className="font-semibold text-center text-gray-700 border-b pb-2">Reprise du Véhicule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="returnDateTime" className="text-sm">Date et Heure de Récupération</Label>
                    <Input id="returnDateTime" name="returnDateTime" type="datetime-local" value={formData.returnDateTime} onChange={handleInputChange} className="text-sm" readOnly={isReadOnly} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="returnLocation" className="text-sm">Lieu de Récupération</Label>
                    <Input id="returnLocation" name="returnLocation" value={formData.returnLocation} onChange={handleInputChange} className="text-sm" readOnly={isReadOnly} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="extensionUntil" className="text-sm">Prolongation au</Label>
                    <Input id="extensionUntil" name="extensionUntil" type="date" value={formData.extensionUntil} onChange={handleInputChange} className="text-sm" readOnly={isReadOnly} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleKmReturn" className="text-sm">Km de Retour</Label>
                    <Input id="vehicleKmReturn" name="vehicleKmReturn" value={formData.vehicleKmReturn} onChange={handleInputChange} className="text-sm" type="number" readOnly={isReadOnly} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extendedDays" className="text-sm">Nombre de Jour Prolongé</Label>
                  <Input id="extendedDays" name="extendedDays" value={formData.extendedDays} onChange={handleInputChange} className="text-sm" type="number" readOnly={isReadOnly} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">État du Véhicule - Retour</Label>
                  <VehicleDiagram 
                    onDamageChange={isReadOnly ? undefined : setReturnDamages}
                    initialDamages={returnDamages}
                  />
                </div>
                <div className="space-y-2">
                  <FuelGauge 
                    value={returnFuelLevel} 
                    onChange={isReadOnly ? undefined : setReturnFuelLevel} 
                    label="Niveau de carburant au retour" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyEquipmentReturn" className="text-sm">Roues de secours et accessoires</Label>
                  <Textarea id="emergencyEquipmentReturn" name="emergencyEquipmentReturn" value={formData.emergencyEquipmentReturn} onChange={handleInputChange} className="text-sm" rows={2} readOnly={isReadOnly} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observationsReturn" className="text-sm">Observations</Label>
                  <Textarea id="observationsReturn" name="observationsReturn" value={formData.observationsReturn} onChange={handleInputChange} className="text-sm" rows={2} readOnly={isReadOnly} />
                </div>
              </div>
            </div>
          </div>

          {/* FACTURATION Section */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="bg-gray-800 text-white p-2 rounded mb-4 text-center">
              <h3 className="text-lg font-bold">FACTURATION</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyPrice" className="text-sm">Prix Journalier (MAD)</Label>
                <Input id="dailyPrice" name="dailyPrice" value={formData.dailyPrice} onChange={handleInputChange} className="text-sm" type="number" readOnly={isReadOnly} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rentalDuration" className="text-sm font-semibold text-green-700">📊 Durée de Location (Jours)</Label>
                <Input 
                  id="rentalDuration" 
                  name="rentalDuration" 
                  value={getCurrentDuration().toString()} 
                  className="text-sm font-bold bg-green-50 border-green-300 text-green-800" 
                  type="number" 
                  readOnly={true}
                  placeholder={`= ${formData.rentalDays || '0'} jours`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalPrice" className="text-sm">Total (MAD)</Label>
                <Input id="totalPrice" name="totalPrice" value={calculateTotalPrice() || formData.totalPrice} className="text-sm" type="number" readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="advance" className="text-sm">Avance Initiale (MAD)</Label>
                <Input id="advance" name="advance" value={formData.advance} onChange={handleInputChange} className="text-sm" type="number" readOnly={isReadOnly} />
                <div className="text-xs text-muted-foreground">
                  Avance initiale du contrat (hors paiements supplémentaires)
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="remaining" className="text-sm">Reste à Payer (DH)</Label>
                <Input id="remaining" name="remaining" value={calculateRemaining() || formData.remaining} className="text-sm" type="number" readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod" className="text-sm">Mode de Règlement</Label>
                {isReadOnly ? (
                  <Input 
                    id="paymentMethod" 
                    name="paymentMethod" 
                    value={formData.paymentMethod} 
                    className="text-sm" 
                    readOnly 
                  />
                ) : (
                  <Select 
                    value={formData.paymentMethod} 
                    onValueChange={(value) => setFormData(prev => ({...prev, paymentMethod: value}))}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Sélectionner le mode de règlement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Espèces">Espèces</SelectItem>
                      <SelectItem value="Chèque">Chèque</SelectItem>
                      <SelectItem value="Virement">Virement</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          {/* SIGNATURES section */}
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">SIGNATURES</h3>
            <ContractSignatureFields 
              formData={formData} 
              handleInputChange={handleInputChange}
              onSignatureChange={handleSignatureChange}
              readOnly={isReadOnly}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleGeneratePDF}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Générer PDF
            </Button>
            <Button 
              variant="outline"
              onClick={handleShareWhatsAppFull}
              className="flex items-center gap-2 hover:bg-green-50 hover:text-green-700"
              title="Partager via WhatsApp (PDF Complet)"
            >
              <Share2 className="h-4 w-4" />
              Partager via WhatsApp
            </Button>
            
            {!isReadOnly && (
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                Enregistrer
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedContractFormDialog;