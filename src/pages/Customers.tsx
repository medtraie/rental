import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Eye, Trash2, Phone, Mail, User, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useToast } from "@/hooks/use-toast";
import TenantFormDialog from "@/components/TenantFormDialog";
import TenantDetailsDialog from "@/components/TenantDetailsDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TenantsStatsBar from "@/components/tenants/TenantsStatsBar";
import TenantsActionsBar from "@/components/tenants/TenantsActionsBar";
import TenantsTable from "@/components/tenants/TenantsTable";

export interface Tenant {
  id: string;
  nom: string;
  prenom: string;
  adresse: string;
  telephone: string;
  cin: string;
  dateCin: string;
  permis: string;
  datePermis: string;
  dateNaissance: string;
  passeport?: string;
  nationalite: string;
  type: "Locataire Principal" | "Chauffeur secondaire";
  createdAt: string;
  updatedAt: string;
  // New fields:
  cinImageUrl?: string;
  permisImageUrl?: string;
  passeportImageUrl?: string;
}

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [nationalityFilter, setNationalityFilter] = useState("all");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const { toast } = useToast();

  const defaultTenants: Tenant[] = [
    {
      id: "T001",
      nom: "Bennani",
      prenom: "Ahmed",
      adresse: "Rue Hassan II, Casablanca",
      telephone: "+212 612-345678",
      cin: "AB123456",
      dateCin: "2021-08-12",
      permis: "P1234567",
      datePermis: "2020-03-10",
      dateNaissance: "1992-06-15",
      nationalite: "Marocaine",
      type: "Locataire Principal",
      createdAt: "2024-01-10",
      updatedAt: "2024-01-10"
    },
    {
      id: "T002",
      nom: "El Alami",
      prenom: "Fatima",
      adresse: "Avenue Mohammed V, Rabat",
      telephone: "+212 661-789012",
      cin: "CD789012",
      dateCin: "2020-05-15",
      permis: "P2345678",
      datePermis: "2019-12-20",
      dateNaissance: "1988-03-22",
      nationalite: "Marocaine",
      type: "Locataire Principal",
      createdAt: "2024-01-15",
      updatedAt: "2024-01-15"
    },
    {
      id: "T003",
      nom: "Dubois",
      prenom: "Pierre",
      adresse: "Résidence Marina, Agadir",
      telephone: "+212 524-567890",
      cin: "FR345678",
      dateCin: "2022-01-10",
      permis: "P3456789",
      datePermis: "2021-06-15",
      dateNaissance: "1985-11-08",
      passeport: "P00123456",
      nationalite: "Française",
      type: "Locataire Principal",
      createdAt: "2024-01-20",
      updatedAt: "2024-01-20"
    }
  ];

  const [tenants, setTenants] = useLocalStorage<Tenant[]>("tenants", defaultTenants);

  const nationalities = Array.from(new Set(tenants.map(t => t.nationalite))).sort();

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.telephone.includes(searchTerm) ||
      tenant.cin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.permis.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesNationality = nationalityFilter === "all" || tenant.nationalite === nationalityFilter;
    
    return matchesSearch && matchesNationality;
  });

  const handleAddTenant = (tenant: Omit<Tenant, "id" | "createdAt" | "updatedAt">) => {
    // Check for duplicate CIN or Permis
    const existingCin = tenants.find(t => t.cin === tenant.cin);
    const existingPermis = tenants.find(t => t.permis === tenant.permis);
    
    if (existingCin) {
      toast({
        title: "Erreur",
        description: "Un locataire avec ce numéro CIN existe déjà",
        variant: "destructive"
      });
      return false;
    }
    
    if (existingPermis) {
      toast({
        title: "Erreur", 
        description: "Un locataire avec ce numéro de permis existe déjà",
        variant: "destructive"
      });
      return false;
    }

    const newTenant: Tenant = {
      ...tenant,
      id: `T${String(tenants.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setTenants(prev => [newTenant, ...prev]);
    toast({
      title: "Succès",
      description: "Locataire ajouté avec succès"
    });
    return true;
  };

  const handleUpdateTenant = (updatedTenantData: Omit<Tenant, "id" | "createdAt" | "updatedAt">) => {
    if (!editingTenant) return false;

    // Check for duplicate CIN or Permis (excluding current tenant)
    const existingCin = tenants.find(t => t.cin === updatedTenantData.cin && t.id !== editingTenant.id);
    const existingPermis = tenants.find(t => t.permis === updatedTenantData.permis && t.id !== editingTenant.id);
    
    if (existingCin) {
      toast({
        title: "Erreur",
        description: "Un locataire avec ce numéro CIN existe déjà",
        variant: "destructive"
      });
      return false;
    }
    
    if (existingPermis) {
      toast({
        title: "Erreur",
        description: "Un locataire avec ce numéro de permis existe déjà", 
        variant: "destructive"
      });
      return false;
    }

    const updatedTenant: Tenant = {
      ...updatedTenantData,
      id: editingTenant.id,
      createdAt: editingTenant.createdAt,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setTenants(prev => prev.map(tenant => 
      tenant.id === updatedTenant.id ? updatedTenant : tenant
    ));
    
    toast({
      title: "Succès",
      description: "Locataire mis à jour avec succès"
    });
    return true;
  };

  const handleDeleteTenant = (tenantId: string) => {
    setTenants(prev => prev.filter(tenant => tenant.id !== tenantId));
    toast({
      title: "Succès",
      description: "Locataire supprimé avec succès"
    });
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setIsFormDialogOpen(true);
  };

  const handleViewDetails = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDetailsDialogOpen(true);
  };

  const handleFormClose = () => {
    setIsFormDialogOpen(false);
    setEditingTenant(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Gestion des locataires</h1>
              <p className="text-muted-foreground">Base de données des locataires et informations de contact</p>
            </div>
            <Link to="/">
              <Button variant="outline" className="w-full sm:w-auto">Retour à l'Accueil</Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <TenantsStatsBar
          tenantsLength={tenants.length}
          mainTenants={tenants.filter(t => t.type === "Locataire Principal").length}
          nationalityCount={nationalities.length}
          foreignTenantCount={tenants.filter(t => t.nationalite !== "Marocaine").length}
        />

        {/* Actions Bar */}
        <TenantsActionsBar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          nationalityFilter={nationalityFilter}
          nationalities={nationalities}
          onNationalityChange={setNationalityFilter}
          onAddTenant={() => setIsFormDialogOpen(true)}
        />

        {/* Tenants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des locataires</CardTitle>
            <CardDescription>
              Tous les locataires enregistrés dans le système ({filteredTenants.length} locataire{filteredTenants.length !== 1 ? 's' : ''})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TenantsTable
              tenants={filteredTenants}
              onView={handleViewDetails}
              onEdit={handleEditTenant}
              onDelete={handleDeleteTenant}
              searchTerm={searchTerm}
            />
          </CardContent>
        </Card>

        {/* Dialogs */}
        <TenantFormDialog
          isOpen={isFormDialogOpen}
          onClose={handleFormClose}
          onSubmit={editingTenant ? handleUpdateTenant : handleAddTenant}
          tenant={editingTenant}
          nationalities={nationalities}
        />

        <TenantDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={() => setIsDetailsDialogOpen(false)}
          tenant={selectedTenant}
        />
      </div>
    </div>
  );
};

export default Customers;
