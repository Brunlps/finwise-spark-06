import { useMemo, useState } from 'react';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { useCreateTransaction, useDeleteTransaction, useTransactions, useUpdateTransaction } from '@/hooks/use-transactions';
import { Transaction } from '@/types/finance';
import { ApiError } from '@/lib/api/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Pencil, Trash2, Filter, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

type FormData = Omit<Transaction, 'id'>;

const emptyForm = (defaultAccountId: string): FormData => ({
  date: new Date().toISOString().split('T')[0],
  description: '',
  amount: 0,
  type: 'expense',
  categoryId: null,
  accountId: defaultAccountId,
});

const describeError = (error: unknown, fallback: string): string => (error instanceof ApiError ? error.detail : fallback);

const Extrato = () => {
  const { data: transactions, isLoading: loadingTransactions, isError: errorTransactions } = useTransactions();
  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const isLoading = loadingTransactions || loadingCategories || loadingAccounts;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm(''));
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(
    () =>
      (transactions ?? [])
        .filter(t => {
          if (filterType !== 'all' && t.type !== filterType) return false;
          if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;
          if (filterDateFrom && t.date < filterDateFrom) return false;
          if (filterDateTo && t.date > filterDateTo) return false;
          return true;
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, filterType, filterCategory, filterDateFrom, filterDateTo],
  );

  // Uma categoria tem um tipo fixo (receita/despesa) no backend — só faz sentido oferecer
  // categorias compatíveis com o tipo escolhido no formulário.
  const categoriesForFormType = categories.filter(c => c.type === form.type);

  const openNew = () => { setEditing(null); setForm(emptyForm(accounts[0]?.id ?? '')); setModalOpen(true); };
  const openEdit = (t: Transaction) => {
    setEditing(t);
    setForm({ date: t.date, description: t.description, amount: t.amount, type: t.type, categoryId: t.categoryId, accountId: t.accountId });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.description.trim() || !form.amount || !form.categoryId || !form.accountId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        // account_id e type não podem ser alterados via PATCH /transactions/{id} no backend.
        await updateTransaction.mutateAsync({
          id: editing.id,
          date: form.date,
          description: form.description,
          amount: form.amount,
          categoryId: form.categoryId,
        });
        toast.success('Transação atualizada');
      } else {
        await createTransaction.mutateAsync(form);
        toast.success('Transação adicionada');
      }
      setModalOpen(false);
    } catch (error) {
      toast.error(describeError(error, 'Não foi possível salvar a transação'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTransaction.mutateAsync(deleteId);
      toast.success('Transação excluída');
    } catch (error) {
      toast.error(describeError(error, 'Não foi possível excluir a transação'));
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Extrato Financeiro</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" /> Filtros
          </Button>
          <Button size="sm" onClick={openNew} disabled={isLoading || accounts.length === 0}>
            <Plus className="mr-2 h-4 w-4" /> Nova Transação
          </Button>
        </div>
      </div>

      {!isLoading && accounts.length === 0 && (
        <Alert>
          <AlertDescription>Cadastre uma conta em Configurações antes de lançar transações.</AlertDescription>
        </Alert>
      )}

      {errorTransactions && (
        <Alert variant="destructive">
          <AlertDescription>Não foi possível carregar as transações. Tente novamente em instantes.</AlertDescription>
        </Alert>
      )}

      {showFilters && (
        <Card>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Data início</Label>
              <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Data fim</Label>
              <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Data</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Descrição</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Categoria</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Conta</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Valor</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => {
                    const cat = categories.find(c => c.id === t.categoryId);
                    const acc = accounts.find(a => a.id === t.accountId);
                    return (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                        <td className="py-3 px-4 font-medium">{t.description}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat?.color ?? '#94a3b8' }} />
                            {cat?.name ?? '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{acc?.name ?? '—'}</td>
                        <td className={`py-3 px-4 text-right font-semibold ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                          {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(t.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Nenhuma transação encontrada</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v: 'income' | 'expense') => setForm({ ...form, type: v, categoryId: null })}
                  disabled={!!editing}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
                {editing && <p className="text-xs text-muted-foreground mt-1">O tipo não pode ser alterado após criada.</p>}
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ex: Supermercado" />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" min="0" value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoryId ?? ''} onValueChange={v => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categoriesForFormType.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Conta</Label>
                <Select value={form.accountId} onValueChange={v => setForm({ ...form, accountId: v })} disabled={!!editing}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {editing && <p className="text-xs text-muted-foreground mt-1">A conta não pode ser alterada após criada.</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Extrato;
