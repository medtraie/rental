import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UniversalPDFExportProps {
  title: string;
  columns: { key: string; label: string }[];
  allData: any[];
  filteredData: any[];
  filename?: string;
  formatCell?: (key: string, value: any, row: any) => string;
}

export const UniversalPDFExport = ({
  title,
  columns,
  allData,
  filteredData,
  filename,
  formatCell
}: UniversalPDFExportProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const generatePDF = (data: any[], exportType: "all" | "filtered") => {
    setIsExporting(true);
    
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      
      doc.setFontSize(11);
      doc.text(`Date d'export: ${format(new Date(), "PPP", { locale: fr })}`, 14, 30);
      doc.text(`Type: ${exportType === "all" ? "Tous les éléments" : "Éléments filtrés"}`, 14, 36);
      doc.text(`Total: ${data.length} élément(s)`, 14, 42);

      // Table data
      const tableData = data.map(row => 
        columns.map(col => {
          const value = row[col.key];
          if (formatCell) {
            return formatCell(col.key, value, row);
          }
          if (value === null || value === undefined) return '-';
          if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
          if (typeof value === 'number') return value.toLocaleString();
          if (value instanceof Date) return format(value, 'dd/MM/yyyy');
          if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
            return format(new Date(value), 'dd/MM/yyyy');
          }
          return String(value);
        })
      );

      autoTable(doc, {
        head: [columns.map(col => col.label)],
        body: tableData,
        startY: 48,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      const pdfFilename = filename || `export_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(pdfFilename);
      
      toast({
        title: "Export réussi",
        description: `Le PDF a été téléchargé avec succès (${data.length} élément(s))`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération du PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Export..." : "Exporter PDF"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => generatePDF(allData, "all")}>
          Exporter tous les éléments ({allData.length})
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generatePDF(filteredData, "filtered")}>
          Exporter les éléments filtrés ({filteredData.length})
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
