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
const sharedPollInterval = 5000;

type SharedProjectData = {
  tasks: ProjectTask[];
  notifications: TaskNotification[];
};

function readLocalArray<T>(key: string) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value as T[] : [];
  } catch {
    return [];
  }
}

async function fetchSharedProjectData(): Promise<SharedProjectData> {
  const response = await fetch("/api/shared-project-data", { cache: "no-store" });
  if (!response.ok) throw new Error("Shared project data belum tersedia.");
  return response.json();
}

async function writeSharedProjectData(payload: Partial<SharedProjectData>) {
  const response = await fetch("/api/shared-project-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Shared project data gagal disimpan.");
}

async function deleteSharedProjectData(taskIds: string[], notificationIds: string[] = []) {
  const response = await fetch("/api/shared-project-data", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskIds, notificationIds }),
  });
  if (!response.ok) throw new Error("Shared project data gagal dihapus.");
}

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
  const sharedReady = useRef(false);
  const pendingSharedWrites = useRef(0);

  async function syncSharedProjectData(payload: Partial<SharedProjectData>) {
    if (!sharedReady.current) return;
    pendingSharedWrites.current += 1;
    try {
      await writeSharedProjectData(payload);
    } catch {
      // Local storage remains the offline fallback until the next successful sync.
    } finally {
      pendingSharedWrites.current -= 1;
    }
  }

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

  useEffect(() => {
    let cancelled = false;

    async function initializeSharedData() {
      const localTasks = readLocalArray<ProjectTask>("gh-project-tasks-v3");
      const localNotifications = readLocalArray<TaskNotification>("gh-task-notifications-v1");
      try {
        const remote = await fetchSharedProjectData();
        const remoteTaskIds = new Set(remote.tasks.map((task) => task.id));
        const remoteNotificationIds = new Set(remote.notifications.map((notification) => notification.id));
        const tasksToImport = localTasks.filter((task) => !remoteTaskIds.has(task.id));
        const notificationsToImport = localNotifications.filter((notification) => !remoteNotificationIds.has(notification.id));
        if (tasksToImport.length || notificationsToImport.length) {
          await writeSharedProjectData({ tasks: tasksToImport, notifications: notificationsToImport });
        }
        if (cancelled) return;
        setProjectTasks([...remote.tasks, ...tasksToImport]);
        setTaskNotifications([...remote.notifications, ...notificationsToImport]);
        sharedReady.current = true;
      } catch {
        sharedReady.current = false;
      }
    }

    void initializeSharedData();
    const poll = window.setInterval(async () => {
      if (!sharedReady.current || pendingSharedWrites.current) return;
      try {
        const remote = await fetchSharedProjectData();
        if (cancelled) return;
        setProjectTasks(remote.tasks);
        setTaskNotifications(remote.notifications);
      } catch {
        // Keep the most recent local cache when the shared database is unreachable.
      }
    }, sharedPollInterval);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [setProjectTasks, setTaskNotifications]);

  function saveSharedTasks(tasks: ProjectTask[]) {
    const removedTaskIds = projectTasks.filter((task) => !tasks.some((item) => item.id === task.id)).map((task) => task.id);
    setProjectTasks(tasks);
    if (removedTaskIds.length && sharedReady.current) void deleteSharedProjectData(removedTaskIds);
    void syncSharedProjectData({ tasks });
  }

  function addSharedTask(task: ProjectTask) {
    setProjectTasks((items) => [task, ...items]);
    void syncSharedProjectData({ tasks: [task] });
  }

  function updateSharedTask(id: string, task: ProjectTask) {
    setProjectTasks((items) => items.map((item) => (item.id === id ? task : item)));
    void syncSharedProjectData({ tasks: [task] });
  }

  function moveSharedTask(id: string, status: ProjectStatus) {
    const current = projectTasks.find((task) => task.id === id);
    if (!current) return;
    const task = { ...current, status };
    setProjectTasks((items) => items.map((item) => (item.id === id ? task : item)));
    void syncSharedProjectData({ tasks: [task] });
  }

  function addSharedTaskNotification(notification: TaskNotification) {
    setTaskNotifications((items) => [notification, ...items]);
    void syncSharedProjectData({ notifications: [notification] });
  }

  function updateSharedTaskNotification(id: string, notification: TaskNotification) {
    setTaskNotifications((items) => items.map((item) => (item.id === id ? notification : item)));
    void syncSharedProjectData({ notifications: [notification] });
  }

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
        saveProjectTasks: saveSharedTasks,
        addProjectTask: addSharedTask,
        updateProjectTask: updateSharedTask,
        moveProjectTask: moveSharedTask,
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
        addTaskNotification: addSharedTaskNotification,
        updateTaskNotification: updateSharedTaskNotification,
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
