export const stages = [
  "Leads",
  "Discovery Call",
  "Pitching & Propose",
  "Negotiating & Dealing",
  "Agreement Signed",
  "Client (Active)",
  "Post-Client",
] as const;

export type Stage = (typeof stages)[number];

export type Client = {
  id: string;
  brand: string;
  pic: string;
  industry: string;
  stage: Stage;
  value: number;
  service: string;
};

export type Invoice = {
  id: string;
  no: string;
  client: string;
  date: string;
  due: string;
  amount: number;
  description?: string;
  discount?: number;
  taxRate?: number;
  status: "Draft" | "Terkirim" | "Lunas" | "Jatuh Tempo";
};

export type Expense = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
};

export const clients: Client[] = [];
export const invoices: Invoice[] = [];
export const expenses: Expense[] = [];
