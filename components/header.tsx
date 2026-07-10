"use client";
import { useAppData } from "@/components/app-data";
import { cn } from "@/lib/utils";
import { Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Header({ title, subtitle }: { title: string; subtitle: string }) {
  const { theme, setTheme } = useTheme();
  const { reimbursementNotifications, updateReimbursementNotification } = useAppData();
  const [notifications, setNotifications] = useState(false);
  const [email, setEmail] = useState("");
  useEffect(() => {
    fetch("/api/session").then((response) => response.ok ? response.json() : null).then((data) => setEmail(data?.email || "")).catch(() => setEmail(""));
  }, []);
  const myNotifications = reimbursementNotifications.filter((notification) => notification.recipientEmail.toLowerCase() === email.toLowerCase());
  const unreadCount = myNotifications.filter((notification) => !notification.read).length;
  function openNotifications() {
    setNotifications((value) => !value);
    myNotifications.filter((notification) => !notification.read).forEach((notification) => {
      updateReimbursementNotification(notification.id, { ...notification, read: true });
    });
  }
  return <header className="mb-8 flex items-center justify-between gap-5">
    <div><h1 className="text-2xl font-black tracking-tight text-ink dark:text-white">{title}</h1><p className="mt-1 text-sm text-slate-400">{subtitle}</p></div>
    <div className="relative flex items-center gap-2">
      <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Ganti tema" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">{theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}</button>
      <button onClick={openNotifications} title="Notifikasi" className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><Bell size={17}/>{unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">{unreadCount}</span>}</button>
      {notifications && <div className="absolute right-0 top-12 z-40 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800"><p className="text-sm font-black">Notifikasi</p><p className="mt-1 text-[11px] text-slate-400">Update reimbursement untuk akun ini</p></div>
        {!myNotifications.length ? <p className="p-4 text-xs leading-5 text-slate-400">Belum ada notifikasi reimbursement.</p> : <div className="max-h-80 overflow-auto">{myNotifications.slice(0, 10).map((notification) => <div key={notification.id} className={cn("border-b border-slate-100 p-4 last:border-0 dark:border-slate-800", !notification.read && "bg-teal-50/60 dark:bg-teal-950/20")}><p className="text-xs font-black">{notification.title}</p><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">{notification.message}</p><p className="mt-2 text-[10px] font-bold text-slate-400">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(notification.createdAt))}</p></div>)}</div>}
      </div>}
    </div>
  </header>;
}
