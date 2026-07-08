"use client";

import { useAppData } from "@/components/app-data";
import { Header } from "@/components/header";
import { fieldClass, Modal } from "@/components/modal";
import { Badge, Button, Card } from "@/components/ui";
import {
  projectStatuses,
  teamRoles,
  zooAvatars,
  type AppCalendarEvent,
  type EventResponse,
  type ProjectPriority,
  type ProjectStatus,
  type ProjectTask,
  type TaskComment,
  type TaskNotification,
  type TeamMember,
  type TeamRole,
} from "@/lib/client-projects";
import { getUserAccess } from "@/lib/auth";
import { getClientProjects } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  Bell,
  CalendarDays,
  CalendarPlus,
  ChartGantt,
  Check,
  ChevronRight,
  Clock3,
  Columns3,
  Lock,
  Mail,
  MessageSquareText,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UserRoundPlus,
  UsersRound,
  Video,
  X,
  MessageSquarePlus,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

const statusMeta: Record<ProjectStatus, { label: string; accent: string; bg: string }> = {
  Backlog: { label: "Backlog", accent: "bg-slate-400", bg: "bg-slate-50 dark:bg-slate-950" },
  Scheduled: { label: "Scheduled", accent: "bg-sky-400", bg: "bg-sky-50/80 dark:bg-sky-950/30" },
  "In Progress": { label: "In Progress", accent: "bg-amber-400", bg: "bg-amber-50/80 dark:bg-amber-950/30" },
  Review: { label: "Review", accent: "bg-violet-400", bg: "bg-violet-50/80 dark:bg-violet-950/30" },
  Done: { label: "Done", accent: "bg-emerald-400", bg: "bg-emerald-50/80 dark:bg-emerald-950/30" },
};

const priorityTone: Record<ProjectPriority, "red" | "amber" | "slate"> = {
  High: "red",
  Medium: "amber",
  Low: "slate",
};

const reminderOffsets = new Set([3, 1, 0, -1]);
const socialMediaKeywords = ["social media", "content", "production"];
const adsMarketplaceKeywords = ["meta ads", "shopee", "tiktok", "marketplace", "ads growth", "ads management"];
type ProjectHubView = "board" | "client-board" | "timeline" | "clients" | "calendar";

const avatarEmoji: Record<string, string> = {
  Lion: "🦁",
  Panda: "🐼",
  Koala: "🐨",
  Tiger: "🐯",
  Giraffe: "🦒",
  Penguin: "🐧",
  Fox: "🦊",
  Elephant: "🐘",
  Zebra: "🦓",
  Otter: "🦦",
};

const today = () => new Date().toISOString().slice(0, 10);

function formatDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function daysBetween(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
}

function dayDistance(from: string, to: string) {
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T00:00:00`);
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86400000);
}

function reminderLabel(distance: number) {
  if (distance === 3) return "H-3";
  if (distance === 1) return "H-1";
  if (distance === 0) return "Hari H";
  if (distance === -1) return "H+1";
  return `${Math.abs(distance)} hari`;
}

function dateOffset(base: string, value: string) {
  const baseDate = new Date(`${base}T00:00:00`);
  const date = new Date(`${value}T00:00:00`);
  return Math.max(0, Math.round((date.getTime() - baseDate.getTime()) / 86400000));
}

function getGoogleCalendarUrl(event: AppCalendarEvent, attendees: TeamMember[]) {
  const start = `${event.date.replaceAll("-", "")}T${event.startTime.replace(":", "")}00`;
  const end = `${event.date.replaceAll("-", "")}T${event.endTime.replace(":", "")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: event.meetLink ? `Google Meet: ${event.meetLink}` : "GrowthHive Project Hub event",
    add: attendees.map((member) => member.email).join(","),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function textMatchesKeywords(value: string, keywords: string[]) {
  const normalized = value.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function memberProjectKeywords(member?: TeamMember) {
  if (!member) return [];
  if (member.id === "tm-inaya" || member.id === "tm-sellina") return socialMediaKeywords;
  if (member.id === "tm-joshua") return adsMarketplaceKeywords;
  return [];
}

export default function ClientManagementPage() {
  const {
    projectTasks,
    calendarEvents,
    teamMembers,
    clients,
    taskNotifications,
    saveProjectTasks,
    addProjectTask,
    updateProjectTask,
    moveProjectTask,
    saveCalendarEvents,
    addCalendarEvent,
    saveTeamMembers,
    addTaskNotification,
    updateTaskNotification,
  } = useAppData();
  const [view, setView] = useState<ProjectHubView>("board");
  const [taskModal, setTaskModal] = useState(false);
  const [progressModal, setProgressModal] = useState(false);
  const [commentModal, setCommentModal] = useState(false);
  const [eventModal, setEventModal] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [progressTask, setProgressTask] = useState<ProjectTask | null>(null);
  const [commentTask, setCommentTask] = useState<ProjectTask | null>(null);
  const [selectedDate, setSelectedDate] = useState(today());
  const [currentEmail, setCurrentEmail] = useState("");

  const memberById = (id: string) => teamMembers.find((member) => member.id === id) || teamMembers[0];
  const memberByEmail = (email: string) => teamMembers.find((member) => member.email.toLowerCase() === email.toLowerCase());
  const currentMember = memberByEmail(currentEmail) || (getUserAccess(currentEmail) === "admin" ? teamMembers[0] : undefined);
  const access = getUserAccess(currentEmail);
  const isAdmin = access === "admin";
  const isReadOnly = access === "readonly";
  const canReadAll = isAdmin || isReadOnly;
  const canMoveTask = (task: ProjectTask) => Boolean(!isReadOnly && currentMember && task.assigneeId === currentMember.id);
  const canEditTask = (task: ProjectTask) => Boolean(!isReadOnly && currentMember && task.assignedById === currentMember.id);
  const canProgressTask = (task: ProjectTask) => Boolean(!isReadOnly && currentMember && task.assigneeId === currentMember.id);
  const canCommentTask = (task: ProjectTask) => Boolean(!isReadOnly && currentMember && task.watcherId === currentMember.id);
  const activeClients = clients.filter((client) => client.stage === "Client (Active)");
  const allowedProjectKeywords = canReadAll ? [] : memberProjectKeywords(currentMember);
  const canSeeProjectName = (projectName: string) => canReadAll || textMatchesKeywords(projectName, allowedProjectKeywords);
  const visibleClientProjects = (client: (typeof activeClients)[number]) => {
    const projects = getClientProjects(client);
    if (canReadAll) return projects;
    return projects.filter((project) => canSeeProjectName(`${project.name} ${project.scope || ""}`));
  };
  const visibleActiveClients = activeClients.filter((client) => visibleClientProjects(client).length > 0);
  const canSeeTask = (task: ProjectTask) => {
    if (canReadAll) return true;
    if (!currentMember) return false;
    if ([task.assigneeId, task.assignedById, task.watcherId].includes(currentMember.id)) return true;
    return canSeeProjectName(task.project);
  };
  const visibleProjectTasks = projectTasks.filter(canSeeTask);
  const taskClientNames = Array.from(new Set(visibleProjectTasks.map((task) => task.client || "Internal"))).sort((a, b) => {
    const activeClientOrder = visibleActiveClients.map((client) => client.brand);
    const indexA = activeClientOrder.indexOf(a);
    const indexB = activeClientOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
  const projectOptions = Array.from(new Set(visibleActiveClients.flatMap((client) => visibleClientProjects(client).map((project) => project.name))));
  const clientOptions = visibleActiveClients.map((client) => client.brand);
  const assigners = teamMembers.filter((member) => member.id === "tm-christopher" || member.id === "tm-inaya");
  const defaultAssigner = assigners.find((member) => member.id === currentMember?.id) || assigners[0] || teamMembers[0];
  const taskProjectOptions = Array.from(new Set([...(editingTask?.project ? [editingTask.project] : []), ...projectOptions]));
  const taskClientOptions = Array.from(new Set([...(editingTask?.client ? [editingTask.client] : []), ...clientOptions]));
  const activeTasks = visibleProjectTasks.filter((task) => task.status !== "Done");
  const dueThisWeek = visibleProjectTasks.filter((task) => {
    const distance = daysBetween(today(), task.dueDate);
    return task.status !== "Done" && distance <= 7;
  }).length;
  const appEventsToday = calendarEvents.filter((event) => event.date === selectedDate);
  const myNotifications = currentMember ? taskNotifications.filter((notification) => notification.recipientId === currentMember.id) : [];
  const unreadNotifications = myNotifications.filter((notification) => !notification.read).length;
  const timeline = useMemo(() => {
    const base = visibleProjectTasks.length ? visibleProjectTasks.map((task) => task.dueDate).sort()[0] : today();
    return { base, span: Math.max(14, ...visibleProjectTasks.map((task) => dateOffset(base, task.dueDate) + 1)) };
  }, [visibleProjectTasks]);

  useEffect(() => {
    fetch("/api/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setCurrentEmail(data?.email || ""))
      .catch(() => setCurrentEmail(""));
  }, []);

  async function sendTaskEmail(notification: TaskNotification) {
    try {
      const response = await fetch("/api/task-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: notification.recipientEmail,
          subject: notification.title,
          message: notification.message,
        }),
      });
      const result = await response.json();
      updateTaskNotification(notification.id, { ...notification, emailSent: Boolean(result.sent), emailError: result.error });
    } catch {
      updateTaskNotification(notification.id, { ...notification, emailSent: false, emailError: "Email gagal dipanggil dari browser." });
    }
  }

  function createTaskNotification(task: ProjectTask, recipient: TeamMember, kind: TaskNotification["kind"], title: string, message: string) {
    const notification: TaskNotification = {
      id: crypto.randomUUID(),
      taskId: task.id,
      recipientId: recipient.id,
      recipientEmail: recipient.email,
      kind,
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    };
    addTaskNotification(notification);
    void sendTaskEmail(notification);
  }

  function notifyTaskAssignee(task: ProjectTask, recipient: TeamMember, title: string, message: string, logKey: string) {
    if (task.notificationLog?.includes(logKey)) return;
    createTaskNotification(task, recipient, logKey.startsWith("reminder") ? "reminder" : "assigned", title, message);
    updateProjectTask(task.id, { ...task, notificationLog: [...(task.notificationLog || []), logKey] });
  }

  useEffect(() => {
    const currentDate = today();
    projectTasks.forEach((task) => {
      if (task.status === "Done") return;
      const distance = dayDistance(currentDate, task.dueDate);
      if (!reminderOffsets.has(distance)) return;
      const logKey = `reminder-${currentDate}-${distance}`;
      if (task.notificationLog?.includes(logKey)) return;
      const assignee = memberById(task.assigneeId);
      const progressCopy = task.progressUpdates?.length ? "Task belum selesai. Cek progress terakhir dan update status bila sudah ada perkembangan." : "Task belum selesai dan belum ada progress update tertulis.";
      notifyTaskAssignee(
        task,
        assignee,
        `[${reminderLabel(distance)}] Reminder task: ${task.title}`,
        `${progressCopy}\n\nTask: ${task.title}\nProject: ${task.project}\nClient: ${task.client || "-"}\nDeadline: ${formatDate(task.dueDate)}`,
        logKey,
      );
    });
    // Reminder delivery is guarded by task.notificationLog to avoid duplicate notifications.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTasks, teamMembers]);

  function openNewTask() {
    if (isReadOnly) return;
    setEditingTask(null);
    setTaskModal(true);
  }

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isReadOnly) return;
    if (editingTask && !canEditTask(editingTask)) return;
    const data = new FormData(event.currentTarget);
    const previousAssigneeId = editingTask?.assigneeId;
    const nextAssigneeId = String(data.get("assigneeId"));
    const assignmentLogKey = `assigned-${nextAssigneeId}-${Date.now()}`;
    const assignee = memberById(nextAssigneeId);
    const task: ProjectTask = {
      id: editingTask?.id || crypto.randomUUID(),
      title: String(data.get("title")),
      project: String(data.get("project")),
      client: String(data.get("client")),
      status: String(data.get("status")) as ProjectStatus,
      assigneeId: nextAssigneeId,
      assignedById: String(data.get("assignedById")),
      watcherId: String(data.get("watcherId")),
      dueDate: String(data.get("dueDate")),
      priority: String(data.get("priority")) as ProjectPriority,
      description: String(data.get("description")),
      progressUpdates: editingTask?.progressUpdates || [],
      comments: editingTask?.comments || [],
      notificationLog: editingTask?.notificationLog || [],
    };
    const shouldNotifyAssignee = !editingTask || previousAssigneeId !== task.assigneeId;
    const taskToSave = shouldNotifyAssignee ? { ...task, notificationLog: [...(task.notificationLog || []), assignmentLogKey] } : task;
    if (editingTask) updateProjectTask(editingTask.id, taskToSave);
    else addProjectTask(taskToSave);
    if (shouldNotifyAssignee) {
      createTaskNotification(
        taskToSave,
        assignee,
        "assigned",
        `Task baru: ${task.title}`,
        `Kamu di-assign untuk task "${task.title}".\n\nProject: ${task.project}\nClient: ${task.client || "-"}\nDeadline: ${formatDate(task.dueDate)}\nAssigned by: ${memberById(task.assignedById).name}`,
      );
    }
    setTaskModal(false);
    setEditingTask(null);
  }

  function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isReadOnly) return;
    const data = new FormData(event.currentTarget);
    const attendeeIds = data.getAll("attendeeIds").map(String);
    const ownerId = String(data.get("ownerId"));
    const responses: Record<string, EventResponse> = { [ownerId]: "Accepted" };
    attendeeIds.forEach((id) => {
      responses[id] = "Pending";
    });
    addCalendarEvent({
      id: crypto.randomUUID(),
      title: String(data.get("title")),
      date: String(data.get("date")),
      startTime: String(data.get("startTime")),
      endTime: String(data.get("endTime")),
      ownerId,
      attendeeIds,
      meetLink: String(data.get("meetLink")),
      responses,
    });
    setEventModal(false);
  }

  function submitMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin) return;
    const data = new FormData(event.currentTarget);
    const palette = ["bg-amber-100 text-amber-800", "bg-rose-100 text-rose-800", "bg-sky-100 text-sky-800", "bg-violet-100 text-violet-800", "bg-emerald-100 text-emerald-800"];
    saveTeamMembers([
      ...teamMembers,
      {
        id: crypto.randomUUID(),
        name: String(data.get("name")),
        email: String(data.get("email")),
        role: String(data.get("role")) as TeamRole,
        avatar: String(data.get("avatar")),
        color: palette[teamMembers.length % palette.length],
      },
    ]);
    setMemberModal(false);
  }

  function removeTask(task: ProjectTask) {
    if (!canEditTask(task)) return;
    if (!window.confirm(`Hapus task "${task.title}"?`)) return;
    saveProjectTasks(projectTasks.filter((item) => item.id !== task.id));
  }

  function openProgress(task: ProjectTask) {
    if (!canProgressTask(task)) return;
    setProgressTask(task);
    setProgressModal(true);
  }

  function openComment(task: ProjectTask) {
    if (!canCommentTask(task)) return;
    setCommentTask(task);
    setCommentModal(true);
  }

  function submitProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!progressTask) return;
    const data = new FormData(event.currentTarget);
    const updatedTask: ProjectTask = {
      ...progressTask,
      progressUpdates: [
        ...(progressTask.progressUpdates || []),
        {
          id: crypto.randomUUID(),
          authorId: progressTask.assigneeId,
          date: today(),
          note: String(data.get("note")),
        },
      ],
    };
    updateProjectTask(progressTask.id, updatedTask);
    setProgressTask(null);
    setProgressModal(false);
  }

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!commentTask || !canCommentTask(commentTask)) return;
    const data = new FormData(event.currentTarget);
    const comment: TaskComment = {
      id: crypto.randomUUID(),
      authorId: commentTask.watcherId,
      date: today(),
      note: String(data.get("note")),
    };
    updateProjectTask(commentTask.id, { ...commentTask, comments: [...(commentTask.comments || []), comment] });
    setCommentTask(null);
    setCommentModal(false);
  }

  function markNotificationRead(notification: TaskNotification) {
    updateTaskNotification(notification.id, { ...notification, read: true });
  }

  function respondToEvent(eventId: string, memberId: string, response: EventResponse) {
    saveCalendarEvents(calendarEvents.map((event) => event.id === eventId ? { ...event, responses: { ...event.responses, [memberId]: response } } : event));
  }

  return (
    <>
      <Header title="GH Project Hub" subtitle="Board, timeline, clients, dan meeting kerja tim GrowthHive." />

      <Card className="mb-5 overflow-hidden rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-black uppercase tracking-[.16em] text-teal-700">
              <Bell size={13} /> Task Notifications
            </div>
            <h2 className="font-black">Notifikasi Task</h2>
            <p className="text-xs text-slate-400">Assignment dan reminder H-3, H-1, Hari H, H+1 muncul untuk assignee.</p>
          </div>
          <Badge tone={unreadNotifications ? "amber" : "slate"}>{unreadNotifications} unread</Badge>
        </div>
        {!currentMember ? (
          <div className="border-t border-slate-100 p-5 text-sm font-bold text-slate-400 dark:border-slate-800">Akun ini belum cocok dengan anggota Project Hub.</div>
        ) : !myNotifications.length ? (
          <div className="border-t border-slate-100 p-5 text-sm font-bold text-slate-400 dark:border-slate-800">Belum ada notifikasi untuk kamu.</div>
        ) : (
          <div className="grid border-t border-slate-100 dark:border-slate-800 md:grid-cols-2 xl:grid-cols-3">
            {myNotifications.slice(0, 6).map((notification) => (
              <button key={notification.id} onClick={() => markNotificationRead(notification)} className={cn("border-b border-r border-slate-100 p-4 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60", !notification.read && "bg-teal-50/50 dark:bg-teal-950/20")}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Badge tone={notification.kind === "assigned" ? "teal" : "amber"}>{notification.kind === "assigned" ? "Assigned" : "Reminder"}</Badge>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400"><Mail size={11} />{notification.emailSent ? "email sent" : "email pending"}</span>
                </div>
                <p className="line-clamp-1 text-sm font-black">{notification.title}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{notification.message}</p>
              </button>
            ))}
          </div>
        )}
      </Card>

      <section className="mb-5 grid gap-4 xl:grid-cols-[1.4fr_.9fr]">
        <div className="overflow-hidden rounded-lg border border-white bg-[#fbfbf7] shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="relative p-5">
            <div className="absolute right-6 top-5 flex gap-2">
              <span className="h-2 w-2 animate-bounce rounded-full bg-rose-300" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-sky-300 [animation-delay:120ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-300 [animation-delay:240ms]" />
            </div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-[11px] font-black uppercase tracking-[.18em] text-rose-700">
              <Sparkles size={13} /> Shared Workspace
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { label: "Active Task", value: activeTasks.length, color: "bg-teal-100 text-teal-800", icon: Columns3 },
                { label: "Deadline 7 Hari", value: dueThisWeek, color: "bg-amber-100 text-amber-800", icon: Clock3 },
                { label: "Active Client", value: visibleActiveClients.length, color: "bg-emerald-100 text-emerald-800", icon: UsersRound },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="rounded-lg border border-white bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className={cn("mb-4 grid h-10 w-10 place-items-center rounded-lg", color)}><Icon size={18} /></div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="mt-1 text-2xl font-black text-ink dark:text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Card className="rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-slate-400">Zoo Team</p>
              <h2 className="mt-1 font-black">Avatar Tim</h2>
            </div>
            {isAdmin && <button onClick={() => setMemberModal(true)} title="Tambah user" className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              <UserRoundPlus size={17} />
            </button>}
          </div>
          <div className="flex flex-wrap gap-2">
            {teamMembers.map((member) => (
              <div key={member.id} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black", member.color)}>
                <span className="text-lg leading-none">{avatarEmoji[member.avatar]}</span>
                <span>{member.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-white p-3 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "board", label: "Board", icon: Columns3 },
            { id: "client-board", label: "Client Board", icon: UsersRound },
            { id: "timeline", label: "Timeline", icon: ChartGantt },
            { id: "clients", label: "Clients", icon: UsersRound },
            { id: "calendar", label: "Calendar", icon: CalendarDays },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setView(id as ProjectHubView)} className={cn("inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-black transition", view === id ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800")}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
        {!isReadOnly && <div className="flex flex-wrap gap-2">
          <Button onClick={openNewTask}><Plus size={16} />Task</Button>
          <Button variant="outline" onClick={() => setEventModal(true)}><CalendarPlus size={16} />Event</Button>
        </div>}
      </section>

      {view === "board" && (
        <section className="flex gap-3 overflow-x-auto pb-4">
          {projectStatuses.map((status) => {
            const items = visibleProjectTasks.filter((task) => task.status === status);
            return (
              <div key={status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
                const taskId = event.dataTransfer.getData("id");
                const task = visibleProjectTasks.find((item) => item.id === taskId);
                if (!task || !canMoveTask(task)) return;
                moveProjectTask(taskId, status);
              }} className={cn("min-h-[480px] w-[286px] shrink-0 rounded-lg p-3", statusMeta[status].bg)}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", statusMeta[status].accent)} />
                  <h3 className="text-sm font-black">{statusMeta[status].label}</h3>
                  <span className="ml-auto rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-400 dark:bg-slate-900">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.map((task) => <TaskCard key={task.id} task={task} member={memberById(task.assigneeId)} assigner={memberById(task.assignedById)} watcher={memberById(task.watcherId)} canMove={canMoveTask(task)} canEdit={canEditTask(task)} canProgress={canProgressTask(task)} canComment={canCommentTask(task)} onEdit={() => { if (!canEditTask(task)) return; setEditingTask(task); setTaskModal(true); }} onProgress={() => openProgress(task)} onComment={() => openComment(task)} onRemove={() => removeTask(task)} />)}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {view === "client-board" && (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h2 className="font-black">Task Board per Client</h2>
              <p className="text-xs text-slate-400">Kolom berdasarkan client, isi task diurutkan dari deadline terdekat.</p>
            </div>
            <Badge tone="teal">{visibleProjectTasks.length} task</Badge>
          </div>
          {!visibleProjectTasks.length ? <EmptyProjectState /> : (
            <div className="flex gap-3 overflow-x-auto pb-4">
              {taskClientNames.map((clientName) => {
                const items = visibleProjectTasks
                  .filter((task) => (task.client || "Internal") === clientName)
                  .sort((a, b) => new Date(`${a.dueDate}T00:00:00`).getTime() - new Date(`${b.dueDate}T00:00:00`).getTime());
                const activeCount = items.filter((task) => task.status !== "Done").length;
                return (
                  <div key={clientName} className="min-h-[480px] w-[320px] shrink-0 rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                    <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-black">{clientName}</h3>
                          <p className="mt-1 text-xs text-slate-400">{activeCount} active task</p>
                        </div>
                        <Badge tone="slate">{items.length}</Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {items.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          member={memberById(task.assigneeId)}
                          assigner={memberById(task.assignedById)}
                          watcher={memberById(task.watcherId)}
                          canMove={false}
                          canEdit={canEditTask(task)}
                          canProgress={canProgressTask(task)}
                          canComment={canCommentTask(task)}
                          showStatus
                          showMoveLock={false}
                          onEdit={() => { if (!canEditTask(task)) return; setEditingTask(task); setTaskModal(true); }}
                          onProgress={() => openProgress(task)}
                          onComment={() => openComment(task)}
                          onRemove={() => removeTask(task)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {view === "timeline" && (
        <Card className="rounded-lg p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-black">Timeline Deadline</h2>
              <p className="text-xs text-slate-400">Base date {formatDate(timeline.base)}</p>
            </div>
            <Badge tone="slate">{timeline.span} hari</Badge>
          </div>
          {!visibleProjectTasks.length ? <EmptyProjectState /> : <div className="space-y-3 overflow-x-auto pb-2">
            {visibleProjectTasks.map((task) => {
              const offset = dateOffset(timeline.base, task.dueDate);
              const width = 1;
              return (
                <div key={task.id} className="grid min-w-[860px] grid-cols-[230px_1fr] items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar member={memberById(task.assigneeId)} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{task.title}</p>
                      <p className="truncate text-xs text-slate-400">{task.client || task.project}</p>
                    </div>
                  </div>
                  <div className="relative h-12 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <div className={cn("absolute top-2 h-8 rounded-lg px-3 py-2 text-xs font-black text-white", statusMeta[task.status].accent)} style={{ left: `${(offset / timeline.span) * 100}%`, width: `${Math.max(8, (width / timeline.span) * 100)}%` }}>
                      {formatDate(task.dueDate)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>}
        </Card>
      )}

      {view === "clients" && (
        <Card className="overflow-hidden rounded-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <h2 className="font-black">Active Clients</h2>
              <p className="text-xs text-slate-400">Otomatis dari CRM stage Client (Active)</p>
            </div>
            <Badge tone="teal">{visibleActiveClients.length} berjalan</Badge>
          </div>
          {!visibleActiveClients.length ? <EmptyProjectState /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-[.12em] text-slate-400 dark:bg-slate-950">
                  <tr>{["Client", "PIC", "Layanan / Project", "Scope Kerja Sama", "Output", "Owner", "Health"].map((item) => <th key={item} className="p-4">{item}</th>)}</tr>
                </thead>
                <tbody>
                  {visibleActiveClients.map((client) => {
                    const projects = visibleClientProjects(client);
                    return (
                      <tr key={client.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="p-4 font-black">{client.brand}</td>
                        <td className="p-4">{client.pic}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">{projects.map((project) => <Badge key={project.id} tone="slate">{project.name}</Badge>)}</div>
                        </td>
                        <td className="max-w-sm p-4 text-xs leading-5 text-slate-500">
                          <div className="space-y-2">{projects.map((project) => <p key={project.id}>{project.scope || project.name}</p>)}</div>
                        </td>
                        <td className="p-4 text-slate-500">{client.nextAction || "Output mengikuti task board"}</td>
                        <td className="p-4">{client.owner || "GH"}</td>
                        <td className="p-4"><Badge tone={client.health === "Red" ? "red" : client.health === "Amber" ? "amber" : "teal"}>{client.health || "Green"}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {view === "calendar" && (
        <section className="grid gap-5 xl:grid-cols-[280px_1fr]">
          <Card className="rounded-lg p-5">
            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Tanggal Event</span>
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className={fieldClass} />
            </label>
            <div className="mt-5 rounded-lg bg-teal-50 p-4 text-sm font-bold text-teal-800">
              Calendar view hanya berisi event yang dibuat di Project Hub.
            </div>
          </Card>
          <div className="space-y-3">
            {appEventsToday.map((event) => {
              const attendees = event.attendeeIds.map(memberById);
              return (
                <Card key={event.id} className="rounded-lg p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400"><Video size={14} /> {event.startTime} - {event.endTime}</div>
                      <h3 className="text-lg font-black">{event.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">Owner: {memberById(event.ownerId).name}</p>
                    </div>
                    <a href={getGoogleCalendarUrl(event, attendees)} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                      Google Calendar <ChevronRight size={15} />
                    </a>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {attendees.map((member) => (
                      <div key={member.id} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <Avatar member={member} />
                          <Badge tone={event.responses[member.id] === "Accepted" ? "teal" : event.responses[member.id] === "Declined" ? "red" : "amber"}>{event.responses[member.id] || "Pending"}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => respondToEvent(event.id, member.id, "Accepted")} title="Accept invitation" className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Check size={15} /></button>
                          <button onClick={() => respondToEvent(event.id, member.id, "Declined")} title="Decline invitation" className="grid h-9 w-9 place-items-center rounded-lg bg-rose-50 text-rose-700"><X size={15} /></button>
                          {event.responses[member.id] === "Accepted" && <span className="inline-flex h-9 items-center rounded-lg bg-sky-50 px-3 text-xs font-black text-sky-700">Synced</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
            {!appEventsToday.length && <EmptyProjectState />}
          </div>
        </section>
      )}

      <Modal open={taskModal} title={editingTask ? "Edit Task" : "Tambah Task"} onClose={() => { setTaskModal(false); setEditingTask(null); }}>
        <form onSubmit={submitTask} className="space-y-4">
          <input name="title" required defaultValue={editingTask?.title || ""} className={fieldClass} placeholder="Nama task" />
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs font-bold">Project berjalan</span>
              <select name="project" required defaultValue={editingTask?.project || ""} className={fieldClass}>
                <option value="" disabled>{taskProjectOptions.length ? "Pilih project" : "Belum ada project active"}</option>
                {taskProjectOptions.map((project) => <option key={project}>{project}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold">Client / brand</span>
              <select name="client" required defaultValue={editingTask?.client || ""} className={fieldClass}>
                <option value="" disabled>{taskClientOptions.length ? "Pilih client" : "Belum ada client active"}</option>
                {taskClientOptions.map((client) => <option key={client}>{client}</option>)}
              </select>
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs font-bold">Assign ke</span>
              <select name="assigneeId" defaultValue={editingTask?.assigneeId || teamMembers[0]?.id} className={fieldClass}>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold">Assigned by</span>
              <select name="assignedById" defaultValue={editingTask?.assignedById || defaultAssigner?.id} className={fieldClass}>{assigners.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <select name="status" defaultValue={editingTask?.status || "Scheduled"} className={fieldClass}>{projectStatuses.map((status) => <option key={status}>{status}</option>)}</select>
            <select name="priority" defaultValue={editingTask?.priority || "Medium"} className={fieldClass}>{(["High", "Medium", "Low"] as ProjectPriority[]).map((priority) => <option key={priority}>{priority}</option>)}</select>
            <input name="dueDate" required type="date" defaultValue={editingTask?.dueDate || today()} className={fieldClass} />
          </div>
          <label>
            <span className="mb-2 block text-xs font-bold">Pengawas progress</span>
            <select name="watcherId" defaultValue={editingTask?.watcherId || editingTask?.assignedById || defaultAssigner?.id} className={fieldClass}>{assigners.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
          </label>
          <textarea name="description" defaultValue={editingTask?.description || ""} rows={4} className={`${fieldClass} h-auto py-3`} placeholder="Catatan singkat" />
          {!visibleActiveClients.length && <p className="rounded-lg bg-amber-50 p-3 text-xs font-bold text-amber-700">Belum ada client active yang sesuai dengan scope akses akun ini.</p>}
          <Button disabled={!taskProjectOptions.length || !taskClientOptions.length} className="w-full">Simpan Task</Button>
        </form>
      </Modal>

      <Modal open={progressModal} title={`Progress · ${progressTask?.title || ""}`} onClose={() => { setProgressModal(false); setProgressTask(null); }}>
        {progressTask && <form onSubmit={submitProgress} className="space-y-4">
          <div className="rounded-lg bg-teal-50 p-3 text-xs font-bold text-teal-800">Progress update ditulis oleh assignee: {memberById(progressTask.assigneeId).name}</div>
          <textarea name="note" required rows={5} className={`${fieldClass} h-auto py-3`} placeholder="Tulis notes atau progress update terbaru" />
          <div className="space-y-3">
            {(progressTask.progressUpdates || []).slice().reverse().map((update) => (
              <div key={update.id} className="rounded-lg border border-slate-100 p-3 text-sm dark:border-slate-800">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="font-black">{memberById(update.authorId).name}</span>
                  <span className="text-xs text-slate-400">{formatDate(update.date)}</span>
                </div>
                <p className="whitespace-pre-line text-slate-500 dark:text-slate-300">{update.note}</p>
              </div>
            ))}
          </div>
          <Button className="w-full">Simpan Progress</Button>
        </form>}
      </Modal>

      <Modal open={commentModal} title={`Komentar PIC · ${commentTask?.title || ""}`} onClose={() => { setCommentModal(false); setCommentTask(null); }}>
        {commentTask && <form onSubmit={submitComment} className="space-y-4">
          <div className="rounded-lg bg-amber-50 p-3 text-xs font-bold text-amber-800">Komentar tambahan hanya bisa ditulis oleh pengawas/PIC: {memberById(commentTask.watcherId).name}</div>
          <textarea name="note" required rows={5} className={`${fieldClass} h-auto py-3`} placeholder="Tulis komentar, arahan, atau feedback tambahan" />
          <div className="space-y-3">
            {(commentTask.comments || []).slice().reverse().map((comment) => (
              <div key={comment.id} className="rounded-lg border border-slate-100 p-3 text-sm dark:border-slate-800">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="font-black">{memberById(comment.authorId).name}</span>
                  <span className="text-xs text-slate-400">{formatDate(comment.date)}</span>
                </div>
                <p className="whitespace-pre-line text-slate-500 dark:text-slate-300">{comment.note}</p>
              </div>
            ))}
          </div>
          <Button className="w-full">Simpan Komentar PIC</Button>
        </form>}
      </Modal>

      <Modal open={eventModal} title="Buat Event Kerja" onClose={() => setEventModal(false)}>
        <form onSubmit={submitEvent} className="space-y-4">
          <input name="title" required className={fieldClass} placeholder="Judul event" />
          <div className="grid gap-3 md:grid-cols-3">
            <input name="date" type="date" defaultValue={selectedDate} className={fieldClass} />
            <input name="startTime" type="time" defaultValue="10:00" className={fieldClass} />
            <input name="endTime" type="time" defaultValue="11:00" className={fieldClass} />
          </div>
          <select name="ownerId" className={fieldClass}>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">Invite</p>
            <div className="grid gap-2 md:grid-cols-2">
              {teamMembers.map((member) => <label key={member.id} className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="attendeeIds" value={member.id} defaultChecked />{member.name}</label>)}
            </div>
          </div>
          <input name="meetLink" className={fieldClass} placeholder="Google Meet link" />
          <Button className="w-full">Kirim Invitation</Button>
        </form>
      </Modal>

      <Modal open={memberModal} title="Tambah Avatar Tim" onClose={() => setMemberModal(false)}>
        <form onSubmit={submitMember} className="space-y-4">
          <input name="name" required className={fieldClass} placeholder="Nama user" />
          <input name="email" required type="email" className={fieldClass} placeholder="Email Google" />
          <select name="role" className={fieldClass}>{teamRoles.map((role) => <option key={role}>{role}</option>)}</select>
          <select name="avatar" className={fieldClass}>{zooAvatars.map((avatar) => <option key={avatar}>{avatar}</option>)}</select>
          <Button className="w-full">Simpan Avatar</Button>
        </form>
      </Modal>
    </>
  );
}

function Avatar({ member }: { member: TeamMember }) {
  return <div className="flex min-w-0 items-center gap-2"><span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg", member.color)}>{avatarEmoji[member.avatar]}</span><div className="min-w-0"><p className="truncate text-sm font-black">{member.name}</p><p className="truncate text-[11px] text-slate-400">{member.role}</p></div></div>;
}

function TaskCard({
  task,
  member,
  assigner,
  watcher,
  canMove,
  canEdit,
  canProgress,
  canComment,
  showStatus = false,
  showMoveLock = true,
  onEdit,
  onProgress,
  onComment,
  onRemove,
}: {
  task: ProjectTask;
  member: TeamMember;
  assigner: TeamMember;
  watcher: TeamMember;
  canMove: boolean;
  canEdit: boolean;
  canProgress: boolean;
  canComment: boolean;
  showStatus?: boolean;
  showMoveLock?: boolean;
  onEdit: () => void;
  onProgress: () => void;
  onComment: () => void;
  onRemove: () => void;
}) {
  const latestUpdate = task.progressUpdates?.slice().reverse()[0];
  const latestComment = task.comments?.slice().reverse()[0];
  return (
    <article draggable={canMove} onDragStart={(event) => { if (!canMove) return; event.dataTransfer.setData("id", task.id); }} className={cn("animate-[fadeUp_.28s_ease-out] rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900", canMove ? "cursor-grab" : "cursor-default")}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-black">{task.title}</h4>
          <p className="mt-1 truncate text-xs text-slate-400">{task.project} · {task.client || "Internal"}</p>
          {showStatus && <div className="mt-2"><Badge tone={task.status === "Done" ? "teal" : task.status === "In Progress" || task.status === "Review" ? "amber" : "slate"}>{statusMeta[task.status].label}</Badge></div>}
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} disabled={!canEdit} title={canEdit ? "Edit task" : "Hanya pemberi assign yang bisa edit"} className={cn("grid h-8 w-8 place-items-center rounded-lg border", canEdit ? "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" : "border-slate-100 text-slate-300")}><Pencil size={14} /></button>
          <button onClick={onProgress} disabled={!canProgress} title={canProgress ? "Tambah progress" : "Hanya assignee yang bisa update progress"} className={cn("grid h-8 w-8 place-items-center rounded-lg border", canProgress ? "border-sky-200 text-sky-600 hover:bg-sky-50 dark:border-sky-900 dark:hover:bg-sky-950" : "border-slate-100 text-slate-300")}><MessageSquarePlus size={14} /></button>
          <button onClick={onComment} disabled={!canComment} title={canComment ? "Komentar PIC" : "Hanya pengawas/PIC yang bisa komentar"} className={cn("grid h-8 w-8 place-items-center rounded-lg border", canComment ? "border-amber-200 text-amber-600 hover:bg-amber-50" : "border-slate-100 text-slate-300")}><MessageSquareText size={14} /></button>
          <button onClick={onRemove} disabled={!canEdit} title={canEdit ? "Hapus task" : "Hanya pemberi assign yang bisa hapus"} className={cn("grid h-8 w-8 place-items-center rounded-lg border", canEdit ? "border-rose-200 text-rose-500 hover:bg-rose-50" : "border-slate-100 text-slate-300")}><Trash2 size={14} /></button>
        </div>
      </div>
      <Avatar member={member} />
      <div className="mt-3 grid gap-2 text-[11px] font-bold text-slate-400">
        <span>Assigned by {assigner.name}</span>
        <span>Pengawas {watcher.name}</span>
      </div>
      {showMoveLock && !canMove && <div className="mt-3 inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-400 dark:bg-slate-800"><Lock size={11} /> Board move dikunci untuk assignee</div>}
      <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500 dark:text-slate-300">{task.description || "Belum ada catatan."}</p>
      {latestUpdate && <div className="mt-3 rounded-lg bg-sky-50 p-3 text-xs leading-5 text-sky-800 dark:bg-sky-950 dark:text-sky-200"><span className="font-black">{member.name}: </span>{latestUpdate.note}</div>}
      {latestComment && <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800"><span className="font-black">{watcher.name}: </span>{latestComment.note}</div>}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
        <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
        <span className="text-xs font-black text-slate-500">{formatDate(task.dueDate)}</span>
      </div>
    </article>
  );
}

function EmptyProjectState() {
  return <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-900">Belum ada data untuk view ini.</div>;
}
