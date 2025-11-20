
import { Card, CardContent } from "@/components/ui/card";

interface RepairStatsCardsProps {
  totalRepairs: number;
  mechanicalRepairs: number;
  electricalRepairs: number;
  totalCost: number;
}

const RepairStatsCards = ({ 
  totalRepairs, 
  mechanicalRepairs, 
  electricalRepairs, 
  totalCost 
}: RepairStatsCardsProps) => {
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} DH`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{totalRepairs}</p>
            <p className="text-sm text-gray-600">Total des Réparations</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{mechanicalRepairs}</p>
            <p className="text-sm text-gray-600">Réparations Mécaniques</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{electricalRepairs}</p>
            <p className="text-sm text-gray-600">Réparations Électriques</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCost)}</p>
            <p className="text-sm text-gray-600">Total des Coûts</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RepairStatsCards;
