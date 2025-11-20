import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import type { TreasuryMovement } from "@/pages/Tresorerie";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo } from "react";

interface TreasuryChartsProps {
  movements: TreasuryMovement[];
  bankBalance: number;
  cashBalance: number;
}

export const TreasuryCharts = ({ movements, bankBalance, cashBalance }: TreasuryChartsProps) => {
  // Cash flow data (last 6 months)
  const cashFlowData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthMovements = movements.filter(m => {
        const date = new Date(m.date);
        return date >= monthStart && date <= monthEnd;
      });

      const recettes = monthMovements
        .filter(m => m.amount > 0)
        .reduce((sum, m) => sum + m.amount, 0);
      
      const depenses = Math.abs(monthMovements
        .filter(m => m.amount < 0)
        .reduce((sum, m) => sum + m.amount, 0));

      return {
        month: format(month, 'MMM yyyy', { locale: fr }),
        recettes,
        depenses,
        solde: recettes - depenses
      };
    });
  }, [movements]);

  // Payment method distribution
  const paymentMethodData = useMemo(() => {
    const especes = movements.filter(m => m.paymentMethod === 'Espèces' && m.amount > 0).reduce((sum, m) => sum + m.amount, 0);
    const cheques = movements.filter(m => m.paymentMethod === 'Chèque' && m.amount > 0).reduce((sum, m) => sum + m.amount, 0);
    const virements = movements.filter(m => m.paymentMethod === 'Virement' && m.amount > 0).reduce((sum, m) => sum + m.amount, 0);
    
    return [
      { name: 'Espèces', value: especes, color: '#10b981' },
      { name: 'Chèques', value: cheques, color: '#8b5cf6' },
      { name: 'Virements', value: virements, color: '#3b82f6' }
    ].filter(item => item.value > 0);
  }, [movements]);

  // Treasury evolution (cumulative)
  const treasuryEvolution = useMemo(() => {
    let balance = 0;
    const data = [];
    
    // Get last 30 days of movements
    const sortedMovements = [...movements]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);

    sortedMovements.forEach(m => {
      balance += m.amount;
      data.push({
        date: format(new Date(m.date), 'dd/MM'),
        solde: balance
      });
    });

    return data;
  }, [movements]);

  const COLORS = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Revenue vs Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Recettes vs Dépenses Mensuelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `${Number(value).toLocaleString()} DH`} />
              <Legend />
              <Bar dataKey="recettes" fill="#10b981" name="Recettes" />
              <Bar dataKey="depenses" fill="#ef4444" name="Dépenses" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment Method Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5" />
            Répartition par Moyen de Paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${Number(value).toLocaleString()} DH`} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Treasury Evolution Curve */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Courbe de Trésorerie (30 derniers jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={treasuryEvolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `${Number(value).toLocaleString()} DH`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="solde" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Solde"
                dot={{ fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
