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
  type DailyWorkPlan,
  type EventResponse,
  type ProjectPriority,
  type ProjectStatus,
  type ProjectTask,
  type TeamMember,
  type TeamRole,
  type WorkPlanStatus,
} from "@/lib/client-projects";
import { getClientProjects } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CalendarPlus,
  ChartGantt,
  Check,
  ChevronRight,
  Clock3,
  Columns3,
  ListChecks,
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
import { FormEvent, useMemo, useState } from "react";

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

const planTone: Record<WorkPlanStatus, "teal" | "amber" | "red" | "slate"> = {
  Focus: "teal",
  Review: "amber",
  Blocked: "red",
  Done: "slate",
};

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

export default function ClientManagementPage() {
  const {
    projectTasks,
    dailyWorkPlans,
    calendarEvents,
    teamMembers,
    clients,
    saveProjectTasks,
    addProjectTask,
    updateProjectTask,
    moveProjectTask,
    saveDailyWorkPlans,
    addDailyWorkPlan,
    saveCalendarEvents,
    addCalendarEvent,
    saveTeamMembers,
  } = useAppData();
  const [view, setView] = useState<"board" | "timeline" | "clients" | "workplan" | "calendar">("board");
  const [taskModal, setTaskModal] = useState(false);
  const [progressModal, setProgressModal] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [eventModal, setEventModal] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [progressTask, setProgressTask] = useState<ProjectTask | null>(null);
  const [selectedDate, setSelectedDate] = useState(today());

  const memberById = (id: string) => teamMembers.find((member) => member.id === id) || teamMembers[0];
  const activeClients = clients.filter((client) => client.stage === "Client (Active)");
  const projectOptions = Array.from(new Set(activeClients.flatMap((client) => getClientProjects(client).map((project) => project.name))));
  const clientOptions = activeClients.map((client) => client.brand);
  const assigners = teamMembers.filter((member) => member.id === "tm-christopher" || member.id === "tm-inaya");
  const taskProjectOptions = Array.from(new Set([...(editingTask?.project ? [editingTask.project] : []), ...projectOptions]));
  const taskClientOptions = Array.from(new Set([...(editingTask?.client ? [editingTask.client] : []), ...clientOptions]));
  const activeTasks = projectTasks.filter((task) => task.status !== "Done");
  const dueThisWeek = projectTasks.filter((task) => {
    const distance = daysBetween(today(), task.dueDate);
    return task.status !== "Done" && distance <= 7;
  }).length;
  const plansToday = dailyWorkPlans.filter((plan) => plan.date === selectedDate);
  const appEventsToday = calendarEvents.filter((event) => event.date === selectedDate);
  const timeline = useMemo(() => {
    const base = projectTasks.length ? projectTasks.map((task) => task.dueDate).sort()[0] : today();
    return { base, span: Math.max(14, ...projectTasks.map((task) => dateOffset(base, task.dueDate) + 1)) };
  }, [projectTasks]);

  function openNewTask() {
    setEditingTask(null);
    setTaskModal(true);
  }

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const task: ProjectTask = {
      id: editingTask?.id || crypto.randomUUID(),
      title: String(data.get("title")),
      project: String(data.get("project")),
      client: String(data.get("client")),
      status: String(data.get("status")) as ProjectStatus,
      assigneeId: String(data.get("assigneeId")),
      assignedById: String(data.get("assignedById")),
      watcherId: String(data.get("watcherId")),
      dueDate: String(data.get("dueDate")),
      priority: String(data.get("priority")) as ProjectPriority,
      description: String(data.get("description")),
      progressUpdates: editingTask?.progressUpdates || [],
    };
    if (editingTask) updateProjectTask(editingTask.id, task);
    else addProjectTask(task);
    setTaskModal(false);
    setEditingTask(null);
  }

  function submitPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    addDailyWorkPlan({
      id: crypto.randomUUID(),
      userId: String(data.get("userId")),
      date: String(data.get("date")),
      focus: String(data.get("focus")),
      tasks: String(data.get("tasks")),
      blocker: String(data.get("blocker")),
      status: String(data.get("status")) as WorkPlanStatus,
    });
    setPlanModal(false);
  }

  function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    if (!window.confirm(`Hapus task "${task.title}"?`)) return;
    saveProjectTasks(projectTasks.filter((item) => item.id !== task.id));
  }

  function openProgress(task: ProjectTask) {
    setProgressTask(task);
    setProgressModal(true);
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
          authorId: String(data.get("authorId")),
          date: today(),
          note: String(data.get("note")),
        },
      ],
    };
    updateProjectTask(progressTask.id, updatedTask);
    setProgressTask(null);
    setProgressModal(false);
  }

  function removePlan(plan: DailyWorkPlan) {
    saveDailyWorkPlans(dailyWorkPlans.filter((item) => item.id !== plan.id));
  }

  function respondToEvent(eventId: string, memberId: string, response: EventResponse) {
    saveCalendarEvents(calendarEvents.map((event) => event.id === eventId ? { ...event, responses: { ...event.responses, [memberId]: response } } : event));
  }

  return (
    <>
      <Header title="GH Project Hub" subtitle="Board, timeline, work plan, dan meeting kerja tim GrowthHive." />

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
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Active Task", value: activeTasks.length, color: "bg-teal-100 text-teal-800", icon: Columns3 },
                { label: "Deadline 7 Hari", value: dueThisWeek, color: "bg-amber-100 text-amber-800", icon: Clock3 },
                { label: "Active Client", value: activeClients.length, color: "bg-emerald-100 text-emerald-800", icon: UsersRound },
                { label: "Work Plan", value: plansToday.length, color: "bg-sky-100 text-sky-800", icon: ListChecks },
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
            <button onClick={() => setMemberModal(true)} title="Tambah user" className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              <UserRoundPlus size={17} />
            </button>
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
            { id: "timeline", label: "Timeline", icon: ChartGantt },
            { id: "clients", label: "Clients", icon: UsersRound },
            { id: "workplan", label: "Work Plan", icon: ListChecks },
            { id: "calendar", label: "Calendar", icon: CalendarDays },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setView(id as typeof view)} className={cn("inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-black transition", view === id ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800")}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openNewTask}><Plus size={16} />Task</Button>
          <Button variant="outline" onClick={() => setPlanModal(true)}><ListChecks size={16} />Work Plan</Button>
          <Button variant="outline" onClick={() => setEventModal(true)}><CalendarPlus size={16} />Event</Button>
        </div>
      </section>

      {view === "board" && (
        <section className="flex gap-3 overflow-x-auto pb-4">
          {projectStatuses.map((status) => {
            const items = projectTasks.filter((task) => task.status === status);
            return (
              <div key={status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => moveProjectTask(event.dataTransfer.getData("id"), status)} className={cn("min-h-[480px] w-[286px] shrink-0 rounded-lg p-3", statusMeta[status].bg)}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", statusMeta[status].accent)} />
                  <h3 className="text-sm font-black">{statusMeta[status].label}</h3>
                  <span className="ml-auto rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-400 dark:bg-slate-900">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.map((task) => <TaskCard key={task.id} task={task} member={memberById(task.assigneeId)} assigner={memberById(task.assignedById)} watcher={memberById(task.watcherId)} onEdit={() => { setEditingTask(task); setTaskModal(true); }} onProgress={() => openProgress(task)} onRemove={() => removeTask(task)} />)}
                </div>
              </div>
            );
          })}
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
          {!projectTasks.length ? <EmptyProjectState /> : <div className="space-y-3 overflow-x-auto pb-2">
            {projectTasks.map((task) => {
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
            <Badge tone="teal">{activeClients.length} berjalan</Badge>
          </div>
          {!activeClients.length ? <EmptyProjectState /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-[.12em] text-slate-400 dark:bg-slate-950">
                  <tr>{["Client", "PIC", "Layanan / Project", "Scope Kerja Sama", "Output", "Owner", "Health"].map((item) => <th key={item} className="p-4">{item}</th>)}</tr>
                </thead>
                <tbody>
                  {activeClients.map((client) => {
                    const projects = getClientProjects(client);
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

      {view === "workplan" && (
        <section className="grid gap-5 xl:grid-cols-[260px_1fr]">
          <Card className="rounded-lg p-5">
            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Tanggal</span>
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className={fieldClass} />
            </label>
            <div className="mt-5 space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                  <Avatar member={member} />
                  <Badge tone="slate">{dailyWorkPlans.filter((plan) => plan.userId === member.id && plan.date === selectedDate).length}</Badge>
                </div>
              ))}
            </div>
          </Card>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {plansToday.map((plan) => (
              <Card key={plan.id} className="rounded-lg p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <Avatar member={memberById(plan.userId)} />
                  <button onClick={() => removePlan(plan)} title="Hapus work plan" className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50"><Trash2 size={14} /></button>
                </div>
                <Badge tone={planTone[plan.status]}>{plan.status}</Badge>
                <h3 className="mt-3 font-black">{plan.focus}</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-500 dark:text-slate-300">{plan.tasks}</p>
                {plan.blocker && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-xs font-bold text-rose-700">{plan.blocker}</p>}
              </Card>
            ))}
            {!plansToday.length && <EmptyProjectState />}
          </div>
        </section>
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
              <select name="assignedById" defaultValue={editingTask?.assignedById || assigners[0]?.id} className={fieldClass}>{assigners.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <select name="status" defaultValue={editingTask?.status || "Scheduled"} className={fieldClass}>{projectStatuses.map((status) => <option key={status}>{status}</option>)}</select>
            <select name="priority" defaultValue={editingTask?.priority || "Medium"} className={fieldClass}>{(["High", "Medium", "Low"] as ProjectPriority[]).map((priority) => <option key={priority}>{priority}</option>)}</select>
            <input name="dueDate" required type="date" defaultValue={editingTask?.dueDate || today()} className={fieldClass} />
          </div>
          <label>
            <span className="mb-2 block text-xs font-bold">Pengawas progress</span>
            <select name="watcherId" defaultValue={editingTask?.watcherId || editingTask?.assignedById || assigners[0]?.id} className={fieldClass}>{assigners.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
          </label>
          <textarea name="description" defaultValue={editingTask?.description || ""} rows={4} className={`${fieldClass} h-auto py-3`} placeholder="Catatan singkat" />
          {!activeClients.length && <p className="rounded-lg bg-amber-50 p-3 text-xs font-bold text-amber-700">Tambahkan atau pindahkan deal CRM ke Client (Active) agar project dan client bisa dipilih.</p>}
          <Button disabled={!taskProjectOptions.length || !taskClientOptions.length} className="w-full">Simpan Task</Button>
        </form>
      </Modal>

      <Modal open={progressModal} title={`Progress · ${progressTask?.title || ""}`} onClose={() => { setProgressModal(false); setProgressTask(null); }}>
        {progressTask && <form onSubmit={submitProgress} className="space-y-4">
          <label>
            <span className="mb-2 block text-xs font-bold">Ditambahkan oleh</span>
            <select name="authorId" className={fieldClass}>{Array.from(new Set([progressTask.assignedById, progressTask.watcherId])).map((id) => <option key={id} value={id}>{memberById(id).name}</option>)}</select>
          </label>
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

      <Modal open={planModal} title="Isi Work Plan Harian" onClose={() => setPlanModal(false)}>
        <form onSubmit={submitPlan} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input name="date" type="date" defaultValue={selectedDate} className={fieldClass} />
            <select name="userId" className={fieldClass}>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
          </div>
          <input name="focus" required className={fieldClass} placeholder="Fokus utama hari ini" />
          <textarea name="tasks" required rows={5} className={`${fieldClass} h-auto py-3`} placeholder="Daftar pekerjaan" />
          <input name="blocker" className={fieldClass} placeholder="Blocker, opsional" />
          <select name="status" className={fieldClass}>{(["Focus", "Review", "Blocked", "Done"] as WorkPlanStatus[]).map((status) => <option key={status}>{status}</option>)}</select>
          <Button className="w-full">Simpan Work Plan</Button>
        </form>
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

function TaskCard({ task, member, assigner, watcher, onEdit, onProgress, onRemove }: { task: ProjectTask; member: TeamMember; assigner: TeamMember; watcher: TeamMember; onEdit: () => void; onProgress: () => void; onRemove: () => void }) {
  const latestUpdate = task.progressUpdates?.slice().reverse()[0];
  return (
    <article draggable onDragStart={(event) => event.dataTransfer.setData("id", task.id)} className="animate-[fadeUp_.28s_ease-out] rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-black">{task.title}</h4>
          <p className="mt-1 truncate text-xs text-slate-400">{task.project} · {task.client || "Internal"}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} title="Edit task" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><Pencil size={14} /></button>
          <button onClick={onProgress} title="Tambah progress" className="grid h-8 w-8 place-items-center rounded-lg border border-sky-200 text-sky-600 hover:bg-sky-50 dark:border-sky-900 dark:hover:bg-sky-950"><MessageSquarePlus size={14} /></button>
          <button onClick={onRemove} title="Hapus task" className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50"><Trash2 size={14} /></button>
        </div>
      </div>
      <Avatar member={member} />
      <div className="mt-3 grid gap-2 text-[11px] font-bold text-slate-400">
        <span>Assigned by {assigner.name}</span>
        <span>Pengawas {watcher.name}</span>
      </div>
      <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500 dark:text-slate-300">{task.description || "Belum ada catatan."}</p>
      {latestUpdate && <div className="mt-3 rounded-lg bg-sky-50 p-3 text-xs leading-5 text-sky-800 dark:bg-sky-950 dark:text-sky-200"><span className="font-black">{assigner.id === latestUpdate.authorId ? assigner.name : watcher.name}: </span>{latestUpdate.note}</div>}
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
