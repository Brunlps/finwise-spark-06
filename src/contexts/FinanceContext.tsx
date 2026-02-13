import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Transaction, Category, PaymentMethod } from '@/types/finance';
import { defaultTransactions, defaultCategories, defaultPaymentMethods } from '@/data/mock-data';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (c: Omit<Category, 'id'>) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => boolean;
  addPaymentMethod: (p: Omit<PaymentMethod, 'id'>) => void;
  updatePaymentMethod: (p: PaymentMethod) => void;
  deletePaymentMethod: (id: string) => boolean;
  importTransactions: (items: Omit<Transaction, 'id'>[]) => { added: number; duplicates: number };
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
};

let nextId = 100;
const genId = (prefix: string) => `${prefix}-${nextId++}`;

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(defaultTransactions);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(defaultPaymentMethods);

  const totalIncome = useMemo(() => transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpenses = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [transactions]);
  const balance = totalIncome - totalExpenses;

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [{ ...t, id: genId('t') }, ...prev]);
  }, []);

  const updateTransaction = useCallback((t: Transaction) => {
    setTransactions(prev => prev.map(x => x.id === t.id ? t : x));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(x => x.id !== id));
  }, []);

  const addCategory = useCallback((c: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...c, id: genId('cat') }]);
  }, []);

  const updateCategory = useCallback((c: Category) => {
    setCategories(prev => prev.map(x => x.id === c.id ? c : x));
  }, []);

  const deleteCategory = useCallback((id: string): boolean => {
    const inUse = transactions.some(t => t.categoryId === id);
    if (inUse) return false;
    setCategories(prev => prev.filter(x => x.id !== id));
    return true;
  }, [transactions]);

  const addPaymentMethod = useCallback((p: Omit<PaymentMethod, 'id'>) => {
    setPaymentMethods(prev => [...prev, { ...p, id: genId('pm') }]);
  }, []);

  const updatePaymentMethod = useCallback((p: PaymentMethod) => {
    setPaymentMethods(prev => prev.map(x => x.id === p.id ? p : x));
  }, []);

  const deletePaymentMethod = useCallback((id: string): boolean => {
    const inUse = transactions.some(t => t.paymentMethodId === id);
    if (inUse) return false;
    setPaymentMethods(prev => prev.filter(x => x.id !== id));
    return true;
  }, [transactions]);

  const importTransactions = useCallback((items: Omit<Transaction, 'id'>[]): { added: number; duplicates: number } => {
    let added = 0, duplicates = 0;
    const newTxs: Transaction[] = [];
    for (const item of items) {
      const isDup = transactions.some(t =>
        t.date === item.date && t.description === item.description && t.amount === item.amount
      );
      if (isDup) { duplicates++; continue; }
      newTxs.push({ ...item, id: genId('t') });
      added++;
    }
    if (newTxs.length > 0) setTransactions(prev => [...newTxs, ...prev]);
    return { added, duplicates };
  }, [transactions]);

  return (
    <FinanceContext.Provider value={{
      transactions, categories, paymentMethods, balance, totalIncome, totalExpenses,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, updateCategory, deleteCategory,
      addPaymentMethod, updatePaymentMethod, deletePaymentMethod,
      importTransactions,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
