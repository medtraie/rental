import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, RefreshCw, Send, DollarSign } from "lucide-react";
import { useState } from "react";
import { PaymentDialog } from "@/components/PaymentDialog";
import MiscellaneousExpenseDialog from "@/components/MiscellaneousExpenseDialog";
import { BankTransferDialog } from "@/components/BankTransferDialog";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TreasuryActionsProps {
  onRefresh: () => void;
}

export const TreasuryActions = ({ onRefresh }: TreasuryActionsProps) => {
  const [cashBalance] = useLocalStorage<number>("cashBalance", 0);
  const [bankAccount] = useLocalStorage<number>("bankAccount", 0);
  const [bankTransfers] = useLocalStorage<any[]>("bankTransfers", []);

  const generateMonthlyReport = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Rapport Mensuel de Trésorerie", 14, 20);
    
    doc.setFontSize(12);
    doc.text("BONATOURS", 14, 28);
    doc.text(`Date: ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, 14, 35);
    
    // Summary
    doc.setFontSize(14);
    doc.text("Résumé", 14, 50);
    
    const summaryData = [
      ['Solde Banque', `${bankAccount.toLocaleString()} DH`],
      ['Solde Espèces', `${cashBalance.toLocaleString()} DH`],
      ['Total Disponible', `${(bankAccount + cashBalance).toLocaleString()} DH`]
    ];

    autoTable(doc, {
      startY: 55,
      head: [['Catégorie', 'Montant']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Recent transfers
    if (bankTransfers.length > 0) {
      doc.setFontSize(14);
      doc.text("Derniers Transferts", 14, (doc as any).lastAutoTable.finalY + 15);
      
      const transferData = bankTransfers.slice(0, 10).map(t => [
        format(new Date(t.date), 'dd/MM/yyyy'),
        t.type === 'cash' ? 'Espèces → Banque' : t.type === 'check' ? 'Chèque → Banque' : 'Banque → Espèces',
        `${t.amount.toLocaleString()} DH`,
        `${t.netAmount.toLocaleString()} DH`
      ]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Date', 'Type', 'Montant', 'Net']],
        body: transferData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
      });
    }

    doc.save(`rapport-tresorerie-${format(new Date(), 'yyyy-MM')}.pdf`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Actions Rapides
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiscellaneousExpenseDialog
            trigger={
              <Button className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Dépense
              </Button>
            }
          />

          <BankTransferDialog
            totalCash={cashBalance}
            totalChecks={0}
            bankBalance={bankAccount}
            onTransfer={() => {}}
          >
            <Button className="w-full" variant="outline">
              <Send className="w-4 h-4 mr-2" />
              Transfert
            </Button>
          </BankTransferDialog>

          <Button
            onClick={generateMonthlyReport}
            className="w-full"
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Rapport PDF
          </Button>
        </div>

        <div className="mt-4 flex justify-center">
          <Button
            onClick={onRefresh}
            variant="ghost"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser les données
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
