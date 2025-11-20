
import { Car, Users, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import LoadingSpinner from "@/components/LoadingSpinner";

export function DashboardStats() {
  const { stats, loading } = useDashboardStats();

  if (loading) {
    return <LoadingSpinner message="Chargement des statistiques..." />;
  }

  const statsCards = [
    {
      title: "Total des Véhicules",
      value: stats.totalVehicles.toString(),
      change: `${stats.availableVehicles} disponibles`,
      changeType: "positive" as const,
      icon: Car,
      description: "véhicules dans la flotte",
      colors: {
        icon: "text-card-blue",
        iconBg: "bg-card-blue-bg",
        accent: "bg-gradient-to-b from-card-blue/20 to-card-blue/5",
        change: "text-card-blue"
      }
    },
    {
      title: "Clients Actifs",
      value: stats.totalCustomers.toString(),
      change: "enregistrés",
      changeType: "positive" as const,
      icon: Users,
      description: "clients dans le système",
      colors: {
        icon: "text-card-green",
        iconBg: "bg-card-green-bg",
        accent: "bg-gradient-to-b from-card-green/20 to-card-green/5",
        change: "text-card-green"
      }
    },
    {
      title: "Contrats Mensuels",
      value: stats.activeContracts.toString(),
      change: `${stats.totalContracts} total`,
      changeType: "positive" as const,
      icon: FileText,
      description: "contrats actifs",
      colors: {
        icon: "text-card-orange",
        iconBg: "bg-card-orange-bg",
        accent: "bg-gradient-to-b from-card-orange/20 to-card-orange/5",
        change: "text-card-orange"
      }
    },
    {
      title: "Revenus Mensuels",
      value: stats.monthlyRevenue.toLocaleString(),
      change: `${(stats.monthlyExpenses + stats.monthlyRepairs).toLocaleString()} MAD charges totales`,
      changeType: stats.monthlyRevenue > (stats.monthlyExpenses + stats.monthlyRepairs) ? "positive" : "negative" as const,
      icon: TrendingUp,
      description: "dirhams marocains",
      colors: {
        icon: "text-primary",
        iconBg: "bg-primary/10",
        accent: "bg-gradient-to-b from-primary/20 to-primary/5",
        change: stats.monthlyRevenue > (stats.monthlyExpenses + stats.monthlyRepairs) ? "text-success" : "text-destructive"
      }
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat) => (
        <Card key={stat.title} className="relative overflow-hidden border-l-4 border-l-transparent hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.colors.iconBg}`}>
              <stat.icon className={`h-4 w-4 ${stat.colors.icon}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="flex items-center gap-1 text-xs">
              <span className={`font-medium ${stat.colors.change}`}>
                {stat.change}
              </span>
              <span className="text-muted-foreground">{stat.description}</span>
            </div>
          </CardContent>
          <div className={`absolute top-0 right-0 w-2 h-full ${stat.colors.accent}`}></div>
        </Card>
      ))}
    </div>
  );
}
