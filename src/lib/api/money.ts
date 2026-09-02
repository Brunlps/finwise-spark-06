// O backend manda/espera valores monetários como string decimal (ex.: "150.00"), nunca
// como number, para não perder precisão. Esse é o único lugar que converte entre isso e
// o number que o resto do frontend usa para cálculo/exibição.
export const fromApiAmount = (value: string): number => Number(value);

export const toApiAmount = (value: number): string => value.toFixed(2);
