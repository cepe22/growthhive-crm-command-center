"use client";

import { useAppData } from "@/components/app-data";
import type { TaskNotification } from "@/lib/client-projects";
import { cn } from "@/lib/utils";
import { Bell, BellRing, BriefcaseBusiness, Moon, ReceiptText, Sun, Volume2 } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type UnifiedNotification = {
  id: string;
  source: "task" | "reimbursement";
  kind: "assigned" | "reminder" | "reimbursement";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  href: string;
};

const reminderOffsets = new Set([3, 1, 0, -1]);

function today() {
  return new Date().toISOString().slice(0, 10);
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
  return "H+1";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function playNotificationAlarm() {
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.05);
  gain.connect(context.destination);
  [
    { frequency: 880, start: 0, duration: 0.2 },
    { frequency: 1040, start: 0.32, duration: 0.2 },
    { frequency: 880, start: 0.64, duration: 0.28 },
  ].forEach(({ frequency, start, duration }) => {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + start);
    oscillator.connect(gain);
    oscillator.start(context.currentTime + start);
    oscillator.stop(context.currentTime + start + duration);
  });
  window.setTimeout(() => void context.close(), 1300);
}

function notificationLabel(kind: UnifiedNotification["kind"]) {
  if (kind === "assigned") return "Task assigned";
  if (kind === "reminder") return "Task reminder";
  return "Reimbursement";
}

export function Header({ title, subtitle }: { title: string; subtitle: string }) {
  const { theme, setTheme } = useTheme();
  const {
    reimbursementNotifications,
    taskNotifications,
    projectTasks,
    teamMembers,
    addTaskNotification,
    updateProjectTask,
    updateReimbursementNotification,
    updateTaskNotification,
  } = useAppData();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const audioUnlocked = useRef(false);
  const pendingAlarm = useRef(false);

  useEffect(() => {
    fetch("/api/session").then((response) => response.ok ? response.json() : null).then((data) => setEmail(data?.email || "")).catch(() => setEmail(""));
  }, []);

  useEffect(() => {
    const currentDate = today();
    projectTasks.forEach((task) => {
      if (task.status === "Done") return;
      const distance = dayDistance(currentDate, task.dueDate);
      if (!reminderOffsets.has(distance)) return;
      const logKey = `reminder-${currentDate}-${distance}`;
      if (task.notificationLog?.includes(logKey)) return;
      const assignee = teamMembers.find((member) => member.id === task.assigneeId);
      if (!assignee) return;
      const progressCopy = task.progressUpdates?.length
        ? "Task belum selesai. Cek progress terakhir dan update status bila sudah ada perkembangan."
        : "Task belum selesai dan belum ada progress update tertulis.";
      const notification: TaskNotification = {
        id: crypto.randomUUID(),
        taskId: task.id,
        recipientId: assignee.id,
        recipientEmail: assignee.email,
        kind: "reminder",
        title: `[${reminderLabel(distance)}] Reminder task: ${task.title}`,
        message: `${progressCopy}\n\nTask: ${task.title}\nProject: ${task.project}\nClient: ${task.client || "-"}\nDeadline: ${formatDate(task.dueDate)}`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      addTaskNotification(notification);
      updateProjectTask(task.id, { ...task, notificationLog: [...(task.notificationLog || []), logKey] });
      void fetch("/api/task-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: notification.recipientEmail, subject: notification.title, message: notification.message }),
      });
    });
  }, [addTaskNotification, projectTasks, teamMembers, updateProjectTask]);

  const myNotifications = useMemo<UnifiedNotification[]>(() => {
    if (!email) return [];
    const normalizedEmail = email.toLowerCase();
    return [
      ...taskNotifications
        .filter((notification) => notification.recipientEmail.toLowerCase() === normalizedEmail)
        .map((notification) => ({
          id: notification.id,
          source: "task" as const,
          kind: notification.kind,
          title: notification.title,
          message: notification.message,
          createdAt: notification.createdAt,
          read: notification.read,
          href: "/client-management",
        })),
      ...reimbursementNotifications
        .filter((notification) => notification.recipientEmail.toLowerCase() === normalizedEmail)
        .map((notification) => ({
          id: notification.id,
          source: "reimbursement" as const,
          kind: "reimbursement" as const,
          title: notification.title,
          message: notification.message,
          createdAt: notification.createdAt,
          read: notification.read,
          href: "/reimbursements",
        })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [email, reimbursementNotifications, taskNotifications]);

  const unreadNotifications = myNotifications.filter((notification) => !notification.read);
  const unreadCount = unreadNotifications.length;

  useEffect(() => {
    function unlockAudio() {
      audioUnlocked.current = true;
      if (pendingAlarm.current) {
        playNotificationAlarm();
        pendingAlarm.current = false;
      }
    }
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!email || !unreadNotifications.length) return;
    const storageKey = `gh-notification-sound-seen:${email.toLowerCase()}`;
    let seenIds: string[] = [];
    try {
      seenIds = JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      seenIds = [];
    }
    const seen = new Set(seenIds);
    const hasNewNotification = unreadNotifications.some((notification) => !seen.has(notification.id));
    localStorage.setItem(storageKey, JSON.stringify(myNotifications.slice(0, 100).map((notification) => notification.id)));
    if (!hasNewNotification) return;
    if (audioUnlocked.current) playNotificationAlarm();
    else pendingAlarm.current = true;
  }, [email, myNotifications, unreadNotifications]);

  function markAllRead() {
    unreadNotifications.forEach((notification) => {
      if (notification.source === "task") {
        const source = taskNotifications.find((item) => item.id === notification.id);
        if (source) updateTaskNotification(source.id, { ...source, read: true });
      } else {
        const source = reimbursementNotifications.find((item) => item.id === notification.id);
        if (source) updateReimbursementNotification(source.id, { ...source, read: true });
      }
    });
  }

  function toggleNotifications() {
    setNotificationsOpen((value) => !value);
    if (!notificationsOpen) markAllRead();
  }

  return <header className="mb-8 flex items-center justify-between gap-5">
    <div><h1 className="text-2xl font-black tracking-tight text-ink dark:text-white">{title}</h1><p className="mt-1 text-sm text-slate-400">{subtitle}</p></div>
    <div className="relative flex items-center gap-2">
      <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Ganti tema" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">{theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}</button>
      <button onClick={toggleNotifications} title="Semua notifikasi" className={cn("relative grid h-10 w-10 place-items-center rounded-xl border bg-white dark:bg-slate-900", unreadCount ? "border-rose-200 text-rose-600" : "border-slate-200 dark:border-slate-800")}>
        {unreadCount ? <BellRing size={17} className="animate-pulse" /> : <Bell size={17}/>}
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>
      {notificationsOpen && <div className="absolute right-0 top-12 z-40 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
          <div><p className="text-sm font-black">Semua Notifikasi</p><p className="mt-1 text-[11px] text-slate-400">Task, reminder, dan reimbursement</p></div>
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500 dark:bg-slate-800"><Volume2 size={11}/>Alarm aktif</span>
        </div>
        {!myNotifications.length ? <p className="p-4 text-xs leading-5 text-slate-400">Belum ada notifikasi untuk akun ini.</p> : <div className="max-h-96 overflow-auto">{myNotifications.map((notification) => {
          const Icon = notification.source === "task" ? BriefcaseBusiness : ReceiptText;
          return <Link href={notification.href} key={`${notification.source}-${notification.id}`} onClick={() => setNotificationsOpen(false)} className={cn("flex gap-3 border-b border-slate-100 p-4 transition last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60", !notification.read && "bg-teal-50/60 dark:bg-teal-950/20")}>
            <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", notification.kind === "reminder" ? "bg-amber-50 text-amber-700" : notification.source === "task" ? "bg-sky-50 text-sky-700" : "bg-teal-50 text-teal-700")}><Icon size={16}/></span>
            <span className="min-w-0 flex-1"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{notificationLabel(notification.kind)}</span><span className="mt-1 block text-xs font-black">{notification.title}</span><span className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-300">{notification.message}</span><span className="mt-2 block text-[10px] font-bold text-slate-400">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(notification.createdAt))}</span></span>
          </Link>;
        })}</div>}
      </div>}
    </div>
  </header>;
}
