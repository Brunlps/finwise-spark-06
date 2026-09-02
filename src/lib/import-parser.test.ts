import { describe, it, expect } from 'vitest';
import { parseImportRows } from './import-parser';

describe('parseImportRows', () => {
  it('planilha vazia retorna lista vazia', () => {
    expect(parseImportRows([], 'cat-1', 'acc-1')).toEqual([]);
  });

  it('caminho feliz: cabeçalhos em minúsculo (data/descricao/valor)', () => {
    const [item] = parseImportRows(
      [{ data: '2025-02-01', descricao: 'Salário', valor: 8500 }],
      'cat-1',
      'acc-1',
    );
    expect(item).toEqual({
      date: '2025-02-01',
      description: 'Salário',
      amount: 8500,
      type: 'income',
      categoryId: 'cat-1',
      accountId: 'acc-1',
    });
  });

  it('aceita cabeçalhos alternativos (Data/Descrição/Valor)', () => {
    const [item] = parseImportRows(
      [{ Data: '2025-02-02', Descrição: 'Supermercado', Valor: -450.3 }],
      'cat-1',
      'acc-1',
    );
    expect(item.date).toBe('2025-02-02');
    expect(item.description).toBe('Supermercado');
    expect(item.amount).toBe(450.3);
    expect(item.type).toBe('expense');
  });

  it('aceita cabeçalhos em inglês (date/description/amount)', () => {
    const [item] = parseImportRows(
      [{ date: '2025-02-03', description: 'Rent', amount: -2200 }],
      'cat-1',
      'acc-1',
    );
    expect(item.date).toBe('2025-02-03');
    expect(item.type).toBe('expense');
    expect(item.amount).toBe(2200);
  });

  it('valor negativo vira despesa com valor absoluto', () => {
    const [item] = parseImportRows([{ valor: -35.9 }], 'cat-1', 'acc-1');
    expect(item.type).toBe('expense');
    expect(item.amount).toBe(35.9);
  });

  it('valor ausente ou positivo vira receita', () => {
    const [item] = parseImportRows([{ descricao: 'Sem valor' }], 'cat-1', 'acc-1');
    expect(item.type).toBe('income');
    expect(item.amount).toBe(0);
  });

  it('colunas de data e descrição ausentes usam os valores padrão', () => {
    const [item] = parseImportRows([{ valor: 100 }], 'cat-1', 'acc-1');
    expect(item.description).toBe('Importado');
    expect(item.date).toBe(new Date().toISOString().split('T')[0]);
  });

  it('categoria e conta padrão são aplicadas a todas as linhas', () => {
    const items = parseImportRows(
      [{ valor: 10 }, { valor: -20 }],
      'cat-default',
      'acc-default',
    );
    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(item.categoryId).toBe('cat-default');
      expect(item.accountId).toBe('acc-default');
    }
  });

  it('valor em formato de texto não numérico resulta em NaN (comportamento atual, sem validação de formato)', () => {
    const [item] = parseImportRows([{ valor: 'não é número' }], 'cat-1', 'acc-1');
    expect(Number.isNaN(item.amount)).toBe(true);
  });
});
