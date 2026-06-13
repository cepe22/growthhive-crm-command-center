"use client";

import { useAppData } from "@/components/app-data";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { Badge, Card } from "@/components/ui";
import { stages } from "@/lib/data";
import { rupiah } from "@/lib/utils";
import { BriefcaseBusiness, CircleDollarSign, Clock3, CreditCard } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { clients, invoices } = useAppData();
  const total = invoices.reduce((sum,i)=>sum+i.amount,0); const paid = invoices.filter(i=>i.status==="Lunas").reduce((sum,i)=>sum+i.amount,0);
  const stats = [{ label: "Klien Aktif", value: String(clients.filter(c=>c.stage==="Client (Active)").length), icon: BriefcaseBusiness }, { label: "Total Invoice", value: rupiah(total), icon: CreditCard }, { label: "Total Terbayar", value: rupiah(paid), icon: CircleDollarSign }, { label: "Belum Terbayar", value: rupiah(total-paid), icon: Clock3 }];
  return <><Header title="Selamat pagi, Christopher" subtitle="Berikut ringkasan bisnis GrowthHive hari ini."/><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon }) => <Card key={label} className="p-5"><div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon size={20}/></div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-xl font-black text-ink dark:text-white">{value}</p></Card>)}</section><section className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]"><Card className="p-5"><h2 className="font-black">Tren Pendapatan</h2><EmptyState title="Belum ada visualisasi pendapatan" description="Grafik bulanan akan tersedia setelah integrasi database dan pencatatan periode diaktifkan."/></Card><Card className="p-5"><div className="mb-5 flex justify-between"><div><h2 className="font-black">Ringkasan Pipeline</h2><p className="text-xs text-slate-400">Prospek berdasarkan tahap</p></div><Link href="/crm" className="text-xs font-bold text-teal-600">Lihat CRM</Link></div><div className="space-y-4">{stages.slice(0,5).map(stage => <div key={stage} className="flex justify-between text-xs"><span className="font-semibold">{stage}</span><Badge tone="slate">{clients.filter(c=>c.stage===stage).length}</Badge></div>)}</div></Card></section><Card className="mt-5 overflow-hidden"><div className="flex justify-between p-5"><div><h2 className="font-black">Invoice Terbaru</h2><p className="text-xs text-slate-400">Pantau status pembayaran klien</p></div><Link href="/invoices" className="text-xs font-bold text-teal-600">Lihat semua</Link></div>{!invoices.length ? <EmptyState title="Belum ada invoice" description="Invoice yang dibuat akan muncul di sini."/> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{invoices.slice(0,5).map(i=><div key={i.id} className="flex justify-between p-5 text-sm"><span className="font-bold">{i.client}</span><span>{rupiah(i.amount)}</span></div>)}</div>}</Card></>;
}
