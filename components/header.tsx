"use client";
import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function Header({ title, subtitle }: { title: string; subtitle: string }) {
  const { theme, setTheme } = useTheme();
  return <header className="mb-8 flex items-center justify-between gap-5">
    <div><h1 className="text-2xl font-black tracking-tight text-ink dark:text-white">{title}</h1><p className="mt-1 text-sm text-slate-400">{subtitle}</p></div>
    <div className="flex items-center gap-2"><div className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 dark:border-slate-800 dark:bg-slate-900 md:flex"><Search size={16}/><input className="w-44 bg-transparent text-sm outline-none" placeholder="Cari apa saja..."/></div><button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">{theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}</button><button className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><Bell size={17}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500"/></button><Menu className="lg:hidden"/></div>
  </header>;
}
