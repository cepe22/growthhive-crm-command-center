import { Header } from "@/components/header";
import { Kanban } from "@/components/kanban";
import { Button } from "@/components/ui";
import { Filter, List, Plus, Search, SlidersHorizontal } from "lucide-react";

export default function CRMPage() {
  return <><Header title="CRM & Pipeline" subtitle="Kelola prospek dan hubungan dengan seluruh klien."/><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"><button className="rounded-lg bg-teal-50 px-4 py-2 text-xs font-bold text-teal-700"><SlidersHorizontal className="mr-2 inline" size={14}/>Pipeline</button><button className="px-4 py-2 text-xs font-bold text-slate-400"><List className="mr-2 inline" size={14}/>Daftar</button></div><div className="flex gap-2"><Button variant="outline"><Search size={15}/>Cari</Button><Button variant="outline"><Filter size={15}/>Filter</Button><Button><Plus size={16}/>Tambah Klien</Button></div></div><Kanban/></>;
}
