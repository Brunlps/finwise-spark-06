import { useMemo, useState } from 'react';
import { useTransactions } from '@/hooks/use-transactions';
import { calculateMonthlyData } from '@/lib/finance-calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const Relatorios = () => {
  const { data: transactions, isLoading, isError } = useTransactions();
  const [year, setYear] = useState('2025');

  const monthlyData = useMemo(() => calculateMonthlyData(transactions ?? [], year), [transactions, year]);

  const exportCSV = () => {
    const header = 'Mês,Receitas,Despesas,Saldo\n';
    const rows = monthlyData.map(d => `${d.name},${d.receitas.toFixed(2)},${d.despesas.toFixed(2)},${d.saldo.toFixed(2)}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `relatorio-${year}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Relatório CSV exportado!');
  };

  const exportPDF = () => {
    toast.info('Exportação PDF simulada — requer integração com biblioteca de PDF');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Relatórios
        </h1>
        <div className="flex items-center gap-3">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={isLoading || isError}><Download className="mr-2 h-4 w-4" />CSV</Button>
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={isLoading || isError}><Download className="mr-2 h-4 w-4" />PDF</Button>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Não foi possível carregar as transações para gerar o relatório.</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <>
          {/* Bar chart */}
          <Card>
            <CardHeader><CardTitle className="text-base">Fluxo de Caixa Mensal — {year}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader><CardTitle className="text-base">Detalhamento Mensal</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Mês</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Receitas</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Despesas</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map(d => (
                      <tr key={d.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium">{d.name}</td>
                        <td className="py-3 px-4 text-right text-income">{formatCurrency(d.receitas)}</td>
                        <td className="py-3 px-4 text-right text-expense">{formatCurrency(d.despesas)}</td>
                        <td className={`py-3 px-4 text-right font-semibold ${d.saldo >= 0 ? 'text-income' : 'text-expense'}`}>{formatCurrency(d.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Relatorios;
