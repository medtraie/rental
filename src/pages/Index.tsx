
import { DashboardStats } from "@/components/DashboardStats";
import { QuickActions } from "@/components/QuickActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, TrendingUp, Users, FileText, Wrench } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import LoadingSpinner from "@/components/LoadingSpinner";

const Index = () => {
  const { stats, recentActivity, loading } = useDashboardStats();

  const getActivityIcon = (iconType: string) => {
    switch (iconType) {
      case 'users': return Users;
      case 'file-text': return FileText;
      case 'wrench': return Wrench;
      default: return Calendar;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'customer': return 'bg-card-green-bg text-card-green';
      case 'contract': return 'bg-card-blue-bg text-card-blue';
      case 'repair': return 'bg-card-red-bg text-card-red';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a quelques minutes';
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  };

  if (loading) {
    return <LoadingSpinner message="Chargement du tableau de bord..." />;
  }

  const occupancyRate = stats.totalVehicles > 0 ? Math.round((stats.rentedVehicles / stats.totalVehicles) * 100) : 0;
  const customerSatisfaction = 94; // This could be calculated from feedback data
  const monthlyGrowth = stats.monthlyRevenue > 0 ? 23 : 0; // This could be calculated from previous month comparison

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
        <p className="text-muted-foreground">
          Bienvenue dans le système de gestion de location de voitures BONATOURS
        </p>
      </div>

      {/* Stats Cards */}
      <DashboardStats />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <QuickActions />

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activité Récente
              </CardTitle>
              <CardDescription>Dernières opérations dans le système</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => {
                    const IconComponent = getActivityIcon(activity.icon);
                    return (
                      <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.description} - {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune activité récente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aperçu des Performances</CardTitle>
              <CardDescription>Statistiques de ce mois</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taux d'occupation</span>
                <span className="text-sm font-medium">{occupancyRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${occupancyRate}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Satisfaction client</span>
                <span className="text-sm font-medium">{customerSatisfaction}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-success h-2 rounded-full" style={{ width: `${customerSatisfaction}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Croissance mensuelle</span>
                <span className="text-sm font-medium">{monthlyGrowth}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-card-blue h-2 rounded-full" style={{ width: `${Math.min(monthlyGrowth, 100)}%` }}></div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistiques Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Contrats d'aujourd'hui</span>
                <span className="text-lg font-bold text-primary">{stats.todayContracts}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Véhicules disponibles</span>
                <span className="text-lg font-bold text-success">{stats.availableVehicles}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Véhicules loués</span>
                <span className="text-lg font-bold text-card-blue">{stats.rentedVehicles}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">En maintenance</span>
                <span className="text-lg font-bold text-warning">{stats.maintenanceVehicles}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Revenus d'aujourd'hui</span>
                <span className="text-lg font-bold text-primary">{stats.todayRevenue.toLocaleString()} DH</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
