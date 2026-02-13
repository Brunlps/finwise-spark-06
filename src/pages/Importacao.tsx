import { useState, useCallback } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Transaction } from '@/types/finance';

const Importacao = () => {
  const { importTransactions, categories, paymentMethods } = useFinance();
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{ added: number; duplicates: number } | null>(null);
  const [processing, setProcessing] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setProcessing(true);
    setResult(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

      if (rows.length === 0) {
        toast.error('Planilha vazia');
        setProcessing(false);
        return;
      }

      const items: Omit<Transaction, 'id'>[] = rows.map(row => ({
        date: row['data'] || row['Data'] || row['date'] || new Date().toISOString().split('T')[0],
        description: row['descricao'] || row['Descrição'] || row['description'] || 'Importado',
        amount: Math.abs(parseFloat(row['valor'] || row['Valor'] || row['amount'] || 0)),
        type: (parseFloat(row['valor'] || row['Valor'] || row['amount'] || 0) >= 0 ? 'income' : 'expense') as 'income' | 'expense',
        categoryId: categories[0]?.id || '',
        paymentMethodId: paymentMethods[0]?.id || '',
      }));

      // Simulate delay
      await new Promise(r => setTimeout(r, 1000));
      const res = importTransactions(items);
      setResult(res);
      if (res.added > 0) toast.success(`${res.added} transações importadas!`);
      if (res.duplicates > 0) toast.warning(`${res.duplicates} duplicatas ignoradas`);
    } catch {
      toast.error('Erro ao processar arquivo');
    }
    setProcessing(false);
  }, [importTransactions, categories, paymentMethods]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <h1 className="text-xl font-bold">Importação de Planilhas</h1>

      <Card>
        <CardContent className="p-6">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">Arraste seu arquivo aqui</p>
            <p className="text-sm text-muted-foreground mb-4">Suporta CSV e XLSX</p>
            <label>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileInput} className="hidden" />
              <Button variant="outline" asChild className="cursor-pointer">
                <span><FileSpreadsheet className="mr-2 h-4 w-4" /> Selecionar Arquivo</span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {processing && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-muted-foreground">Processando arquivo...</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardContent className="p-6 space-y-3">
            {result.added > 0 && (
              <div className="flex items-center gap-3 text-income">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">{result.added} transações importadas com sucesso</span>
              </div>
            )}
            {result.duplicates > 0 && (
              <div className="flex items-center gap-3 text-warning">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">{result.duplicates} duplicatas detectadas e ignoradas</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Formato esperado da planilha</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2 font-medium">data</th>
                  <th className="text-left p-2 font-medium">descricao</th>
                  <th className="text-left p-2 font-medium">valor</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b text-muted-foreground">
                  <td className="p-2">2025-02-01</td>
                  <td className="p-2">Salário</td>
                  <td className="p-2">8500.00</td>
                </tr>
                <tr className="text-muted-foreground">
                  <td className="p-2">2025-02-02</td>
                  <td className="p-2">Supermercado</td>
                  <td className="p-2">-450.30</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Importacao;
