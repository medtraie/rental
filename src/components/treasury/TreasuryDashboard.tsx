import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Coins, FileText, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

interface TreasuryDashboardProps {
  totals: {
    bankBalance: number;
    cashBalance: number;
    totalChecks: number;
    clientDebts: number;
    supplierDebts: number;
    repairDebts?: number;
    totalAvailable: number;
  };
}

export const TreasuryDashboard = ({ totals }: TreasuryDashboardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Bank Balance */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Solde Banque
          </CardTitle>
          <Building2 className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {totals.bankBalance.toLocaleString()} DH
          </div>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {totals.bankBalance >= 0 ? (
              <>
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                <span className="text-green-600">Positif</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                <span className="text-red-600">Négatif</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cash Balance */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Espèces
          </CardTitle>
          <Coins className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {totals.cashBalance.toLocaleString()} DH
          </div>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {totals.cashBalance >= 0 ? (
              <>
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                <span className="text-green-600">Disponible</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                <span className="text-red-600">Déficit</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Total Checks */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Chèques
          </CardTitle>
          <FileText className="h-5 w-5 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {totals.totalChecks.toLocaleString()} DH
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            En circulation
          </p>
        </CardContent>
      </Card>

      {/* Client Debts */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Dettes Clients
          </CardTitle>
          <AlertTriangle className="h-5 w-5 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {totals.clientDebts.toLocaleString()} DH
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Contrats impayés
          </p>
        </CardContent>
      </Card>

      {/* Supplier Debts */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Dettes Diverses
          </CardTitle>
          <TrendingDown className="h-5 w-5 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {totals.supplierDebts.toLocaleString()} DH
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            À régler
          </p>
        </CardContent>
      </Card>

      {/* Repair Debts */}
      {totals.repairDebts !== undefined && totals.repairDebts > 0 && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dettes Réparations
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totals.repairDebts.toLocaleString()} DH
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Réparations impayées
            </p>
          </CardContent>
        </Card>
      )}

      {/* Total Available */}
      <Card className="border-2 border-primary shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Trésorerie Disponible
          </CardTitle>
          <TrendingUp className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {totals.totalAvailable.toLocaleString()} DH
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Banque + Espèces + Chèques
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
