import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Download, Trash2, Eye } from 'lucide-react';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { useInvoicePDF } from '@/hooks/useInvoicePDF';

const InvoicesTable = () => {
  const { invoices, loading, deleteInvoice } = useInvoices();
  const { generateInvoicePDF } = useInvoicePDF();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [selectedInvoiceForPreview, setSelectedInvoiceForPreview] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(filteredInvoices.map(inv => inv.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const handleDeleteSelected = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedInvoices.length} facture(s) ?`)) {
      for (const id of selectedInvoices) {
        await deleteInvoice(id);
      }
      setSelectedInvoices([]);
    }
  };

  const handleDownloadSelected = () => {
    selectedInvoices.forEach(async (invoiceId) => {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        await handleDownloadInvoice(invoice);
      }
    });
  };

  const handlePreviewInvoice = (invoice: Invoice) => {
    setSelectedInvoiceForPreview(invoice);
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    await generateInvoicePDF({
      companyName: "BONA TOURS SARL",
      invoiceType: "FACTURE",
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      customerNumber: "",
      beneficiaryName: invoice.customerName,
      beneficiaryICE: invoice.customerICE,
      quantity: "1",
      unit: "J",
      description: invoice.description,
      unitPrice: invoice.totalHT.toString(),
      totalHT: invoice.totalHT.toString(),
      tva: invoice.tva.toString(),
      totalTTC: invoice.totalTTC.toString(),
      totalWords: "",
      paymentMethod: invoice.paymentMethod
    });
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const variants = {
      paid: 'default',
      pending: 'secondary',
      overdue: 'destructive'
    } as const;
    
    const labels = {
      paid: 'Payée',
      pending: 'En attente',
      overdue: 'En retard'
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des Factures</CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher des factures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="paid">Payée</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="overdue">En retard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action buttons */}
        {selectedInvoices.length > 0 && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownloadSelected}
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger sélectionnées ({selectedInvoices.length})
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer sélectionnées ({selectedInvoices.length})
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>N° Facture</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Montant Total</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedInvoices.includes(invoice.id)}
                    onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.customerName}</TableCell>
                <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell>{invoice.totalTTC.toFixed(2)} DH</TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handlePreviewInvoice(invoice)}
                      title="Aperçu"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownloadInvoice(invoice)}
                      title="Télécharger PDF"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => {
                        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
                          deleteInvoice(invoice.id);
                        }
                      }}
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucune facture ne correspond aux critères de recherche
          </div>
        )}
      </CardContent>

      {/* Invoice Preview Modal */}
      {selectedInvoiceForPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Aperçu de la Facture</h3>
            <div className="space-y-2">
              <p><strong>N° Facture:</strong> {selectedInvoiceForPreview.invoiceNumber}</p>
              <p><strong>Client:</strong> {selectedInvoiceForPreview.customerName}</p>
              <p><strong>Date:</strong> {new Date(selectedInvoiceForPreview.invoiceDate).toLocaleDateString('fr-FR')}</p>
              <p><strong>Montant HT:</strong> {selectedInvoiceForPreview.totalHT.toFixed(2)} DH</p>
              <p><strong>TVA:</strong> {selectedInvoiceForPreview.tva.toFixed(2)} DH</p>
              <p><strong>Montant TTC:</strong> {selectedInvoiceForPreview.totalTTC.toFixed(2)} DH</p>
              <p><strong>Statut:</strong> {getStatusBadge(selectedInvoiceForPreview.status)}</p>
              <p><strong>Mode de paiement:</strong> {selectedInvoiceForPreview.paymentMethod}</p>
            </div>
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={() => handleDownloadInvoice(selectedInvoiceForPreview)}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger PDF
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedInvoiceForPreview(null)}
                className="flex-1"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default InvoicesTable;