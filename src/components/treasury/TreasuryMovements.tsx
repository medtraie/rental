import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Filter, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import type { TreasuryMovement } from "@/pages/Tresorerie";
import { format, isAfter, isBefore, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface TreasuryMovementsProps {
  movements: TreasuryMovement[];
  timeFilter: 'day' | 'week' | 'month' | 'year';
  onTimeFilterChange: (filter: 'day' | 'week' | 'month' | 'year') => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onDelete?: (movementId: string, movementType: string) => void;
}

export const TreasuryMovements = ({
  movements,
  timeFilter,
  onTimeFilterChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onDelete
}: TreasuryMovementsProps) => {
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filter movements
  const filteredMovements = useMemo(() => {
    let filtered = [...movements];

    // Filter by date range
    if (startDate && endDate) {
      const start = startOfDay(new Date(startDate));
      const end = endOfDay(new Date(endDate));
      filtered = filtered.filter(m => {
        const date = new Date(m.date);
        return isWithinInterval(date, { start, end });
      });
    }

    // Filter by payment method
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(m => m.paymentMethod === paymentMethodFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(m => m.type === typeFilter);
    }

    // Calculate running balance
    let balance = 0;
    return filtered.map(m => {
      balance += m.amount;
      return { ...m, balance };
    });
  }, [movements, startDate, endDate, paymentMethodFilter, typeFilter]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text("Journal de Trésorerie - BONATOURS", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Date d'export: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 14, 28);
    if (startDate && endDate) {
      doc.text(`Période: ${format(new Date(startDate), 'dd/MM/yyyy')} - ${format(new Date(endDate), 'dd/MM/yyyy')}`, 14, 34);
    }

    // Table
    const tableData = filteredMovements.map(m => [
      format(new Date(m.date), 'dd/MM/yyyy'),
      m.type.charAt(0).toUpperCase() + m.type.slice(1),
      m.paymentMethod,
      m.amount >= 0 ? `+${m.amount.toLocaleString()} DH` : `${m.amount.toLocaleString()} DH`,
      m.reference,
      m.balance ? `${m.balance.toLocaleString()} DH` : '-'
    ]);

    autoTable(doc, {
      startY: startDate && endDate ? 40 : 35,
      head: [['Date', 'Type', 'Moyen', 'Montant', 'Référence', 'Solde']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`tresorerie-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'recette': return 'bg-green-100 text-green-800';
      case 'depense': return 'bg-red-100 text-red-800';
      case 'divers': return 'bg-orange-100 text-orange-800';
      case 'transfert': return 'bg-blue-100 text-blue-800';
      case 'reparation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'Espèces': return 'bg-emerald-100 text-emerald-800';
      case 'Chèque': return 'bg-violet-100 text-violet-800';
      case 'Virement': return 'bg-sky-100 text-sky-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Journal des Opérations
          </CardTitle>
          <Button onClick={exportToPDF} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Date Début</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Date Fin</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="recette">Recette</SelectItem>
                <SelectItem value="depense">Dépense</SelectItem>
                <SelectItem value="divers">Divers</SelectItem>
                <SelectItem value="transfert">Transfert</SelectItem>
                <SelectItem value="reparation">Réparation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Moyen</label>
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="Espèces">Espèces</SelectItem>
                <SelectItem value="Chèque">Chèque</SelectItem>
                <SelectItem value="Virement">Virement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <ScrollArea className="h-[600px]">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Moyen</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Solde</TableHead>
                  {onDelete && <TableHead className="text-center">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={onDelete ? 8 : 7} className="text-center py-8 text-muted-foreground">
                      Aucune opération trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(movement.date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(movement.type)} variant="secondary">
                          {movement.type.charAt(0).toUpperCase() + movement.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentMethodColor(movement.paymentMethod)} variant="secondary">
                          {movement.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${movement.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.amount >= 0 ? (
                          <span className="flex items-center justify-end gap-1">
                            <TrendingUp className="w-4 h-4" />
                            +{movement.amount.toLocaleString()} DH
                          </span>
                        ) : (
                          <span className="flex items-center justify-end gap-1">
                            <TrendingDown className="w-4 h-4" />
                            {movement.amount.toLocaleString()} DH
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{movement.reference}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {movement.description || '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {movement.balance ? `${movement.balance.toLocaleString()} DH` : '-'}
                      </TableCell>
                      {onDelete && (
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(movement.id, movement.type)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>

        <div className="text-sm text-muted-foreground">
          Total: {filteredMovements.length} opération(s)
        </div>
      </CardContent>
    </Card>
  );
};
