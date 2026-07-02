"use client";

import { useAppData } from "@/components/app-data";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { Badge, Card } from "@/components/ui";
import { stages } from "@/lib/data";
import { rupiah } from "@/lib/utils";
import { BriefcaseBusiness, CalendarCheck2, CircleDollarSign, Clock3, CreditCard } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { clients, projectTasks, dailyWorkPlans, calendarEvents, invoices } = useAppData();
  const total = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paid = invoices.filter((invoice) => invoice.status === "Lunas").reduce((sum, invoice) => sum + invoice.amount, 0);
  const openPipeline = clients.filter((client) => !["Client (Active)", "Post-Client"].includes(client.stage)).reduce((sum, client) => sum + client.value, 0);
  const activeProjects = projectTasks.filter((task) => task.status !== "Done").length;
  const today = new Date().toISOString().slice(0, 10);
  const todayPlans = dailyWorkPlans.filter((plan) => plan.date === today).length;
  const acceptedEvents = calendarEvents.filter((event) => Object.values(event.responses).some((response) => response === "Accepted")).length;
  const stats = [
    { label: "Task Aktif", value: String(activeProjects), icon: BriefcaseBusiness },
    { label: "Work Plan Hari Ini", value: String(todayPlans), icon: CalendarCheck2 },
    { label: "CRM Pipeline", value: rupiah(openPipeline), icon: CreditCard },
    { label: "Event Disetujui", value: String(acceptedEvents), icon: CircleDollarSign },
    { label: "Belum Terbayar", value: rupiah(total - paid), icon: Clock3 },
  ];
  return <><Header title="Selamat pagi, Christopher" subtitle="Berikut ringkasan bisnis GrowthHive hari ini."/><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{stats.map(({ label, value, icon: Icon }) => <Card key={label} className="p-5"><div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon size={20}/></div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-xl font-black text-ink dark:text-white">{value}</p></Card>)}</section><section className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]"><Card className="p-5"><h2 className="font-black">Tren Pendapatan</h2><EmptyState title="Belum ada visualisasi pendapatan" description="Grafik bulanan akan tersedia setelah integrasi database dan pencatatan periode diaktifkan."/></Card><Card className="p-5"><div className="mb-5 flex justify-between"><div><h2 className="font-black">Ringkasan Pipeline</h2><p className="text-xs text-slate-400">Prospek berdasarkan tahap CRM</p></div><Link href="/crm" className="text-xs font-bold text-teal-600">Lihat CRM</Link></div><div className="space-y-4">{stages.map(stage => <div key={stage} className="flex justify-between text-xs"><span className="font-semibold">{stage}</span><Badge tone="slate">{clients.filter(c=>c.stage===stage).length}</Badge></div>)}</div></Card></section><Card className="mt-5 overflow-hidden"><div className="flex justify-between p-5"><div><h2 className="font-black">Project Hub</h2><p className="text-xs text-slate-400">Task, timeline, work plan, dan event kerja tim</p></div><Link href="/client-management" className="text-xs font-bold text-teal-600">Buka hub</Link></div>{!projectTasks.length ? <EmptyState title="Belum ada task proyek" description="Task baru dari Project Hub akan muncul di sini."/> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{projectTasks.slice(0,5).map(task=><div key={task.id} className="flex justify-between gap-4 p-5 text-sm"><span className="font-bold">{task.title}</span><span className="text-right text-xs text-slate-500">{task.project} · {task.dueDate}</span></div>)}</div>}</Card></>;
}
