
import { Plus, Calendar, FileText, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const quickActions = [
  {
    title: "Nouveau Contrat",
    description: "Créer un nouveau contrat de location",
    icon: FileText,
    href: "/contracts",
    color: "bg-blue-500",
  },
  {
    title: "Nouveau Client",
    description: "Ajouter un nouveau client",
    icon: Plus,
    href: "/customers",
    color: "bg-green-500",
  },
  {
    title: "Facture",
    description: "Créer une nouvelle facture",
    icon: FileText,
    href: "/factures",
    color: "bg-purple-500",
  },
  {
    title: "Ajouter Véhicule",
    description: "Enregistrer un nouveau véhicule",
    icon: Car,
    href: "/vehicles",
    color: "bg-orange-500",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actions Rapides</CardTitle>
        <CardDescription>Actions importantes accessibles rapidement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.href}>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 w-full hover:bg-muted/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
