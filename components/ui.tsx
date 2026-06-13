import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900", className)} {...props} />;
}

export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" }) {
  return <button className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition hover:-translate-y-0.5", variant === "primary" && "bg-teal-600 text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700", variant === "outline" && "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200", variant === "ghost" && "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800", className)} {...props} />;
}

export function Badge({ children, tone = "teal" }: { children: ReactNode; tone?: "teal" | "amber" | "red" | "slate" }) {
  const tones = { teal: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300", amber: "bg-amber-50 text-amber-700", red: "bg-red-50 text-red-700", slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" };
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold", tones[tone])}>{children}</span>;
}
