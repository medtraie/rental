
export interface Repair {
  id: string;
  vehicleId: string;
  vehicleInfo: {
    marque: string;
    modele: string;
    immatriculation: string;
  };
  typeReparation: "Mécanique" | "Électrique" | "Garage";
  cout: number;
  paye: number;
  dette: number;
  dateReparation: string;
  paymentMethod: 'Espèces' | 'Virement' | 'Chèque';
  checkName?: string;
  checkReference?: string;
  checkDate?: string;
  checkDepositDate?: string;
  pieceJointe?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
  };
  note: string;
  created_at: string;
  updated_at: string;
}

export interface RepairFormData {
  vehicleId: string;
  typeReparation: "Mécanique" | "Électrique" | "Garage";
  cout: number;
  paye: number;
  dette: number;
  dateReparation: string;
  paymentMethod: 'Espèces' | 'Virement' | 'Chèque';
  checkName?: string;
  checkReference?: string;
  checkDate?: string;
  checkDepositDate?: string;
  note: string;
  pieceJointe?: File;
}
