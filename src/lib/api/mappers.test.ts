import { describe, it, expect } from 'vitest';
import {
  toAccount,
  toAccountCreatePayload,
  toCategory,
  toTransaction,
  toTransactionCreatePayload,
  toTransactionUpdatePayload,
} from './mappers';
import { AccountRead, CategoryRead, TransactionRead } from './types';

describe('toAccount', () => {
  it('converte balance de string decimal para number', () => {
    const wire: AccountRead = {
      id: 'acc-1',
      user_id: 'user-1',
      name: 'Carteira',
      balance: '150.30',
      created_at: '2026-01-01T00:00:00',
      updated_at: '2026-01-02T00:00:00',
    };
    expect(toAccount(wire)).toEqual({
      id: 'acc-1',
      name: 'Carteira',
      balance: 150.3,
      createdAt: '2026-01-01T00:00:00',
      updatedAt: '2026-01-02T00:00:00',
    });
  });
});

describe('toAccountCreatePayload', () => {
  it('formata o saldo inicial como string decimal com 2 casas', () => {
    expect(toAccountCreatePayload({ name: 'Nova', balance: 100 })).toEqual({ name: 'Nova', balance: '100.00' });
  });

  it('omite balance quando não informado (backend usa o default dele)', () => {
    expect(toAccountCreatePayload({ name: 'Nova' })).toEqual({ name: 'Nova' });
  });
});

describe('toCategory', () => {
  it('mantém os campos como vieram, incluindo icon/color nulos', () => {
    const wire: CategoryRead = {
      id: 'cat-1',
      user_id: 'user-1',
      name: 'Alimentação',
      type: 'expense',
      icon: null,
      color: null,
      created_at: '2026-01-01T00:00:00',
    };
    expect(toCategory(wire)).toEqual({ id: 'cat-1', name: 'Alimentação', type: 'expense', icon: null, color: null });
  });
});

describe('toTransaction', () => {
  it('extrai só a parte de data do datetime e converte amount para number', () => {
    const wire: TransactionRead = {
      id: 't-1',
      user_id: 'user-1',
      account_id: 'acc-1',
      category_id: 'cat-1',
      amount: '450.30',
      type: 'expense',
      description: 'Supermercado',
      date: '2026-02-02T10:00:00',
      created_at: '2026-02-02T10:00:00',
    };
    expect(toTransaction(wire)).toEqual({
      id: 't-1',
      date: '2026-02-02',
      description: 'Supermercado',
      amount: 450.3,
      type: 'expense',
      categoryId: 'cat-1',
      accountId: 'acc-1',
    });
  });

  it('description nula vira string vazia no domínio', () => {
    const wire: TransactionRead = {
      id: 't-2',
      user_id: 'user-1',
      account_id: 'acc-1',
      category_id: null,
      amount: '10.00',
      type: 'income',
      description: null,
      date: '2026-01-01T00:00:00',
      created_at: '2026-01-01T00:00:00',
    };
    expect(toTransaction(wire).description).toBe('');
    expect(toTransaction(wire).categoryId).toBeNull();
  });
});

describe('toTransactionCreatePayload', () => {
  it('monta o payload de criação com amount formatado e date com horário', () => {
    const payload = toTransactionCreatePayload({
      date: '2026-02-02',
      description: 'Supermercado',
      amount: 450.3,
      type: 'expense',
      categoryId: 'cat-1',
      accountId: 'acc-1',
    });
    expect(payload).toEqual({
      account_id: 'acc-1',
      category_id: 'cat-1',
      amount: '450.30',
      type: 'expense',
      description: 'Supermercado',
      date: '2026-02-02T00:00:00',
    });
  });

  it('descrição vazia vira null (campo é opcional no backend)', () => {
    const payload = toTransactionCreatePayload({
      date: '2026-02-02',
      description: '',
      amount: 10,
      type: 'income',
      categoryId: null,
      accountId: 'acc-1',
    });
    expect(payload.description).toBeNull();
  });
});

describe('toTransactionUpdatePayload', () => {
  it('inclui só os campos informados', () => {
    expect(toTransactionUpdatePayload({ amount: 35 })).toEqual({ amount: '35.00' });
  });

  it('objeto vazio não manda nenhum campo', () => {
    expect(toTransactionUpdatePayload({})).toEqual({});
  });
});
