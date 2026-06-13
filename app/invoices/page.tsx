"use client";

import { useAppData } from "@/components/app-data";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { fieldClass, Modal } from "@/components/modal";
import { Badge, Button, Card } from "@/components/ui";
import type { Invoice } from "@/lib/data";
import { rupiah } from "@/lib/utils";
import { CircleDollarSign, Clock3, FileText, Filter, Plus } from "lucide-react";
import { FormEvent, useState } from "react";

export default function InvoicesPage() {
  const { invoices, addInvoice } = useAppData();
  const [open, setOpen] = useState(false); const [status, setStatus] = useState("");
  const shown = invoices.filter(i => !status || i.status === status);
  const paid = invoices.filter(i => i.status === "Lunas").reduce((sum,i) => sum + i.amount, 0);
  const total = invoices.reduce((sum,i) => sum + i.amount, 0);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); addInvoice({ id: crypto.randomUUID(), no: String(data.get("no")), client: String(data.get("client")), date: String(data.get("date")), due: String(data.get("due")), amount: Number(data.get("amount")), status: String(data.get("status")) as Invoice["status"] }); setOpen(false); }
  return <><Header title="Invoice" subtitle="Buat, kirim, dan pantau pembayaran invoice."/><div className="mb-5 flex justify-end gap-2"><div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900"><Filter size={15}/><select value={status} onChange={e => setStatus(e.target.value)} className="bg-transparent text-sm outline-none"><option value="">Semua status</option>{["Draft","Terkirim","Lunas","Jatuh Tempo"].map(x => <option key={x}>{x}</option>)}</select></div><Button onClick={() => setOpen(true)}><Plus size={16}/>Buat Invoice</Button></div><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[{ l: "Total Invoice", v: rupiah(total), i: FileText }, { l: "Sudah Terbayar", v: rupiah(paid), i: CircleDollarSign }, { l: "Belum Terbayar", v: rupiah(total-paid), i: Clock3 }, { l: "Jatuh Tempo", v: `${invoices.filter(i=>i.status==="Jatuh Tempo").length} Invoice`, i: Clock3 }].map(({ l,v,i:Icon }) => <Card className="p-5" key={l}><div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon size={19}/></div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{l}</p><p className="mt-2 text-xl font-black text-ink dark:text-white">{v}</p></Card>)}</section><Card className="mt-5 overflow-hidden"><div className="p-5"><h2 className="font-black">Semua Invoice</h2></div>{!shown.length ? <EmptyState title="Belum ada invoice" description="Buat invoice pertama untuk mulai melacak tagihan dan pembayaran."/> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-400 dark:bg-slate-800"><tr>{["Nomor","Klien","Dibuat","Jatuh Tempo","Jumlah","Status"].map(x => <th className="p-4" key={x}>{x}</th>)}</tr></thead><tbody>{shown.map(i => <tr className="border-t border-slate-100 dark:border-slate-800" key={i.id}><td className="p-4 font-bold text-teal-700">{i.no}</td><td className="p-4 font-semibold">{i.client}</td><td className="p-4">{i.date}</td><td className="p-4">{i.due}</td><td className="p-4 font-bold">{rupiah(i.amount)}</td><td className="p-4"><Badge tone={i.status === "Lunas" ? "teal" : i.status === "Jatuh Tempo" ? "red" : "amber"}>{i.status}</Badge></td></tr>)}</tbody></table></div>}</Card>
  <Modal open={open} title="Buat Invoice" onClose={() => setOpen(false)}><form onSubmit={submit} className="grid gap-4 md:grid-cols-2">{[["Nomor invoice","no","text"],["Klien","client","text"],["Tanggal invoice","date","date"],["Jatuh tempo","due","date"],["Jumlah","amount","number"]].map(([label,name,type]) => <label key={name}><span className="mb-2 block text-xs font-bold">{label}</span><input name={name} type={type} required className={fieldClass}/></label>)}<label><span className="mb-2 block text-xs font-bold">Status</span><select name="status" className={fieldClass}>{["Draft","Terkirim","Lunas","Jatuh Tempo"].map(x => <option key={x}>{x}</option>)}</select></label><Button className="md:col-span-2">Simpan Invoice</Button></form></Modal></>;
}
