"use client";

import type { Client, Expense, Invoice } from "@/lib/data";
import { managedClients as initialManagedClients, type ManagedClient } from "@/lib/client-projects";
import { createContext, useContext, useEffect, useRef, useState } from "react";

type AppData = {
  clients: Client[];
  managedClients: ManagedClient[];
  invoices: Invoice[];
  expenses: Expense[];
  addClient: (client: Client) => void;
  updateClient: (id: string, client: Client) => void;
  moveClient: (id: string, stage: Client["stage"]) => void;
  saveManagedClients: (clients: ManagedClient[]) => void;
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
  const [managedClients, setManagedClients] = useStoredState<ManagedClient[]>("gh-managed-clients", initialManagedClients);
  const [invoices, setInvoices] = useStoredState<Invoice[]>("gh-invoices", []);
  const [expenses, setExpenses] = useStoredState<Expense[]>("gh-expenses", []);

  function syncManagedClient(client: Client) {
    const projectScopes = (client.services?.length ? client.services : [client.service]).filter(Boolean);
    if (!client.brand || !projectScopes.length) return;
    const feePerProject = client.value ? Math.round(client.value / projectScopes.length) : undefined;
    setManagedClients((items) => {
      const nextClient: ManagedClient = {
        brand: client.brand,
        projects: projectScopes.map((scope) => ({ scope, monthlyFee: feePerProject })),
        status: client.stage === "Client (Active)" ? "Aktif" : client.stage === "Agreement Signed" ? "Bulanan" : "Periode belum diisi",
        notes: client.nextAction ? `CRM next action: ${client.nextAction}` : undefined,
      };
      const exists = items.some((item) => item.brand.toLowerCase() === client.brand.toLowerCase());
      return exists
        ? items.map((item) => item.brand.toLowerCase() === client.brand.toLowerCase() ? { ...item, ...nextClient, contractPeriod: item.contractPeriod, notes: item.notes || nextClient.notes } : item)
        : [nextClient, ...items];
    });
  }

  return (
    <DataContext.Provider
      value={{
        clients,
        managedClients,
        invoices,
        expenses,
        addClient: (client) => {
          setClients((items) => [...items, client]);
          syncManagedClient(client);
        },
        updateClient: (id, client) => {
          setClients((items) => items.map((item) => (item.id === id ? client : item)));
          syncManagedClient(client);
        },
        moveClient: (id, stage) => {
          const current = clients.find((client) => client.id === id);
          if (current) syncManagedClient({ ...current, stage });
          setClients((items) => items.map((client) => (client.id === id ? { ...client, stage } : client)));
        },
        saveManagedClients: setManagedClients,
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
