"use client";
import { useAppData } from "@/components/app-data";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { Button, Card } from "@/components/ui";
import { rupiah } from "@/lib/utils";
import { Download } from "lucide-react";
export default function ReportsPage() {
  const { invoices, expenses } = useAppData(); const revenue = invoices.filter(i=>i.status==="Lunas").reduce((s,i)=>s+i.amount,0); const spending=expenses.reduce((s,e)=>s+e.amount,0);
  return <><Header title="Laporan Keuangan" subtitle="Analisis performa dan kesehatan finansial bisnis."/><div className="mb-5 flex justify-end"><Button variant="outline" onClick={() => window.print()}><Download size={15}/>Cetak / Ekspor PDF</Button></div><section className="grid gap-4 md:grid-cols-3">{[["Total Revenue",revenue],["Total Expenses",spending],["Net Profit",revenue-spending]].map(([l,v])=><Card className="p-5" key={String(l)}><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{l}</p><p className="mt-3 text-2xl font-black">{rupiah(Number(v))}</p></Card>)}</section><Card className="mt-5 p-6"><h2 className="font-black">Profit & Loss</h2>{!invoices.length && !expenses.length ? <EmptyState title="Belum ada data laporan" description="Data invoice lunas dan pengeluaran akan otomatis membentuk laporan ini."/> : <div className="mt-5 space-y-3"><div className="flex justify-between border-b py-3"><span>Pendapatan invoice</span><b>{rupiah(revenue)}</b></div><div className="flex justify-between border-b py-3"><span>Total pengeluaran</span><b className="text-rose-600">-{rupiah(spending)}</b></div><div className="flex justify-between rounded-xl bg-teal-50 p-4 font-black text-teal-800"><span>Laba Bersih</span><span>{rupiah(revenue-spending)}</span></div></div>}</Card></>;
}
