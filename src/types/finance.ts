export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  paymentMethodId: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}
