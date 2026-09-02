import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { queryKeys } from '@/hooks/query-keys';
import { transactionsApi } from '@/lib/api/transactions-api';
import { toTransactionCreatePayload } from '@/lib/api/mappers';
import { importTransactionRows, ImportOutcome } from '@/lib/import-runner';
import { parseImportRows } from '@/lib/import-parser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const Importacao = () => {
  const queryClient = useQueryClient();
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const { data: categories = [], isLoading: loadingCategories } = useCategories();

  const [accountId, setAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<ImportOutcome | null>(null);
  const [processing, setProcessing] = useState(false);

  const effectiveAccountId = accountId || accounts[0]?.id || '';
  const effectiveCategoryId = categoryId || categories[0]?.id || '';
  const ready = !loadingAccounts && !loadingCategories && accounts.length > 0 && categories.length > 0;

  const processFile = useCallback(async (file: File) => {
    if (!ready) {
      toast.error('Cadastre ao menos uma conta e uma categoria antes de importar');
      return;
    }
    setProcessing(true);
    setResult(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

      if (rows.length === 0) {
        toast.error('Planilha vazia');
        setProcessing(false);
        return;
      }

      const items = parseImportRows(rows, effectiveCategoryId, effectiveAccountId);

      // O backend não tem endpoint de importação em lote: cada linha vira um POST
      // /transactions separado, com no máximo 5 em voo ao mesmo tempo.
      const outcome = await importTransactionRows(
        items,
        (row) => transactionsApi.create(toTransactionCreatePayload(row)),
        5,
      );
      setResult(outcome);

      if (outcome.succeeded > 0) {
        toast.success(`${outcome.succeeded} transações importadas!`);
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
        queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      }
      if (outcome.failed.length > 0) {
        toast.warning(`${outcome.failed.length} linhas falharam ao importar`);
      }
    } catch {
      toast.error('Erro ao processar arquivo');
    }
    setProcessing(false);
  }, [ready, effectiveCategoryId, effectiveAccountId, queryClient]);

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

      {!loadingAccounts && !loadingCategories && (accounts.length === 0 || categories.length === 0) && (
        <Alert variant="destructive">
          <AlertDescription>
            Cadastre ao menos uma conta e uma categoria em Configurações antes de importar transações.
          </AlertDescription>
        </Alert>
      )}

      {ready && (
        <Card>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Conta de destino</Label>
              <Select value={effectiveAccountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Categoria padrão</Label>
              <Select value={effectiveCategoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              A planilha não define conta/categoria por linha — todas as transações importadas usarão os valores acima.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border'
            } ${!ready ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">Arraste seu arquivo aqui</p>
            <p className="text-sm text-muted-foreground mb-4">Suporta CSV e XLSX</p>
            <label>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileInput} className="hidden" disabled={!ready} />
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
            {result.succeeded > 0 && (
              <div className="flex items-center gap-3 text-income">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">{result.succeeded} transações importadas com sucesso</span>
              </div>
            )}
            {result.failed.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">{result.failed.length} linhas falharam ao importar</span>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 font-medium">Descrição</th>
                        <th className="text-right p-2 font-medium">Valor</th>
                        <th className="text-left p-2 font-medium">Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.failed.map((f, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="p-2">{f.row.description}</td>
                          <td className="p-2 text-right">{formatCurrency(f.row.amount)}</td>
                          <td className="p-2 text-destructive">{f.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
