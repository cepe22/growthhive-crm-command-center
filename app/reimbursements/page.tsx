"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAppData } from "@/components/app-data";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { fieldClass, Modal } from "@/components/modal";
import { Badge, Button, Card } from "@/components/ui";
import { getUserAccess } from "@/lib/auth";
import { type Reimbursement, type ReimbursementStatus } from "@/lib/data";
import { rupiah } from "@/lib/utils";
import { CheckCircle2, Clock3, FileText, LinkIcon, Pencil, Plus, ReceiptText, WalletCards, XCircle } from "lucide-react";

const statuses: ReimbursementStatus[] = ["Diajukan", "Diproses", "Disetujui", "Ditolak", "Dibayar"];

const statusTone: Record<ReimbursementStatus, "teal" | "amber" | "red" | "slate"> = {
  Diajukan: "amber",
  Diproses: "slate",
  Disetujui: "teal",
  Ditolak: "red",
  Dibayar: "teal",
};

const categories = ["Transportasi", "Meals", "Produksi Konten", "Tools", "Meeting", "Operasional", "Lainnya"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function displayName(email: string) {
  return email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ReimbursementsPage() {
  const { reimbursements, addReimbursement, updateReimbursement, projectTasks } = useAppData();
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Reimbursement | null>(null);

  useEffect(() => {
    fetch("/api/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setEmail(data?.email || ""))
      .catch(() => setEmail(""));
  }, []);

  const access = getUserAccess(email);
  const isReadOnly = access === "readonly";
  const visibleReimbursements = access === "admin" || isReadOnly ? reimbursements : reimbursements.filter((item) => item.requesterEmail === email);
  const pendingTotal = visibleReimbursements.filter((item) => ["Diajukan", "Diproses", "Disetujui"].includes(item.status)).reduce((sum, item) => sum + item.amount, 0);
  const paidTotal = visibleReimbursements.filter((item) => item.status === "Dibayar").reduce((sum, item) => sum + item.amount, 0);
  const approvedCount = visibleReimbursements.filter((item) => item.status === "Disetujui").length;
  const projectOptions = useMemo(() => Array.from(new Set(projectTasks.map((task) => task.project).filter(Boolean))).sort(), [projectTasks]);
  const clientOptions = useMemo(() => Array.from(new Set(projectTasks.map((task) => task.client).filter(Boolean))).sort(), [projectTasks]);

  function closeModal() {
    setOpen(false);
    setEditing(null);
  }

  function submitReimbursement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isReadOnly) return;
    const data = new FormData(event.currentTarget);
    const request: Reimbursement = {
      id: editing?.id || crypto.randomUUID(),
      requesterEmail: editing?.requesterEmail || email,
      requesterName: editing?.requesterName || displayName(email),
      date: String(data.get("date")),
      category: String(data.get("category")),
      project: String(data.get("project") || ""),
      client: String(data.get("client") || ""),
      amount: Number(data.get("amount") || 0),
      description: String(data.get("description")),
      receiptLink: String(data.get("receiptLink") || ""),
      status: access === "admin" ? (String(data.get("status")) as ReimbursementStatus) : editing?.status || "Diajukan",
      submittedAt: editing?.submittedAt || new Date().toISOString(),
      notes: access === "admin" ? String(data.get("notes") || "") : editing?.notes,
    };
    if (editing) updateReimbursement(editing.id, request);
    else addReimbursement(request);
    closeModal();
  }

  function updateStatus(item: Reimbursement, status: ReimbursementStatus) {
    if (isReadOnly) return;
    updateReimbursement(item.id, { ...item, status });
  }

  return (
    <>
      <Header title="Reimbursement" subtitle="Ajukan penggantian biaya operasional dan pantau status approval." />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Request", value: String(visibleReimbursements.length), icon: ReceiptText },
          { label: "Menunggu / Proses", value: rupiah(pendingTotal), icon: Clock3 },
          { label: "Disetujui", value: String(approvedCount), icon: CheckCircle2 },
          { label: "Sudah Dibayar", value: rupiah(paidTotal), icon: WalletCards },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon size={20} /></div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-2 text-xl font-black text-ink dark:text-white">{value}</p>
          </Card>
        ))}
      </section>

      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="font-black">Daftar Reimbursement</h2>
            <p className="text-xs text-slate-400">{access === "admin" || isReadOnly ? "Semua pengajuan tim" : "Pengajuan operasional kamu"}</p>
          </div>
          {!isReadOnly && <Button onClick={() => setOpen(true)}><Plus size={16} />Ajukan</Button>}
        </div>
        {!visibleReimbursements.length ? (
          <EmptyState title="Belum ada reimbursement" description="Ajukan biaya operasional pertama dari tombol Ajukan." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[.12em] text-slate-400 dark:bg-slate-950">
                <tr>{["Tanggal", "Requester", "Kategori", "Project / Client", "Deskripsi", "Nominal", "Bukti", "Status", ...(!isReadOnly ? ["Aksi"] : [])].map((item) => <th key={item} className="p-4">{item}</th>)}</tr>
              </thead>
              <tbody>
                {visibleReimbursements.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-4 font-bold">{formatDate(item.date)}</td>
                    <td className="p-4">{item.requesterName}</td>
                    <td className="p-4"><Badge tone="slate">{item.category}</Badge></td>
                    <td className="p-4 text-xs text-slate-500">{[item.project, item.client].filter(Boolean).join(" / ") || "-"}</td>
                    <td className="max-w-xs p-4"><p className="line-clamp-2 text-xs leading-5 text-slate-500">{item.description}</p></td>
                    <td className="p-4 font-black">{rupiah(item.amount)}</td>
                    <td className="p-4">{item.receiptLink ? <a href={item.receiptLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-black text-teal-600"><LinkIcon size={13} />Buka</a> : "-"}</td>
                    <td className="p-4"><Badge tone={statusTone[item.status]}>{item.status}</Badge></td>
                    {!isReadOnly && <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => { setEditing(item); setOpen(true); }} title="Edit reimbursement" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><Pencil size={14} /></button>
                        {access === "admin" && item.status !== "Dibayar" && <button onClick={() => updateStatus(item, "Dibayar")} title="Tandai dibayar" className="grid h-9 w-9 place-items-center rounded-lg border border-teal-200 text-teal-600 hover:bg-teal-50"><CheckCircle2 size={14} /></button>}
                        {access === "admin" && item.status !== "Ditolak" && <button onClick={() => updateStatus(item, "Ditolak")} title="Tolak" className="grid h-9 w-9 place-items-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50"><XCircle size={14} /></button>}
                      </div>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} title={editing ? "Edit Reimbursement" : "Ajukan Reimbursement"} onClose={closeModal}>
        <form onSubmit={submitReimbursement} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs font-bold">Tanggal biaya</span>
              <input name="date" type="date" required defaultValue={editing?.date || today()} className={fieldClass} />
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold">Kategori</span>
              <select name="category" defaultValue={editing?.category || "Operasional"} className={fieldClass}>{categories.map((category) => <option key={category}>{category}</option>)}</select>
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs font-bold">Project</span>
              <input name="project" list="reimbursement-projects" defaultValue={editing?.project || ""} className={fieldClass} placeholder="Opsional" />
              <datalist id="reimbursement-projects">{projectOptions.map((project) => <option key={project} value={project} />)}</datalist>
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold">Client</span>
              <input name="client" list="reimbursement-clients" defaultValue={editing?.client || ""} className={fieldClass} placeholder="Opsional" />
              <datalist id="reimbursement-clients">{clientOptions.map((client) => <option key={client} value={client} />)}</datalist>
            </label>
          </div>
          <label>
            <span className="mb-2 block text-xs font-bold">Nominal</span>
            <input name="amount" type="number" min="0" required defaultValue={editing?.amount || ""} className={fieldClass} placeholder="Contoh: 150000" />
          </label>
          <textarea name="description" required rows={4} defaultValue={editing?.description || ""} className={`${fieldClass} h-auto py-3`} placeholder="Jelaskan kebutuhan operasionalnya" />
          <label>
            <span className="mb-2 block text-xs font-bold">Link bukti</span>
            <input name="receiptLink" defaultValue={editing?.receiptLink || ""} className={fieldClass} placeholder="Google Drive / link receipt, opsional" />
          </label>
          {access === "admin" && (
            <div className="grid gap-3 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-xs font-bold">Status</span>
                <select name="status" defaultValue={editing?.status || "Diajukan"} className={fieldClass}>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold">Catatan admin</span>
                <input name="notes" defaultValue={editing?.notes || ""} className={fieldClass} placeholder="Opsional" />
              </label>
            </div>
          )}
          {editing?.notes && access !== "admin" && <div className="rounded-lg bg-slate-50 p-3 text-xs font-bold text-slate-500">Catatan admin: {editing.notes}</div>}
          <Button className="w-full"><FileText size={16} />Simpan Reimbursement</Button>
        </form>
      </Modal>
    </>
  );
}
