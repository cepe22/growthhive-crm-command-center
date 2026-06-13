"use client";

import type { Client, Expense, Invoice } from "@/lib/data";
import { createContext, useContext, useEffect, useRef, useState } from "react";

type AppData = {
  clients: Client[];
  invoices: Invoice[];
  expenses: Expense[];
  addClient: (client: Client) => void;
  moveClient: (id: string, stage: Client["stage"]) => void;
  addInvoice: (invoice: Invoice) => void;
  addExpense: (expense: Expense) => void;
};

const DataContext = createContext<AppData | null>(null);

function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);
  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored) setValue(JSON.parse(stored));
  }, [key]);
  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useStoredState<Client[]>("gh-clients", []);
  const [invoices, setInvoices] = useStoredState<Invoice[]>("gh-invoices", []);
  const [expenses, setExpenses] = useStoredState<Expense[]>("gh-expenses", []);

  return (
    <DataContext.Provider
      value={{
        clients,
        invoices,
        expenses,
        addClient: (client) => setClients((items) => [...items, client]),
        moveClient: (id, stage) => setClients((items) => items.map((client) => (client.id === id ? { ...client, stage } : client))),
        addInvoice: (invoice) => setInvoices((items) => [invoice, ...items]),
        addExpense: (expense) => setExpenses((items) => [expense, ...items]),
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useAppData harus digunakan di dalam AppDataProvider");
  return context;
}
