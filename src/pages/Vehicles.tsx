
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVehicles } from '@/hooks/useVehicles';
import VehicleFormDialog from '@/components/VehicleFormDialog';
import VehicleDetailsDialog from '@/components/VehicleDetailsDialog';
import { Plus, Search, Car, AlertCircle, CheckCircle, Wrench, XCircle, RefreshCcw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const Vehicles = () => {
  const { vehicles, loading, addVehicle, updateVehicle, deleteVehicle } = useVehicles();
  const [searchTerm, setSearchTerm] = useState('');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const filteredVehicles = vehicles.filter(vehicle => {
    const searchString = searchTerm.toLowerCase();
    return (
      (vehicle.marque || vehicle.brand || '').toLowerCase().includes(searchString) ||
      (vehicle.modele || vehicle.model || '').toLowerCase().includes(searchString) ||
      (vehicle.immatriculation || vehicle.registration || '').toLowerCase().includes(searchString)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'disponible':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Disponible</Badge>;
      case 'loue':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Car className="w-3 h-3 mr-1" />Loué</Badge>;
      case 'maintenance':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Wrench className="w-3 h-3 mr-1" />Maintenance</Badge>;
      case 'horsService':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Hors service</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Non défini</Badge>;
    }
  };

  const handleAddVehicle = async (vehicleData, docUploads) => {
    const result = await addVehicle(vehicleData);
    if (result) {
      setFormDialogOpen(false);
      setEditingVehicle(null);
    }
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormDialogOpen(true);
  };

  const handleViewDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
    setDetailsDialogOpen(true);
  };

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.etat_vehicule === 'disponible').length,
    rented: vehicles.filter(v => v.etat_vehicule === 'loue').length,
    maintenance: vehicles.filter(v => v.etat_vehicule === 'maintenance').length,
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Chargement des véhicules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Véhicules</h1>
          <p className="text-gray-600">Gérer la flotte de véhicules et leur état</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setFormDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un nouveau véhicule
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Quick Add Popular Moroccan Cars */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Ajout Rapide - Véhicules Populaires au Maroc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { marque: 'Dacia', modele: 'Logan', prix: 250 },
              { marque: 'Dacia', modele: 'Sandero', prix: 280 },
              { marque: 'Renault', modele: 'Clio', prix: 300 },
              { marque: 'Peugeot', modele: '208', prix: 320 },
              { marque: 'Hyundai', modele: 'i10', prix: 280 },
              { marque: 'Citroën', modele: 'C3', prix: 310 },
              { marque: 'Fiat', modele: 'Panda', prix: 260 },
            ].map((car, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="flex flex-col h-auto py-3 px-2 text-center hover:bg-primary hover:text-primary-foreground"
                onClick={async () => {
                  const newVehicle = {
                    brand: car.marque,
                    marque: car.marque,
                    model: car.modele,
                    modele: car.modele,
                    prix_par_jour: car.prix,
                    type_carburant: 'Essence',
                    boite_vitesse: 'Manuelle',
                    kilometrage: 0,
                    couleur: 'Blanc',
                    etat_vehicule: 'disponible',
                    km_depart: 0,
                    documents: [],
                    photos: [],
                  };
                  await addVehicle(newVehicle);
                }}
              >
                <Car className="w-5 h-5 mb-1" />
                <span className="text-xs font-semibold">{car.marque}</span>
                <span className="text-xs">{car.modele}</span>
                <span className="text-xs text-muted-foreground">{car.prix} DH/j</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Véhicules</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Car className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Loués</p>
                <p className="text-2xl font-bold text-blue-600">{stats.rented}</p>
              </div>
              <Car className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
              </div>
              <Wrench className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un véhicule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {vehicle.marque || vehicle.brand} {vehicle.modele || vehicle.model}
                </CardTitle>
                {getStatusBadge(vehicle.etat_vehicule)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Immatriculation:</span>
                  <span className="font-medium">{vehicle.immatriculation || vehicle.registration || 'Non défini'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Année:</span>
                  <span className="font-medium">{vehicle.annee || vehicle.year || 'Non défini'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Prix journalier:</span>
                  <span className="font-medium">{vehicle.prix_par_jour || 'Non défini'} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Kilométrage:</span>
                  <span className="font-medium">{vehicle.kilometrage || 0} km</span>
                </div>
              </div>
              
              {vehicle.photos && vehicle.photos.length > 0 && (
                <div className="mt-3">
                  <img 
                    src={vehicle.photos[0]} 
                    alt="Photo du véhicule" 
                    className="w-full h-32 object-cover rounded"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewDetails(vehicle)}
                  className="flex-1"
                >
                  Détails
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEditVehicle(vehicle)}
                  className="flex-1"
                >
                  Modifier
                </Button>
                {vehicle.etat_vehicule !== 'disponible' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => updateVehicle(vehicle.id, { etat_vehicule: 'disponible' })}
                    className="text-green-600 hover:text-green-700"
                    title="Remettre à disponible"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer le véhicule</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer le véhicule {vehicle.marque || vehicle.brand} {vehicle.modele || vehicle.model} ({vehicle.immatriculation || vehicle.registration})? 
                        Cette action ne peut pas être annulée.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteVehicle(vehicle.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun véhicule</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Aucun véhicule ne correspond à votre recherche' : 'Aucun véhicule n\'a encore été ajouté'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setFormDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter le premier véhicule
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <VehicleFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onSave={handleAddVehicle}
        vehicle={editingVehicle}
      />

      <VehicleDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        vehicle={selectedVehicle}
        onEdit={handleEditVehicle}
        onDelete={deleteVehicle}
      />
    </div>
  );
};

export default Vehicles;
