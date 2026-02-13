import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Tag, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Configuracoes = () => {
  const { categories, paymentMethods, addCategory, updateCategory, deleteCategory, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } = useFinance();

  // Category state
  const [catModal, setCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<{ id: string; name: string; color: string } | null>(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#3b82f6');
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

  // Payment method state
  const [pmModal, setPmModal] = useState(false);
  const [editingPm, setEditingPm] = useState<{ id: string; name: string } | null>(null);
  const [pmName, setPmName] = useState('');
  const [deletePmId, setDeletePmId] = useState<string | null>(null);

  const openNewCat = () => { setEditingCat(null); setCatName(''); setCatColor('#3b82f6'); setCatModal(true); };
  const openEditCat = (c: { id: string; name: string; color: string }) => { setEditingCat(c); setCatName(c.name); setCatColor(c.color); setCatModal(true); };
  const saveCat = () => {
    if (!catName.trim()) { toast.error('Nome obrigatório'); return; }
    if (editingCat) { updateCategory({ ...editingCat, name: catName, color: catColor }); toast.success('Categoria atualizada'); }
    else { addCategory({ name: catName, color: catColor }); toast.success('Categoria criada'); }
    setCatModal(false);
  };
  const confirmDeleteCat = () => {
    if (deleteCatId) {
      const ok = deleteCategory(deleteCatId);
      if (ok) toast.success('Categoria excluída');
      else toast.error('Categoria em uso, não pode ser removida');
      setDeleteCatId(null);
    }
  };

  const openNewPm = () => { setEditingPm(null); setPmName(''); setPmModal(true); };
  const openEditPm = (p: { id: string; name: string }) => { setEditingPm(p); setPmName(p.name); setPmModal(true); };
  const savePm = () => {
    if (!pmName.trim()) { toast.error('Nome obrigatório'); return; }
    if (editingPm) { updatePaymentMethod({ ...editingPm, name: pmName }); toast.success('Forma de pagamento atualizada'); }
    else { addPaymentMethod({ name: pmName }); toast.success('Forma de pagamento criada'); }
    setPmModal(false);
  };
  const confirmDeletePm = () => {
    if (deletePmId) {
      const ok = deletePaymentMethod(deletePmId);
      if (ok) toast.success('Forma de pagamento excluída');
      else toast.error('Forma de pagamento em uso, não pode ser removida');
      setDeletePmId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <h1 className="text-xl font-bold">Configurações</h1>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories"><Tag className="mr-2 h-4 w-4" />Categorias</TabsTrigger>
          <TabsTrigger value="payments"><CreditCard className="mr-2 h-4 w-4" />Formas de Pagamento</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Categorias</CardTitle>
              <Button size="sm" onClick={openNewCat}><Plus className="mr-2 h-4 w-4" />Nova</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full border-2 border-border" style={{ backgroundColor: c.color }} />
                      <span className="font-medium text-sm">{c.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCat(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteCatId(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Formas de Pagamento</CardTitle>
              <Button size="sm" onClick={openNewPm}><Plus className="mr-2 h-4 w-4" />Nova</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {paymentMethods.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{p.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditPm(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletePmId(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Modal */}
      <Dialog open={catModal} onOpenChange={setCatModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCat ? 'Editar' : 'Nova'} Categoria</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nome</Label><Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Ex: Alimentação" /></div>
            <div><Label>Cor</Label><div className="flex gap-2 items-center"><Input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="w-16 h-10 p-1" /><span className="text-sm text-muted-foreground">{catColor}</span></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCatModal(false)}>Cancelar</Button><Button onClick={saveCat}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Method Modal */}
      <Dialog open={pmModal} onOpenChange={setPmModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingPm ? 'Editar' : 'Nova'} Forma de Pagamento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nome</Label><Input value={pmName} onChange={e => setPmName(e.target.value)} placeholder="Ex: PIX" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPmModal(false)}>Cancelar</Button><Button onClick={savePm}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alerts */}
      <AlertDialog open={!!deleteCatId} onOpenChange={() => setDeleteCatId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir categoria?</AlertDialogTitle><AlertDialogDescription>Categorias vinculadas a transações não podem ser removidas.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteCat} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletePmId} onOpenChange={() => setDeletePmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir forma de pagamento?</AlertDialogTitle><AlertDialogDescription>Formas de pagamento vinculadas a transações não podem ser removidas.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDeletePm} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Configuracoes;
