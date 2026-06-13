"use client";

import { Header } from "@/components/header";
import { Kanban } from "@/components/kanban";
import { EmptyState } from "@/components/empty-state";
import { fieldClass, Modal } from "@/components/modal";
import { useAppData } from "@/components/app-data";
import { Badge, Button, Card } from "@/components/ui";
import { stages, type Client } from "@/lib/data";
import { rupiah } from "@/lib/utils";
import { Filter, List, Plus, Search, SlidersHorizontal } from "lucide-react";
import { FormEvent, useState } from "react";

export default function CRMPage() {
  const { clients, addClient, moveClient } = useAppData();
  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = clients.filter(c => (!query || `${c.brand} ${c.pic}`.toLowerCase().includes(query.toLowerCase())) && (!industry || c.industry === industry));
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    addClient({ id: crypto.randomUUID(), brand: String(data.get("brand")), pic: String(data.get("pic")), industry: String(data.get("industry")), service: String(data.get("service")), stage: String(data.get("stage")) as Client["stage"], value: Number(data.get("value")) || 0 });
    setOpen(false);
  }
  return <><Header title="CRM & Pipeline" subtitle="Kelola prospek dan hubungan dengan seluruh klien."/><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"><button onClick={() => setView("pipeline")} className={`rounded-lg px-4 py-2 text-xs font-bold ${view === "pipeline" ? "bg-teal-50 text-teal-700" : "text-slate-400"}`}><SlidersHorizontal className="mr-2 inline" size={14}/>Pipeline</button><button onClick={() => setView("list")} className={`rounded-lg px-4 py-2 text-xs font-bold ${view === "list" ? "bg-teal-50 text-teal-700" : "text-slate-400"}`}><List className="mr-2 inline" size={14}/>Daftar</button></div><div className="flex flex-wrap gap-2"><div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900"><Search size={15}/><input value={query} onChange={e => setQuery(e.target.value)} className="w-32 bg-transparent text-sm outline-none" placeholder="Cari klien"/></div><div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900"><Filter size={15}/><select value={industry} onChange={e => setIndustry(e.target.value)} className="bg-transparent text-sm outline-none"><option value="">Semua industri</option>{["FnB","Fitness & Wellness","Fashion","Beauty & Skincare","Other"].map(x => <option key={x}>{x}</option>)}</select></div><Button onClick={() => setOpen(true)}><Plus size={16}/>Tambah Klien</Button></div></div>
  {!clients.length ? <Card><EmptyState title="Belum ada klien" description="Tambahkan prospek atau klien pertama untuk mulai mengisi pipeline."/></Card> : view === "pipeline" ? <Kanban clients={filtered} onMove={moveClient}/> : <Card className="overflow-hidden"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-400 dark:bg-slate-800"><tr>{["Brand","PIC","Industri","Tahap","Retainer"].map(x => <th key={x} className="p-4">{x}</th>)}</tr></thead><tbody>{filtered.map(c => <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800"><td className="p-4 font-black">{c.brand}</td><td className="p-4">{c.pic}</td><td className="p-4">{c.industry}</td><td className="p-4"><Badge>{c.stage}</Badge></td><td className="p-4 font-bold">{rupiah(c.value)}</td></tr>)}</tbody></table></Card>}
  <Modal open={open} title="Tambah Klien" onClose={() => setOpen(false)}><form onSubmit={submit} className="grid gap-4 md:grid-cols-2">{[["Brand","brand"],["Nama PIC","pic"],["Layanan aktif","service"],["Retainer bulanan","value"]].map(([label,name]) => <label key={name}><span className="mb-2 block text-xs font-bold">{label}</span><input name={name} required={name !== "value"} type={name === "value" ? "number" : "text"} className={fieldClass}/></label>)}<label><span className="mb-2 block text-xs font-bold">Industri</span><select name="industry" className={fieldClass}>{["FnB","Fitness & Wellness","Fashion","Beauty & Skincare","Other"].map(x => <option key={x}>{x}</option>)}</select></label><label><span className="mb-2 block text-xs font-bold">Tahap</span><select name="stage" className={fieldClass}>{stages.map(x => <option key={x}>{x}</option>)}</select></label><Button className="md:col-span-2">Simpan Klien</Button></form></Modal></>;
}
