import React from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

export type ExportType = 'reports' | 'revenue' | 'contract' | 'invoice';

interface PDFExportButtonProps {
  type: ExportType;
  data: any;
  filename?: string;
  disabled?: boolean;
  className?: string;
}

export const PDFExportButton = ({ 
  type, 
  data, 
  filename, 
  disabled = false,
  className = ""
}: PDFExportButtonProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = React.useState(false);

  const generatePDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Common header
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("BONATOURS - Location de Voitures", pageWidth / 2, 20, { align: "center" });
      
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 20, 30, { align: "right" });

      let yPosition = 50;

      switch (type) {
        case 'reports':
          await generateReportsPDF(pdf, data, yPosition);
          break;
        case 'revenue':
          await generateRevenuePDF(pdf, data, yPosition);
          break;
        case 'contract':
          await generateContractPDF(pdf, data, yPosition);
          break;
        case 'invoice':
          await generateInvoicePDF(pdf, data, yPosition);
          break;
      }

      // Footer
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "italic");
      pdf.text("Document généré automatiquement par BONATOURS", pageWidth / 2, pageHeight - 10, { align: "center" });

      const finalFilename = filename || `bonatours-${type}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(finalFilename);

      toast({
        title: "Export réussi",
        description: `Le fichier PDF "${finalFilename}" a été téléchargé`,
        variant: "default"
      });

    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de la génération du PDF",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generateReportsPDF = async (pdf: jsPDF, data: any, yPosition: number) => {
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("RAPPORT FINANCIER", 20, yPosition);
    yPosition += 20;

    // Statistics summary
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text("RÉSUMÉ FINANCIER:", 20, yPosition);
    yPosition += 10;

    const stats = [
      ["Total Encaissé:", `${data.stats?.totalEncaisse?.toLocaleString() || 0} DH`],
      ["Total Dettes:", `${data.stats?.totalDettes?.toLocaleString() || 0} DH`],
      ["Total Soldé:", `${data.stats?.totalSolde?.toLocaleString() || 0} DH`],
      ["Total Espèces:", `${data.stats?.totalEspeces?.toLocaleString() || 0} DH`],
      ["Total Chèques:", `${data.stats?.totalCheques?.toLocaleString() || 0} DH`],
      ["Compte Banque:", `${data.stats?.bankBalance?.toLocaleString() || 0} DH`]
    ];

    stats.forEach(([label, value]) => {
      pdf.text(label, 30, yPosition);
      pdf.text(value, 120, yPosition);
      yPosition += 8;
    });

    // Payment distribution
    yPosition += 10;
    pdf.text("RÉPARTITION DES PAIEMENTS:", 20, yPosition);
    yPosition += 10;

    if (data.pieChartData && data.pieChartData.length > 0) {
      data.pieChartData.forEach((item: any) => {
        const percentage = ((item.value / data.stats.totalEncaisse) * 100).toFixed(1);
        pdf.text(`${item.name}: ${item.value.toLocaleString()} DH (${percentage}%)`, 30, yPosition);
        yPosition += 8;
      });
    }

    // Bank transfers history
    if (data.bankTransfers && data.bankTransfers.length > 0) {
      yPosition += 10;
      pdf.text("HISTORIQUE DES TRANSFERTS BANCAIRES:", 20, yPosition);
      yPosition += 10;

      data.bankTransfers.forEach((transfer: any) => {
        pdf.text(`${new Date(transfer.date).toLocaleDateString('fr-FR')} - ${transfer.type === 'cash' ? 'Espèces' : 'Chèque'}`, 30, yPosition);
        pdf.text(`${transfer.amount.toLocaleString()} DH (Frais: ${transfer.fees.toLocaleString()} DH)`, 120, yPosition);
        yPosition += 8;
      });
    }
  };

  const generateRevenuePDF = async (pdf: jsPDF, data: any, yPosition: number) => {
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("GESTION DES RECETTES", 20, yPosition);
    yPosition += 20;

    // Tableau récapitulatif
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text("TABLEAU RÉCAPITULATIF:", 20, yPosition);
    yPosition += 15;

    // Table headers
    pdf.setFont("helvetica", "bold");
    const headers = ["Contrat", "Locataire", "Total", "Avance", "Reste", "Statut"];
    let xPositions = [20, 60, 100, 130, 160, 190];
    
    headers.forEach((header, index) => {
      pdf.text(header, xPositions[index], yPosition);
    });
    yPosition += 10;

    // Table content
    pdf.setFont("helvetica", "normal");
    if (data.contractsWithDebts && data.contractsWithDebts.length > 0) {
      data.contractsWithDebts.forEach((contract: any) => {
        const row = [
          contract.contract_number || 'N/A',
          contract.customer_name || 'N/A',
          `${(contract.total_amount || 0).toLocaleString()}`,
          `${(contract.advance_payment || 0).toLocaleString()}`,
          `${contract.remaining_amount.toLocaleString()}`,
          contract.financial_status?.label || 'N/A'
        ];
        
        row.forEach((cell, index) => {
          pdf.text(cell, xPositions[index], yPosition);
        });
        yPosition += 8;

        // Check if we need a new page
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
      });
    }
  };

  const generateContractPDF = async (pdf: jsPDF, data: any, yPosition: number) => {
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(`CONTRAT ${data.contract_number || 'N/A'}`, 20, yPosition);
    yPosition += 20;

    // Contract details
    const details = [
      ["Client:", data.customer_name || 'N/A'],
      ["Email:", data.customer_email || 'N/A'],
      ["Téléphone:", data.customer_phone || 'N/A'],
      ["Date début:", data.start_date ? new Date(data.start_date).toLocaleDateString('fr-FR') : 'N/A'],
      ["Date fin:", data.end_date ? new Date(data.end_date).toLocaleDateString('fr-FR') : 'N/A'],
      ["Véhicule:", data.vehicle_info ? `${data.vehicle_info.brand} ${data.vehicle_info.model}` : 'N/A'],
      ["Prix journalier:", `${(data.daily_rate || 0).toLocaleString()} DH`],
      ["Montant total:", `${(data.total_amount || 0).toLocaleString()} DH`],
      ["Avance payée:", `${(data.advance_payment || 0).toLocaleString()} DH`],
      ["Reste à payer:", `${((data.total_amount || 0) - (data.advance_payment || 0)).toLocaleString()} DH`]
    ];

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    details.forEach(([label, value]) => {
      pdf.text(label, 20, yPosition);
      pdf.text(value, 100, yPosition);
      yPosition += 10;
    });

    if (data.notes) {
      yPosition += 10;
      pdf.text("NOTES:", 20, yPosition);
      yPosition += 10;
      pdf.text(data.notes, 20, yPosition, { maxWidth: 170 });
    }
  };

  const generateInvoicePDF = async (pdf: jsPDF, data: any, yPosition: number) => {
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(`FACTURE ${data.invoice_number || 'N/A'}`, 20, yPosition);
    yPosition += 20;

    // Invoice details similar to contract but with invoice-specific fields
    const details = [
      ["Client:", data.customer_name || 'N/A'],
      ["ICE:", data.customer_ice || 'N/A'],
      ["Date facture:", data.invoice_date ? new Date(data.invoice_date).toLocaleDateString('fr-FR') : 'N/A'],
      ["Date échéance:", data.due_date ? new Date(data.due_date).toLocaleDateString('fr-FR') : 'N/A'],
      ["Montant HT:", `${(data.subtotal_ht || 0).toLocaleString()} DH`],
      ["TVA:", `${(data.tax_amount || 0).toLocaleString()} DH`],
      ["Montant TTC:", `${(data.total_ttc || 0).toLocaleString()} DH`],
      ["Mode paiement:", data.payment_method || 'N/A'],
      ["Statut:", data.status || 'N/A']
    ];

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    details.forEach(([label, value]) => {
      pdf.text(label, 20, yPosition);
      pdf.text(value, 100, yPosition);
      yPosition += 10;
    });
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={disabled || isExporting}
      className={`flex items-center gap-2 ${className}`}
      variant="outline"
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      {isExporting ? 'Export...' : 'PDF'}
    </Button>
  );
};