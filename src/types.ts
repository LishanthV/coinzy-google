export interface User {
  id: string;
  name: string;
  email: string;
  profilePic?: string;
  walletBalance: number;
  currencyCode: string;
  isMobileVerified?: boolean;
  mobile?: string;
}

export interface Expense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note?: string;
  type: 'expense';
  tags?: string[];
}

export interface Income {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note?: string;
  type: 'income';
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  month: number;
  year: number;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  icon: string;
}

export interface RecurringExpense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  dayOfMonth: number;
  note?: string;
  isActive: boolean;
  lastApplied?: string; // YYYY-MM-DD
}

export interface UPITransaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  sourceEmail: string;
  upiRef: string;
  approved: boolean;
}

export type Transaction = Expense | Income;

export const CATEGORIES = ["Food", "Rent", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Others"] as const;
export const INCOME_CATS = ["Salary", "Freelance", "Business", "Investment", "Gift", "Other"] as const;

export const CAT_ICONS: Record<string, string> = {
  Food: "🛒",
  Rent: "🏠",
  Transport: "🚗",
  Shopping: "🛍️",
  Bills: "🌐",
  Entertainment: "🎬",
  Health: "💊",
  Healthcare: "💊",
  Utilities: "💡",
  Others: "💳"
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  CAD: "$",
  MXN: "$"
};

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY"] as const;

