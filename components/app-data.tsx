"use client";

import { activeGhClients, type Client, type Expense, type Invoice, type Reimbursement, type ReimbursementNotification } from "@/lib/data";
import {
  appCalendarEvents as initialCalendarEvents,
  dailyWorkPlans as initialDailyWorkPlans,
  projectTasks as initialProjectTasks,
  teamMembers as initialTeamMembers,
  type AppCalendarEvent,
  type DailyWorkPlan,
  type ProjectStatus,
  type ProjectTask,
  type TaskNotification,
  type TeamMember,
} from "@/lib/client-projects";
import { createContext, useContext, useEffect, useRef, useState } from "react";

type AppData = {
  clients: Client[];
  projectTasks: ProjectTask[];
  dailyWorkPlans: DailyWorkPlan[];
  calendarEvents: AppCalendarEvent[];
  teamMembers: TeamMember[];
  invoices: Invoice[];
  expenses: Expense[];
  reimbursements: Reimbursement[];
  reimbursementNotifications: ReimbursementNotification[];
  taskNotifications: TaskNotification[];
  addClient: (client: Client) => void;
  updateClient: (id: string, client: Client) => void;
  moveClient: (id: string, stage: Client["stage"]) => void;
  saveProjectTasks: (tasks: ProjectTask[]) => void;
  addProjectTask: (task: ProjectTask) => void;
  updateProjectTask: (id: string, task: ProjectTask) => void;
  moveProjectTask: (id: string, status: ProjectStatus) => void;
  saveDailyWorkPlans: (plans: DailyWorkPlan[]) => void;
  addDailyWorkPlan: (plan: DailyWorkPlan) => void;
  saveCalendarEvents: (events: AppCalendarEvent[]) => void;
  addCalendarEvent: (event: AppCalendarEvent) => void;
  saveTeamMembers: (members: TeamMember[]) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  addExpense: (expense: Expense) => void;
  addReimbursement: (reimbursement: Reimbursement) => void;
  updateReimbursement: (id: string, reimbursement: Reimbursement) => void;
  deleteReimbursement: (id: string) => void;
  addReimbursementNotification: (notification: ReimbursementNotification) => void;
  updateReimbursementNotification: (id: string, notification: ReimbursementNotification) => void;
  addTaskNotification: (notification: TaskNotification) => void;
  updateTaskNotification: (id: string, notification: TaskNotification) => void;
};

const DataContext = createContext<AppData | null>(null);
const activeClientSeedVersion = "gh-active-clients-2026-07-07-v2";
const calendarCleanupVersion = "gh-calendar-cleanup-2026-07-07-v1";
const teamEmailSyncVersion = "gh-team-email-sync-2026-07-13-v3";
const taskCleanupVersion = "gh-task-cleanup-2026-07-13-v1";

function mergeActiveGhClients(existing: Client[]) {
  const seededBrands = new Set(activeGhClients.map((client) => client.brand.toLowerCase()));
  const seededIds = new Set(activeGhClients.map((client) => client.id));
  const customClients = existing.filter((client) => !seededIds.has(client.id) && !seededBrands.has(client.brand.toLowerCase()));
  return [...activeGhClients, ...customClients];
}

function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);
  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (!stored) return;
    try {
      setValue(JSON.parse(stored));
    } catch {
      localStorage.removeItem(key);
    }
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
  const [clients, setClients] = useStoredState<Client[]>("gh-clients", activeGhClients);
  const [projectTasks, setProjectTasks] = useStoredState<ProjectTask[]>("gh-project-tasks-v3", initialProjectTasks);
  const [dailyWorkPlans, setDailyWorkPlans] = useStoredState<DailyWorkPlan[]>("gh-daily-work-plans-v2", initialDailyWorkPlans);
  const [calendarEvents, setCalendarEvents] = useStoredState<AppCalendarEvent[]>("gh-calendar-events-v2", initialCalendarEvents);
  const [teamMembers, setTeamMembers] = useStoredState<TeamMember[]>("gh-team-members-v3", initialTeamMembers);
  const [invoices, setInvoices] = useStoredState<Invoice[]>("gh-invoices", []);
  const [expenses, setExpenses] = useStoredState<Expense[]>("gh-expenses", []);
  const [reimbursements, setReimbursements] = useStoredState<Reimbursement[]>("gh-reimbursements-v1", []);
  const [reimbursementNotifications, setReimbursementNotifications] = useStoredState<ReimbursementNotification[]>("gh-reimbursement-notifications-v1", []);
  const [taskNotifications, setTaskNotifications] = useStoredState<TaskNotification[]>("gh-task-notifications-v1", []);

  useEffect(() => {
    if (localStorage.getItem("gh-active-client-seed-version") === activeClientSeedVersion) return;
    let storedClients: Client[] = [];
    const stored = localStorage.getItem("gh-clients");
    if (stored) {
      try {
        storedClients = JSON.parse(stored);
      } catch {
        storedClients = [];
      }
    }
    setClients(mergeActiveGhClients(storedClients));
    localStorage.setItem("gh-active-client-seed-version", activeClientSeedVersion);
  }, [setClients]);

  useEffect(() => {
    if (localStorage.getItem("gh-calendar-cleanup-version") === calendarCleanupVersion) return;
    setCalendarEvents([]);
    localStorage.setItem("gh-calendar-events-v2", "[]");
    localStorage.setItem("gh-calendar-cleanup-version", calendarCleanupVersion);
  }, [setCalendarEvents]);

  useEffect(() => {
    if (localStorage.getItem("gh-team-email-sync-version") === teamEmailSyncVersion) return;
    setTeamMembers((members) => {
      const syncedMembers = members.map((member) => {
      const source = initialTeamMembers.find((item) => item.id === member.id);
      return source ? { ...member, email: source.email, role: source.role } : member;
      });
      const existingIds = new Set(syncedMembers.map((member) => member.id));
      return [...syncedMembers, ...initialTeamMembers.filter((member) => !existingIds.has(member.id))];
    });
    localStorage.setItem("gh-team-email-sync-version", teamEmailSyncVersion);
  }, [setTeamMembers]);

  useEffect(() => {
    if (localStorage.getItem("gh-task-cleanup-version") === taskCleanupVersion) return;
    setProjectTasks([]);
    setTaskNotifications([]);
    localStorage.setItem("gh-project-tasks-v3", "[]");
    localStorage.setItem("gh-task-notifications-v1", "[]");
    localStorage.setItem("gh-task-cleanup-version", taskCleanupVersion);
  }, [setProjectTasks, setTaskNotifications]);

  return (
    <DataContext.Provider
      value={{
        clients,
        projectTasks,
        dailyWorkPlans,
        calendarEvents,
        teamMembers,
        invoices,
        expenses,
        reimbursements,
        reimbursementNotifications,
        taskNotifications,
        addClient: (client) => setClients((items) => [...items, client]),
        updateClient: (id, client) => setClients((items) => items.map((item) => (item.id === id ? client : item))),
        moveClient: (id, stage) => setClients((items) => items.map((client) => (client.id === id ? { ...client, stage } : client))),
        saveProjectTasks: setProjectTasks,
        addProjectTask: (task) => setProjectTasks((items) => [task, ...items]),
        updateProjectTask: (id, task) => setProjectTasks((items) => items.map((item) => (item.id === id ? task : item))),
        moveProjectTask: (id, status) => setProjectTasks((items) => items.map((task) => (task.id === id ? { ...task, status } : task))),
        saveDailyWorkPlans: setDailyWorkPlans,
        addDailyWorkPlan: (plan) => setDailyWorkPlans((items) => [plan, ...items]),
        saveCalendarEvents: setCalendarEvents,
        addCalendarEvent: (event) => setCalendarEvents((items) => [event, ...items]),
        saveTeamMembers: setTeamMembers,
        addInvoice: (invoice) => setInvoices((items) => [invoice, ...items]),
        updateInvoice: (id, invoice) => setInvoices((items) => items.map((item) => (item.id === id ? invoice : item))),
        deleteInvoice: (id) => setInvoices((items) => items.filter((invoice) => invoice.id !== id)),
        addExpense: (expense) => setExpenses((items) => [expense, ...items]),
        addReimbursement: (reimbursement) => setReimbursements((items) => [reimbursement, ...items]),
        updateReimbursement: (id, reimbursement) => setReimbursements((items) => items.map((item) => (item.id === id ? reimbursement : item))),
        deleteReimbursement: (id) => setReimbursements((items) => items.filter((item) => item.id !== id)),
        addReimbursementNotification: (notification) => setReimbursementNotifications((items) => [notification, ...items]),
        updateReimbursementNotification: (id, notification) => setReimbursementNotifications((items) => items.map((item) => (item.id === id ? notification : item))),
        addTaskNotification: (notification) => setTaskNotifications((items) => [notification, ...items]),
        updateTaskNotification: (id, notification) => setTaskNotifications((items) => items.map((item) => (item.id === id ? notification : item))),
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
