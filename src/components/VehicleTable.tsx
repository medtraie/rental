
import { Edit, Trash2, Eye, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Vehicle } from "@/hooks/useVehicles";

interface VehicleTableProps {
  vehicles: Vehicle[];
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicleId: string) => void;
  onViewDetails: (vehicle: Vehicle) => void;
  getStatusBadge: (status: string) => { label: string; variant: any; color: string };
}

const VehicleTable = ({ vehicles, onEdit, onDelete, onViewDetails, getStatusBadge }: VehicleTableProps) => {
  if (vehicles.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">لم يتم العثور على مركبات</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الصورة</TableHead>
              <TableHead>الماركة</TableHead>
              <TableHead>الطراز</TableHead>
              <TableHead>رقم التسجيل</TableHead>
              <TableHead>السنة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الكيلومترات</TableHead>
              <TableHead>السعر/يوم</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => {
              const marque = vehicle.marque || vehicle.brand || "";
              const modele = vehicle.modele || vehicle.model || "";
              const immatriculation = vehicle.immatriculation || vehicle.registration || "";
              const annee = vehicle.annee || vehicle.year || new Date().getFullYear();
              const etat = vehicle.etat_vehicule || "disponible";
              const statusConfig = getStatusBadge(etat);
              
              return (
                <TableRow key={vehicle.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center">
                      {vehicle.photos && vehicle.photos.length > 0 ? (
                        <img 
                          src={vehicle.photos[0]} 
                          alt={`${marque} ${modele}`}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Car className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{marque}</TableCell>
                  <TableCell>{modele}</TableCell>
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {immatriculation}
                    </code>
                  </TableCell>
                  <TableCell>{annee}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{statusConfig.color}</span>
                      <Badge variant={statusConfig.variant} className="text-xs">
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{(vehicle.kilometrage || 0).toLocaleString()} كم</TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {vehicle.prix_par_jour || 200} درهم
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(vehicle)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(vehicle)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف المركبة</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من رغبتك في حذف المركبة {marque} {modele} ({immatriculation})؟
                              هذا الإجراء لا يمكن التراجع عنه.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => onDelete(vehicle.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default VehicleTable;
