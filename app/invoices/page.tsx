"use client";

import { useAppData } from "@/components/app-data";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { fieldClass, Modal } from "@/components/modal";
import { Badge, Button, Card } from "@/components/ui";
import type { Invoice } from "@/lib/data";
import { generateInvoiceNumber } from "@/lib/invoice-number";
import { rupiah } from "@/lib/utils";
import { CircleDollarSign, Clock3, FileText, Filter, Pencil, Plus, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { FormEvent, useState } from "react";

const InvoiceDownloadButton = dynamic(() => import("@/components/invoice-download-button"), { ssr: false });
const today = () => new Date().toISOString().slice(0, 10);

export default function InvoicesPage() {
  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useAppData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [status, setStatus] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today());
  const shown = invoices.filter((invoice) => !status || invoice.status === status);
  const paid = invoices.filter((invoice) => invoice.status === "Lunas").reduce((sum, invoice) => sum + invoice.amount, 0);
  const total = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const nextNumber = editing?.no || generateInvoiceNumber(invoices, invoiceDate);

  function openCreateModal() {
    setEditing(null);
    setInvoiceDate(today());
    setOpen(true);
  }

  function openEditModal(invoice: Invoice) {
    setEditing(invoice);
    setInvoiceDate(invoice.date);
    setOpen(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const invoice: Invoice = {
      id: editing?.id || crypto.randomUUID(),
      no: nextNumber,
      client: String(data.get("client")),
      date: invoiceDate,
      due: String(data.get("due")),
      amount: Number(data.get("amount")),
      description: String(data.get("description")),
      discount: Number(data.get("discount")) || 0,
      taxRate: Number(data.get("taxRate")) || 0,
      status: String(data.get("status")) as Invoice["status"],
    };
    if (editing) updateInvoice(editing.id, invoice);
    else addInvoice(invoice);
    setOpen(false);
    setEditing(null);
  }

  function removeInvoice(invoice: Invoice) {
    if (!window.confirm(`Hapus invoice ${invoice.no}?`)) return;
    deleteInvoice(invoice.id);
  }

  return (
    <>
      <Header title="Invoice" subtitle="Buat, unduh PDF, dan pantau pembayaran invoice." />
      <div className="mb-5 flex justify-end gap-2">
        <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900">
          <Filter size={15} />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="bg-transparent text-sm outline-none">
            <option value="">Semua status</option>
            {["Draft", "Terkirim", "Lunas", "Jatuh Tempo"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <Button onClick={openCreateModal}><Plus size={16} />Buat Invoice</Button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Invoice", value: rupiah(total), icon: FileText },
          { label: "Sudah Terbayar", value: rupiah(paid), icon: CircleDollarSign },
          { label: "Belum Terbayar", value: rupiah(total - paid), icon: Clock3 },
          { label: "Jatuh Tempo", value: `${invoices.filter((invoice) => invoice.status === "Jatuh Tempo").length} Invoice`, icon: Clock3 },
        ].map(({ label, value, icon: Icon }) => <Card className="p-5" key={label}><div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon size={19} /></div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-xl font-black text-ink dark:text-white">{value}</p></Card>)}
      </section>

      <Card className="mt-5 overflow-hidden">
        <div className="p-5"><h2 className="font-black">Semua Invoice</h2></div>
        {!shown.length ? <EmptyState title="Belum ada invoice" description="Buat invoice pertama untuk mulai melacak tagihan dan menghasilkan PDF." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-400 dark:bg-slate-800"><tr>{["Nomor", "Klien", "Dibuat", "Jatuh Tempo", "Jumlah", "Status", "Dokumen", "Admin"].map((item) => <th className="p-4" key={item}>{item}</th>)}</tr></thead>
              <tbody>{shown.map((invoice) => <tr className="border-t border-slate-100 dark:border-slate-800" key={invoice.id}><td className="p-4 font-bold text-teal-700">{invoice.no}</td><td className="p-4 font-semibold">{invoice.client}</td><td className="p-4">{invoice.date}</td><td className="p-4">{invoice.due}</td><td className="p-4 font-bold">{rupiah(invoice.amount)}</td><td className="p-4"><Badge tone={invoice.status === "Lunas" ? "teal" : invoice.status === "Jatuh Tempo" ? "red" : "amber"}>{invoice.status}</Badge></td><td className="p-4"><InvoiceDownloadButton invoice={invoice} /></td><td className="p-4"><div className="flex gap-1"><button onClick={() => openEditModal(invoice)} title="Edit invoice" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-teal-700 dark:border-slate-700 dark:hover:bg-slate-800"><Pencil size={14} /></button><button onClick={() => removeInvoice(invoice)} title="Hapus invoice" className="grid h-9 w-9 place-items-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950"><Trash2 size={14} /></button></div></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} title={editing ? `Edit Invoice ${editing.no}` : "Buat Invoice"} onClose={() => { setOpen(false); setEditing(null); }}>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <label><span className="mb-2 block text-xs font-bold">Nomor invoice otomatis</span><input value={nextNumber} readOnly className={`${fieldClass} bg-slate-50 font-bold text-teal-700 dark:bg-slate-800`} /></label>
          <label><span className="mb-2 block text-xs font-bold">Klien</span><input name="client" required defaultValue={editing?.client || ""} className={fieldClass} /></label>
          <label><span className="mb-2 block text-xs font-bold">Tanggal invoice</span><input name="date" type="date" required value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} className={fieldClass} /></label>
          <label><span className="mb-2 block text-xs font-bold">Jatuh tempo</span><input name="due" type="date" required defaultValue={editing?.due || ""} className={fieldClass} /></label>
          <label className="md:col-span-2"><span className="mb-2 block text-xs font-bold">Deskripsi pekerjaan</span><textarea name="description" required rows={3} defaultValue={editing?.description || ""} className={`${fieldClass} h-auto py-3`} placeholder="Contoh: Marketing Consulting Juni 2026, untuk cabang BTC" /></label>
          <label><span className="mb-2 block text-xs font-bold">Subtotal</span><input name="amount" type="number" required min="0" defaultValue={editing?.amount || ""} className={fieldClass} /></label>
          <label><span className="mb-2 block text-xs font-bold">Diskon</span><input name="discount" type="number" min="0" defaultValue={editing?.discount || 0} className={fieldClass} /></label>
          <label><span className="mb-2 block text-xs font-bold">Tax rate (%)</span><input name="taxRate" type="number" min="0" step="0.01" defaultValue={editing?.taxRate || 0} className={fieldClass} /></label>
          <label><span className="mb-2 block text-xs font-bold">Status</span><select name="status" defaultValue={editing?.status || "Draft"} className={fieldClass}>{["Draft", "Terkirim", "Lunas", "Jatuh Tempo"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <Button className="md:col-span-2">{editing ? "Update Invoice" : "Simpan & Siapkan PDF"}</Button>
        </form>
      </Modal>
    </>
  );
}
