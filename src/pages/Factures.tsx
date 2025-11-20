import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvoiceForm from "@/components/InvoiceForm";
import InvoicesTable from "@/components/InvoicesTable";
import { FileText, List } from "lucide-react";

const Factures = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleInvoiceCreated = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab("list");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-card rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Gestion des Factures
          </h1>
          <p className="text-muted-foreground">Créer et gérer vos factures</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Créer une facture
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Liste des factures
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="pt-4">
            <InvoiceForm onInvoiceCreated={handleInvoiceCreated} />
          </TabsContent>
          
          <TabsContent value="list" className="pt-4">
            <InvoicesTable key={refreshKey} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Factures;