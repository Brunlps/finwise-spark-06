import { useState } from 'react';
import { useAccounts, useCreateAccount, useDeleteAccount, useUpdateAccount } from '@/hooks/use-accounts';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/hooks/use-categories';
import { Category, CategoryType } from '@/types/finance';
import { ApiError } from '@/lib/api/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Tag, Wallet, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TwoFactorSettings from '@/components/TwoFactorSettings';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const describeError = (error: unknown, fallback: string): string => (error instanceof ApiError ? error.detail : fallback);

const Configuracoes = () => {
  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  // Category state
  const [catModal, setCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<CategoryType>('expense');
  const [catColor, setCatColor] = useState('#3b82f6');
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);
  const [savingCat, setSavingCat] = useState(false);

  // Account state
  const [accModal, setAccModal] = useState(false);
  const [editingAcc, setEditingAcc] = useState<{ id: string; name: string } | null>(null);
  const [accName, setAccName] = useState('');
  const [accBalance, setAccBalance] = useState('0.00');
  const [deleteAccId, setDeleteAccId] = useState<string | null>(null);
  const [savingAcc, setSavingAcc] = useState(false);

  const openNewCat = () => { setEditingCat(null); setCatName(''); setCatType('expense'); setCatColor('#3b82f6'); setCatModal(true); };
  const openEditCat = (c: Category) => { setEditingCat(c); setCatName(c.name); setCatType(c.type); setCatColor(c.color ?? '#3b82f6'); setCatModal(true); };
  const saveCat = async () => {
    if (!catName.trim()) { toast.error('Nome obrigatório'); return; }
    setSavingCat(true);
    try {
      if (editingCat) {
        await updateCategory.mutateAsync({ id: editingCat.id, name: catName, color: catColor });
        toast.success('Categoria atualizada');
      } else {
        await createCategory.mutateAsync({ name: catName, type: catType, color: catColor, icon: null });
        toast.success('Categoria criada');
      }
      setCatModal(false);
    } catch (error) {
      toast.error(describeError(error, 'Não foi possível salvar a categoria'));
    } finally {
      setSavingCat(false);
    }
  };
  const confirmDeleteCat = async () => {
    if (!deleteCatId) return;
    try {
      await deleteCategory.mutateAsync(deleteCatId);
      toast.success('Categoria excluída');
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error('Categoria em uso em transações, não pode ser removida');
      } else {
        toast.error(describeError(error, 'Não foi possível excluir a categoria'));
      }
    } finally {
      setDeleteCatId(null);
    }
  };

  const openNewAcc = () => { setEditingAcc(null); setAccName(''); setAccBalance('0.00'); setAccModal(true); };
  const openEditAcc = (a: { id: string; name: string }) => { setEditingAcc(a); setAccName(a.name); setAccModal(true); };
  const saveAcc = async () => {
    if (!accName.trim()) { toast.error('Nome obrigatório'); return; }
    setSavingAcc(true);
    try {
      if (editingAcc) {
        await updateAccount.mutateAsync({ id: editingAcc.id, name: accName });
        toast.success('Conta atualizada');
      } else {
        const parsedBalance = parseFloat(accBalance.replace(',', '.'));
        await createAccount.mutateAsync({ name: accName, balance: Number.isFinite(parsedBalance) ? parsedBalance : 0 });
        toast.success('Conta criada');
      }
      setAccModal(false);
    } catch (error) {
      toast.error(describeError(error, 'Não foi possível salvar a conta'));
    } finally {
      setSavingAcc(false);
    }
  };
  const confirmDeleteAcc = async () => {
    if (!deleteAccId) return;
    try {
      await deleteAccount.mutateAsync(deleteAccId);
      toast.success('Conta excluída');
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error('Conta possui transações vinculadas, não pode ser removida');
      } else {
        toast.error(describeError(error, 'Não foi possível excluir a conta'));
      }
    } finally {
      setDeleteAccId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <h1 className="text-xl font-bold">Configurações</h1>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories"><Tag className="mr-2 h-4 w-4" />Categorias</TabsTrigger>
          <TabsTrigger value="accounts"><Wallet className="mr-2 h-4 w-4" />Contas</TabsTrigger>
          <TabsTrigger value="security"><ShieldCheck className="mr-2 h-4 w-4" />Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Categorias</CardTitle>
              <Button size="sm" onClick={openNewCat}><Plus className="mr-2 h-4 w-4" />Nova</Button>
            </CardHeader>
            <CardContent>
              {loadingCategories ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <div className="space-y-2">
                  {categories.map(c => (
                    <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full border-2 border-border" style={{ backgroundColor: c.color ?? '#94a3b8' }} />
                        <span className="font-medium text-sm">{c.name}</span>
                        <span className="text-xs text-muted-foreground">{c.type === 'income' ? 'Receita' : 'Despesa'}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCat(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteCatId(c.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhuma categoria cadastrada</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Contas</CardTitle>
              <Button size="sm" onClick={openNewAcc}><Plus className="mr-2 h-4 w-4" />Nova</Button>
            </CardHeader>
            <CardContent>
              {loadingAccounts ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <div className="space-y-2">
                  {accounts.map(a => (
                    <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{a.name}</span>
                        <span className={`text-xs ${a.balance >= 0 ? 'text-income' : 'text-expense'}`}>{formatCurrency(a.balance)}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditAcc(a)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteAccId(a.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                  {accounts.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhuma conta cadastrada</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <TwoFactorSettings />
        </TabsContent>
      </Tabs>

      {/* Category Modal */}
      <Dialog open={catModal} onOpenChange={setCatModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCat ? 'Editar' : 'Nova'} Categoria</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nome</Label><Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Ex: Alimentação" /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={catType} onValueChange={(v: CategoryType) => setCatType(v)} disabled={!!editingCat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Despesa</SelectItem>
                  <SelectItem value="income">Receita</SelectItem>
                </SelectContent>
              </Select>
              {editingCat && <p className="text-xs text-muted-foreground mt-1">O tipo não pode ser alterado após criada.</p>}
            </div>
            <div><Label>Cor</Label><div className="flex gap-2 items-center"><Input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="w-16 h-10 p-1" /><span className="text-sm text-muted-foreground">{catColor}</span></div></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatModal(false)}>Cancelar</Button>
            <Button onClick={saveCat} disabled={savingCat}>{savingCat && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Modal */}
      <Dialog open={accModal} onOpenChange={setAccModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingAcc ? 'Editar' : 'Nova'} Conta</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nome</Label><Input value={accName} onChange={e => setAccName(e.target.value)} placeholder="Ex: Carteira" /></div>
            {!editingAcc && (
              <div>
                <Label>Saldo inicial (R$)</Label>
                <Input type="number" step="0.01" value={accBalance} onChange={e => setAccBalance(e.target.value)} />
              </div>
            )}
            {editingAcc && <p className="text-xs text-muted-foreground">O saldo é calculado a partir das transações e não pode ser editado diretamente.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccModal(false)}>Cancelar</Button>
            <Button onClick={saveAcc} disabled={savingAcc}>{savingAcc && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alerts */}
      <AlertDialog open={!!deleteCatId} onOpenChange={() => setDeleteCatId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir categoria?</AlertDialogTitle><AlertDialogDescription>Categorias vinculadas a transações não podem ser removidas.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteCat} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteAccId} onOpenChange={() => setDeleteAccId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir conta?</AlertDialogTitle><AlertDialogDescription>Contas vinculadas a transações não podem ser removidas.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteAcc} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Configuracoes;
