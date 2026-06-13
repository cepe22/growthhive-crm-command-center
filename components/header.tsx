"use client";
import { Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

export function Header({ title, subtitle }: { title: string; subtitle: string }) {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(false);
  return <header className="mb-8 flex items-center justify-between gap-5">
    <div><h1 className="text-2xl font-black tracking-tight text-ink dark:text-white">{title}</h1><p className="mt-1 text-sm text-slate-400">{subtitle}</p></div>
    <div className="relative flex items-center gap-2"><button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">{theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}</button><button onClick={() => setNotifications(!notifications)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><Bell size={17}/></button>{notifications && <div className="absolute right-0 top-12 z-40 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900"><p className="text-sm font-black">Notifikasi</p><p className="mt-3 text-xs leading-5 text-slate-400">Belum ada notifikasi. Pengingat invoice dan kontrak akan muncul di sini.</p></div>}</div>
  </header>;
}
