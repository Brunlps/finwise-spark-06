import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useMemo } from 'react';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const Dashboard = () => {
  const { balance, totalIncome, totalExpenses, transactions, categories } = useFinance();

  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
    });
    return Object.entries(map).map(([catId, value]) => {
      const cat = categories.find(c => c.id === catId);
      return { name: cat?.name || 'Outro', value, color: cat?.color || '#94a3b8' };
    }).sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Saldo Atual</p>
                <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Receitas</p>
                <p className="text-2xl font-bold mt-1 text-income">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-income/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-income" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Despesas</p>
                <p className="text-2xl font-bold mt-1 text-expense">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-expense/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-expense" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-primary" />
              Despesas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={expensesByCategory} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}>
                      {expensesByCategory.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {expensesByCategory.map(e => (
                    <div key={e.name} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: e.color }} />
                      <span className="text-muted-foreground">{e.name}</span>
                      <span className="font-medium ml-auto">{formatCurrency(e.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-8 text-center">Nenhuma despesa registrada</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map(t => {
                const cat = categories.find(c => c.id === t.categoryId);
                return (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat?.color + '20' }}>
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat?.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
