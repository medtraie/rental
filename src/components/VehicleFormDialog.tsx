import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Vehicle } from "@/hooks/useVehicles";

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>, docUploads?: DocumentUploadType[]) => void;
  vehicle?: Vehicle | null;
}

type DocumentUploadType = {
  file: File;
  type: string;
  expiry?: string;
  name: string;
};

const DOCUMENT_TYPES = [
  { value: "carte_grise", label: "Carte grise" },
  { value: "assurance", label: "Assurance" },
  { value: "visite_technique", label: "Visite technique" },
  { value: "contrat", label: "Contrat" },
  { value: "autre", label: "Autre" },
];

const VehicleFormDialog = ({ open, onOpenChange, onSave, vehicle }: VehicleFormDialogProps) => {
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    registration: "",
    year: "",
    marque: "",
    modele: "",
    immatriculation: "",
    annee: "",
    type_carburant: "Essence",
    boite_vitesse: "Manuelle",
    kilometrage: "",
    couleur: "Blanc",
    prix_par_jour: "",
    etat_vehicule: "disponible",
    km_depart: "",
  });

  // Reset form when dialog opens/closes or when vehicle changes
  useEffect(() => {
    if (open && vehicle) {
      // Editing existing vehicle
      setFormData({
        brand: vehicle.brand || "",
        model: vehicle.model || "",
        registration: vehicle.registration || "",
        year: vehicle.year?.toString() || "",
        marque: vehicle.marque || vehicle.brand || "",
        modele: vehicle.modele || vehicle.model || "",
        immatriculation: vehicle.immatriculation || vehicle.registration || "",
        annee: vehicle.annee?.toString() || vehicle.year?.toString() || "",
        type_carburant: vehicle.type_carburant || "Essence",
        boite_vitesse: vehicle.boite_vitesse || "Manuelle",
        kilometrage: vehicle.kilometrage?.toString() || "0",
        couleur: vehicle.couleur || "Blanc",
        prix_par_jour: vehicle.prix_par_jour?.toString() || "200",
        etat_vehicule: vehicle.etat_vehicule || "disponible",
        km_depart: vehicle.km_depart?.toString() || "0",
      });
    } else if (open) {
      // Creating new vehicle
      setFormData({
        brand: "",
        model: "",
        registration: "",
        year: "",
        marque: "",
        modele: "",
        immatriculation: "",
        annee: "",
        type_carburant: "Essence",
        boite_vitesse: "Manuelle",
        kilometrage: "0",
        couleur: "Blanc",
        prix_par_jour: "200",
        etat_vehicule: "disponible",
        km_depart: "0",
      });
    }
  }, [open, vehicle]);

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // When editing, fill current photos list.
  useEffect(() => {
    if (open && vehicle && vehicle.photos) {
      setPhotos(vehicle.photos);
    } else if (open) {
      setPhotos([]);
    }
  }, [open, vehicle]);

  const [docsUploading, setDocsUploading] = useState(false);
  const [docs, setDocs] = useState<DocumentUploadType[]>([]);
  const [docType, setDocType] = useState("carte_grise");
  const [docExpiry, setDocExpiry] = useState("");
  const [docName, setDocName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset docs section when dialog is opened
  useEffect(() => {
    if (open) {
      setDocs([]);
      setDocType("carte_grise");
      setDocExpiry("");
      setDocName("");
    }
  }, [open, vehicle]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploading(true);
    const files = Array.from(e.target.files);
    const urls: string[] = [];

    for (const file of files) {
      // Create data URL for local storage
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.readAsDataURL(file);
      });
      urls.push(dataUrl);
    }
    
    setPhotos((prev) => [...prev, ...urls]);
    setUploading(false);
    // Clear input value so same file can be uploaded again if needed
    e.target.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDocAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    const file = e.target.files[0];
    setDocs(prev => [
      ...prev,
      {
        file,
        type: docType,
        expiry: docExpiry,
        name: docName || file.name,
      }
    ]);
    // Reset after add
    setDocType("carte_grise");
    setDocExpiry("");
    setDocName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveDoc = (idx: number) => {
    setDocs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.marque.trim()) {
      return;
    }
    const vehicleData = {
      brand: formData.marque,
      model: formData.modele || undefined,
      registration: formData.immatriculation || undefined,
      year: formData.annee ? parseInt(formData.annee) : undefined,
      marque: formData.marque,
      modele: formData.modele || undefined,
      immatriculation: formData.immatriculation || undefined,
      annee: formData.annee ? parseInt(formData.annee) : undefined,
      type_carburant: formData.type_carburant,
      boite_vitesse: formData.boite_vitesse,
      kilometrage: formData.kilometrage ? parseInt(formData.kilometrage) : 0,
      couleur: formData.couleur,
      prix_par_jour: formData.prix_par_jour ? parseFloat(formData.prix_par_jour) : 200,
      etat_vehicule: formData.etat_vehicule,
      km_depart: formData.km_depart ? parseInt(formData.km_depart) : 0,
      documents: [],
      photos: photos,
    };

    // تمرير الوثائق ليتم رفعها وربطها عند الحفظ
    onSave(vehicleData, docs);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vehicle ? "Modifier véhicule" : "Ajouter un nouveau véhicule"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marque">Marque *</Label>
              <Input
                id="marque"
                name="marque"
                value={formData.marque}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modele">Modèle</Label>
              <Input
                id="modele"
                name="modele"
                value={formData.modele}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="immatriculation">Immatriculation</Label>
              <Input
                id="immatriculation"
                name="immatriculation"
                value={formData.immatriculation}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annee">Année</Label>
              <Input
                id="annee"
                name="annee"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.annee}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type_carburant">Type de carburant</Label>
              <Select 
                value={formData.type_carburant} 
                onValueChange={(value) => setFormData(prev => ({...prev, type_carburant: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir le type de carburant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="essence">Essence</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="hybride">Hybride</SelectItem>
                  <SelectItem value="electrique">Électrique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="boite_vitesse">Boîte de vitesses</Label>
              <Select 
                value={formData.boite_vitesse} 
                onValueChange={(value) => setFormData(prev => ({...prev, boite_vitesse: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir la boîte de vitesses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manuelle">Manuelle</SelectItem>
                  <SelectItem value="automatique">Automatique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kilometrage">Kilométrage</Label>
              <Input
                id="kilometrage"
                name="kilometrage"
                type="number"
                min="0"
                value={formData.kilometrage}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="couleur">Couleur</Label>
              <Input
                id="couleur"
                name="couleur"
                value={formData.couleur}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prix_par_jour">Prix par jour (DH)</Label>
              <Input
                id="prix_par_jour"
                name="prix_par_jour"
                type="number"
                min="0"
                step="0.01"
                value={formData.prix_par_jour}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="etat_vehicule">État du véhicule</Label>
              <Select 
                value={formData.etat_vehicule} 
                onValueChange={(value) => setFormData(prev => ({...prev, etat_vehicule: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir l'état du véhicule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="loue">Loué</SelectItem>
                  <SelectItem value="maintenance">En maintenance</SelectItem>
                  <SelectItem value="horsService">Hors service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="km_depart">Kilométrage de départ</Label>
              <Input
                id="km_depart"
                name="km_depart"
                type="number"
                min="0"
                value={formData.km_depart}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Section de téléchargement d'images */}
          <div>
            <label className="block mb-2 font-medium">Photos du véhicule</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
              className="mb-2"
            />
            {uploading && <div className="text-blue-500 text-xs">Téléchargement des photos...</div>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {photos.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img src={url} alt={`vehicle-photo-${idx}`} className="h-20 w-full object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded px-1 py-0.5 opacity-75 group-hover:opacity-100"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section des documents du véhicule */}
          <div className="border rounded p-3 bg-gray-50 mt-4">
            <label className="block mb-2 font-medium">Documents du véhicule</label>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
              <div>
                <Label>Type de document</Label>
                <select
                  className="w-full border rounded px-2 py-1 mt-1"
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                >
                  {DOCUMENT_TYPES.map(dt => (
                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Date d'expiration</Label>
                <Input
                  type="date"
                  value={docExpiry}
                  onChange={e => setDocExpiry(e.target.value)}
                />
              </div>
              <div>
                <Label>Nom du document (optionnel)</Label>
                <Input
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  placeholder="Exemple: Carte Grise 2024"
                />
              </div>
              <div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleDocAdd}
                />
              </div>
              <div className="text-left md:text-center mt-1">
                <span className="block text-xs py-0.5 text-gray-500">Supporte images et PDF</span>
              </div>
            </div>
            {docs.length > 0 && (
              <div className="mt-3">
                <ul className="space-y-1">
                  {docs.map((doc, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="inline-flex font-bold text-gray-800">{doc.name}</span>
                      <span className="text-xs text-gray-500 px-1">{DOCUMENT_TYPES.find(dt => dt.value === doc.type)?.label ?? doc.type}</span>
                      {doc.expiry && (<span className="text-xs text-orange-600">Expire le: {doc.expiry}</span>)}
                      <Button size="sm" variant="destructive" onClick={() => handleRemoveDoc(idx)}>Supprimer</Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={uploading || docsUploading}>
              {docsUploading ? "Téléchargement des documents..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleFormDialog;
