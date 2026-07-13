"use client";
import { BarChart3, BriefcaseBusiness, ChevronDown, CreditCard, KeyRound, LayoutDashboard, LogOut, ReceiptText, Settings, UsersRound, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { getUserAccess } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const adminLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crm", label: "CRM", icon: UsersRound },
  { href: "/clients", label: "Clients", icon: BriefcaseBusiness },
  { href: "/client-management", label: "Project Hub", icon: BriefcaseBusiness },
  { href: "/invoices", label: "Invoice", icon: CreditCard },
  { href: "/finance", label: "Keuangan", icon: WalletCards },
  { href: "/reports", label: "Laporan", icon: BarChart3 },
  { href: "/reimbursements", label: "Reimbursement", icon: ReceiptText },
];

const teamLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client-management", label: "Project Hub", icon: BriefcaseBusiness },
  { href: "/reimbursements", label: "Reimbursement", icon: ReceiptText },
];

export function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState("");
  useEffect(() => {
    fetch("/api/session").then((response) => response.ok ? response.json() : null).then((data) => setEmail(data?.email || "")).catch(() => setEmail(""));
  }, []);
  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  const access = getUserAccess(email);
  const links = access === "team" ? teamLinks : adminLinks;
  const displayName = email === "hi.growthive@gmail.com" ? "Gaby" : email === "margareth13105@gmail.com" ? "Xiu" : email ? email.split("@")[0].replace(/[._]/g, " ") : "GrowthHive Team";
  const initials = email === "hi.growthive@gmail.com" ? "GB" : email === "margareth13105@gmail.com" ? "XI" : email ? email.slice(0, 2).toUpperCase() : "GH";
  return <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-[#F8FBFA] p-5 dark:border-slate-800 dark:bg-slate-950 lg:flex">
    <div className="mb-8 flex items-center gap-3 px-2"><div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-600 text-xl font-black text-white">G</div><div><div className="font-black tracking-tight text-ink dark:text-white">GrowthHive</div><div className="text-[10px] font-bold uppercase tracking-[.22em] text-teal-600">Operating System</div></div></div>
    <nav className="space-y-1.5">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 transition", path === href ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20" : "hover:bg-white hover:text-teal-700 dark:hover:bg-slate-900")}><Icon size={18}/>{label}</Link>)}</nav>
    <div className="mt-auto space-y-2"><Link href="/account" className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 hover:bg-white dark:hover:bg-slate-900", path === "/account" && "bg-teal-600 text-white shadow-lg shadow-teal-600/20")}><KeyRound size={18}/>Akun</Link>{access === "admin" && <Link href="/settings" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 hover:bg-white dark:hover:bg-slate-900"><Settings size={18}/>Pengaturan</Link>}<button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 hover:bg-white dark:hover:bg-slate-900"><LogOut size={18}/>Keluar</button></div>
    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><div className="grid h-9 w-9 place-items-center rounded-full bg-ink text-xs font-bold text-white">{initials}</div><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold capitalize">{displayName}</div><div className="truncate text-[10px] text-slate-400">{email || "Team access"}</div></div><ChevronDown size={14}/></div>
  </aside>;
}
