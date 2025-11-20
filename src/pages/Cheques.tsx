import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Download, FileText, Bell, Search, Filter, Edit, Trash2 } from "lucide-react";
import { format, differenceInDays, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Payment } from "@/types/payment";
import { useToast } from "@/hooks/use-toast";
import { UniversalPDFExport } from "@/components/UniversalPDFExport";
import CheckEditDialog from "@/components/CheckEditDialog";
import { useRepairs } from "@/hooks/useRepairs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const Cheques = () => {
  const [payments, setPayments] = useLocalStorage<Payment[]>("payments", []);
  const { repairs } = useRepairs();
  const [editingCheck, setEditingCheck] = useState<Payment | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [checkToDelete, setCheckToDelete] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState<Date>();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  // Combine check payments from both payments and repairs
  const checkPayments = useMemo(() => {
    const paymentChecks = payments.filter(p => p.paymentMethod === 'Chèque');
    
    // Transform repairs paid by check into Payment format
    const repairChecks: Payment[] = repairs
      .filter(r => r.paymentMethod === 'Chèque')
      .map(r => ({
        id: r.id,
        contractId: r.vehicleId,
        contractNumber: `REP-${r.vehicleInfo.immatriculation}`,
        customerName: `Réparation ${r.typeReparation}`,
        amount: r.paye,
        paymentMethod: 'Chèque' as const,
        paymentDate: r.dateReparation,
        createdAt: r.created_at,
        checkReference: r.checkReference,
        checkName: r.checkName,
        checkDepositDate: r.checkDepositDate,
        checkDirection: 'envoyé' as const,
        checkDepositStatus: 'non encaissé' as const,
      }));
    
    return [...paymentChecks, ...repairChecks];
  }, [payments, repairs]);

  // Apply filters
  const filteredChecks = useMemo(() => {
    return checkPayments.filter(check => {
      const matchesSearch = 
        check.checkName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        check.checkReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        check.contractNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDirection = directionFilter === "all" || check.checkDirection === directionFilter;
      const matchesStatus = statusFilter === "all" || check.checkDepositStatus === statusFilter;

      let matchesDate = true;
      if (filterDate) {
        matchesDate = check.checkDepositDate === format(filterDate, 'yyyy-MM-dd');
      } else if (startDate && endDate) {
        const checkDate = new Date(check.checkDepositDate || check.paymentDate);
        matchesDate = checkDate >= startDate && checkDate <= endDate;
      }

      return matchesSearch && matchesDirection && matchesStatus && matchesDate;
    });
  }, [checkPayments, searchTerm, directionFilter, statusFilter, filterDate, startDate, endDate]);

  // Get deposit status color
  const getDepositStatusColor = (depositDate?: string) => {
    if (!depositDate) return "bg-muted";
    
    const today = new Date();
    const deposit = new Date(depositDate);
    const daysUntilDeposit = differenceInDays(deposit, today);

    if (daysUntilDeposit < 0) return "bg-destructive"; // Passed
    if (daysUntilDeposit === 0) return "bg-warning"; // Today
    if (daysUntilDeposit <= 3) return "bg-orange-500"; // Close
    return "bg-success"; // Future
  };

  const getDepositStatusText = (depositDate?: string) => {
    if (!depositDate) return "Non définie";
    
    const today = new Date();
    const deposit = new Date(depositDate);
    const daysUntilDeposit = differenceInDays(deposit, today);

    if (daysUntilDeposit < 0) return `Retard (${Math.abs(daysUntilDeposit)}j)`;
    if (daysUntilDeposit === 0) return "Aujourd'hui";
    if (daysUntilDeposit <= 3) return `Dans ${daysUntilDeposit}j`;
    return `Dans ${daysUntilDeposit}j`;
  };

  // Check for notifications
  useEffect(() => {
    const checksToDeposit = checkPayments.filter(check => {
      if (!check.checkDepositDate || check.checkDepositStatus === 'encaissé') return false;
      return isToday(new Date(check.checkDepositDate));
    });

    if (checksToDeposit.length > 0) {
      checksToDeposit.forEach(check => {
        toast({
          title: "⚠️ Chèque à encaisser aujourd'hui",
          description: `Le chèque n°${check.checkReference} (${check.checkName}) doit être encaissé aujourd'hui.`,
          duration: 10000,
        });
      });
    }
  }, [checkPayments, toast]);

  // PDF export columns
  const pdfColumns = [
    { key: 'checkName', label: 'Nom' },
    { key: 'contractNumber', label: 'N° Contrat' },
    { key: 'checkReference', label: 'Référence' },
    { key: 'paymentDate', label: 'Date' },
    { key: 'checkDepositDate', label: 'Date Encaiss.' },
    { key: 'checkDirection', label: 'Direction' },
    { key: 'checkDepositStatus', label: 'Statut' },
    { key: 'amount', label: 'Montant' }
  ];

  const formatPDFCell = (key: string, value: any, row: Payment) => {
    if (key === 'paymentDate' || key === 'checkDepositDate') {
      return value ? format(new Date(value), 'dd/MM/yyyy') : '-';
    }
    if (key === 'amount') {
      return `${value.toLocaleString()} MAD`;
    }
    return value || '-';
  };

  const handleEditCheck = (check: Payment) => {
    setEditingCheck(check);
    setEditDialogOpen(true);
  };

  const handleSaveCheck = (updatedCheck: Payment) => {
    const updatedPayments = payments.map(p => 
      p.id === updatedCheck.id ? updatedCheck : p
    );
    setPayments(updatedPayments);
  };

  const handleDeleteCheck = (check: Payment) => {
    setCheckToDelete(check);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCheck = () => {
    if (checkToDelete) {
      // Only delete from payments if it's not a repair check
      if (!checkToDelete.contractNumber.startsWith('REP-')) {
        const updatedPayments = payments.filter(p => p.id !== checkToDelete.id);
        setPayments(updatedPayments);
        toast({
          title: "Supprimé",
          description: "Le chèque a été supprimé avec succès.",
        });
      } else {
        toast({
          title: "Attention",
          description: "Les chèques de réparation doivent être supprimés depuis la page Réparations.",
          variant: "destructive",
        });
      }
    }
    setDeleteDialogOpen(false);
    setCheckToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Chèques</h1>
          <p className="text-muted-foreground">
            Suivi complet des chèques reçus et envoyés
          </p>
        </div>
        <UniversalPDFExport
          title="Liste des Chèques"
          columns={pdfColumns}
          allData={checkPayments}
          filteredData={filteredChecks}
          filename={`cheques_${format(new Date(), 'yyyy-MM-dd')}.pdf`}
          formatCell={formatPDFCell}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Chèques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkPayments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Chèques Reçus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {checkPayments.filter(c => c.checkDirection === 'reçu').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Non Encaissés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {checkPayments.filter(c => c.checkDepositStatus === 'non encaissé').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {checkPayments.reduce((sum, c) => sum + c.amount, 0).toLocaleString()} MAD
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nom, référence, contrat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Filtre par jour</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDate ? format(filterDate, "PPP", { locale: fr }) : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterDate}
                    onSelect={(date) => {
                      setFilterDate(date);
                      setStartDate(undefined);
                      setEndDate(undefined);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Période (Début)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Début"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setFilterDate(undefined);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Période (Fin)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Fin"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setFilterDate(undefined);
                    }}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Direction</Label>
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="reçu">Reçu</SelectItem>
                  <SelectItem value="envoyé">Envoyé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-5 mt-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="encaissé">Encaissé</SelectItem>
                  <SelectItem value="non encaissé">Non encaissé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterDate(undefined);
                  setStartDate(undefined);
                  setEndDate(undefined);
                  setDirectionFilter("all");
                  setStatusFilter("all");
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Liste des Chèques ({filteredChecks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom Complet</TableHead>
                  <TableHead>N° Contrat</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Date Chèque</TableHead>
                  <TableHead>Date Encaissement</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Délai</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChecks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Aucun chèque trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChecks.map((check) => (
                    <TableRow key={check.id}>
                      <TableCell className="font-medium">{check.checkName}</TableCell>
                      <TableCell>{check.contractNumber}</TableCell>
                      <TableCell>{check.checkReference}</TableCell>
                      <TableCell>{format(new Date(check.paymentDate), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        {check.checkDepositDate ? format(new Date(check.checkDepositDate), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={check.checkDirection === 'reçu' ? 'default' : 'secondary'}>
                          {check.checkDirection}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={check.checkDepositStatus === 'encaissé' ? 'default' : 'outline'}>
                          {check.checkDepositStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{check.amount.toLocaleString()} MAD</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2 w-2 rounded-full", getDepositStatusColor(check.checkDepositDate))} />
                          <span className="text-sm">{getDepositStatusText(check.checkDepositDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCheck(check)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-700"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCheck(check)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-700"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <CheckEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        check={editingCheck}
        onSave={handleSaveCheck}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce chèque ? Cette action est irréversible.
              {checkToDelete && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="font-medium">{checkToDelete.checkName}</p>
                  <p className="text-sm text-muted-foreground">Référence: {checkToDelete.checkReference}</p>
                  <p className="text-sm text-muted-foreground">Montant: {checkToDelete.amount.toLocaleString()} MAD</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCheck} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Cheques;
