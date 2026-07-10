"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAppData } from "@/components/app-data";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { fieldClass, Modal } from "@/components/modal";
import { Badge, Button, Card } from "@/components/ui";
import { getUserAccess } from "@/lib/auth";
import {
  getReimbursementAmount,
  getReimbursementItems,
  type Reimbursement,
  type ReimbursementItem,
  type ReimbursementStatus,
} from "@/lib/data";
import { rupiah } from "@/lib/utils";
import { CheckCircle2, Clock3, FileText, ImageIcon, Pencil, Plus, ReceiptText, Trash2, WalletCards, XCircle } from "lucide-react";

const ownerEmail = "growthiveofficial@gmail.com";
const statuses: ReimbursementStatus[] = ["Diajukan", "Diproses", "Disetujui", "Ditolak", "Dibayar"];
const categories = ["Transportasi", "Meals", "Produksi Konten", "Tools", "Meeting", "Operasional", "Lainnya"];

const statusTone: Record<ReimbursementStatus, "teal" | "amber" | "red" | "slate"> = {
  Diajukan: "amber",
  Diproses: "slate",
  Disetujui: "teal",
  Ditolak: "red",
  Dibayar: "teal",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function newItem(): ReimbursementItem {
  return {
    id: crypto.randomUUID(),
    date: today(),
    category: "Operasional",
    project: "",
    client: "",
    amount: 0,
    description: "",
  };
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function displayName(email: string) {
  return email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function uniqueSummary(values: string[]) {
  const unique = Array.from(new Set(values.filter(Boolean)));
  if (!unique.length) return "-";
  if (unique.length <= 2) return unique.join(", ");
  return `${unique.slice(0, 2).join(", ")} +${unique.length - 2}`;
}

async function compressReceiptImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Bukti harus berupa file gambar.");
  const source = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Foto bukti tidak dapat dibaca."));
    };
    image.src = url;
  });
  const maxSize = 1200;
  const scale = Math.min(1, maxSize / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Foto bukti tidak dapat diproses.");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export default function ReimbursementsPage() {
  const {
    reimbursements,
    addReimbursement,
    updateReimbursement,
    deleteReimbursement,
    addReimbursementNotification,
    projectTasks,
  } = useAppData();
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Reimbursement | null>(null);
  const [draftItems, setDraftItems] = useState<ReimbursementItem[]>([newItem()]);
  const [preview, setPreview] = useState<Reimbursement | null>(null);
  const [receiptError, setReceiptError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setEmail(data?.email || ""))
      .catch(() => setEmail(""));
  }, []);

  const access = getUserAccess(email);
  const isReadOnly = access === "readonly";
  const visibleReimbursements = access === "admin" || isReadOnly ? reimbursements : reimbursements.filter((item) => item.requesterEmail === email);
  const pendingTotal = visibleReimbursements.filter((item) => ["Diajukan", "Diproses", "Disetujui"].includes(item.status)).reduce((sum, item) => sum + getReimbursementAmount(item), 0);
  const paidTotal = visibleReimbursements.filter((item) => item.status === "Dibayar").reduce((sum, item) => sum + getReimbursementAmount(item), 0);
  const approvedCount = visibleReimbursements.filter((item) => item.status === "Disetujui").length;
  const projectOptions = useMemo(() => Array.from(new Set(projectTasks.map((task) => task.project).filter(Boolean))).sort(), [projectTasks]);
  const clientOptions = useMemo(() => Array.from(new Set(projectTasks.map((task) => task.client).filter(Boolean))).sort(), [projectTasks]);

  function openNewRequest() {
    setEditing(null);
    setDraftItems([newItem()]);
    setReceiptError("");
    setOpen(true);
  }

  function openEditRequest(reimbursement: Reimbursement) {
    setEditing(reimbursement);
    setDraftItems(getReimbursementItems(reimbursement).map((item) => ({ ...item })));
    setReceiptError("");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditing(null);
    setDraftItems([newItem()]);
    setReceiptError("");
  }

  function addDraftItem() {
    setDraftItems((items) => [...items, newItem()]);
  }

  function removeDraftItem(id: string) {
    setDraftItems((items) => items.length === 1 ? items : items.filter((item) => item.id !== id));
  }

  async function submitReimbursement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isReadOnly || submitting) return;
    setSubmitting(true);
    setReceiptError("");
    const data = new FormData(event.currentTarget);
    try {
      const items: ReimbursementItem[] = [];
      for (let index = 0; index < draftItems.length; index += 1) {
        const draft = draftItems[index];
        const receipt = data.get(`receiptImage-${index}`);
        let receiptImage = draft.receiptImage || "";
        let receiptFileName = draft.receiptFileName || "";
        if (receipt instanceof File && receipt.size > 0) {
          receiptImage = await compressReceiptImage(receipt);
          receiptFileName = receipt.name;
        }
        if (!receiptImage) throw new Error(`Foto bukti untuk item ${index + 1} wajib diupload.`);
        items.push({
          id: draft.id,
          date: String(data.get(`date-${index}`)),
          category: String(data.get(`category-${index}`)),
          project: String(data.get(`project-${index}`) || ""),
          client: String(data.get(`client-${index}`) || ""),
          amount: Number(data.get(`amount-${index}`) || 0),
          description: String(data.get(`description-${index}`)),
          receiptImage,
          receiptFileName,
        });
      }
      const firstItem = items[0];
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
      const request: Reimbursement = {
        id: editing?.id || crypto.randomUUID(),
        requesterEmail: editing?.requesterEmail || email,
        requesterName: editing?.requesterName || displayName(email),
        date: firstItem.date,
        category: items.length > 1 ? `${items.length} item` : firstItem.category,
        project: firstItem.project,
        client: firstItem.client,
        amount: totalAmount,
        description: items.length > 1 ? `${items.length} reimbursement dalam satu pengajuan` : firstItem.description,
        receiptImage: firstItem.receiptImage,
        receiptFileName: firstItem.receiptFileName,
        items,
        status: access === "admin" ? (String(data.get("status")) as ReimbursementStatus) : editing?.status || "Diajukan",
        submittedAt: editing?.submittedAt || new Date().toISOString(),
        notes: access === "admin" ? String(data.get("notes") || "") : editing?.notes,
      };
      if (editing) {
        updateReimbursement(editing.id, request);
        if (request.status === "Dibayar" && editing.status !== "Dibayar") notifyRequesterPaid(request);
      } else {
        addReimbursement(request);
        addReimbursementNotification({
          id: crypto.randomUUID(),
          reimbursementId: request.id,
          recipientEmail: ownerEmail,
          title: "Pengajuan reimbursement baru",
          message: `${request.requesterName} mengajukan ${items.length} item dengan total ${rupiah(totalAmount)}.`,
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
      closeModal();
    } catch (error) {
      setReceiptError(error instanceof Error ? error.message : "Pengajuan tidak dapat diproses.");
    } finally {
      setSubmitting(false);
    }
  }

  function notifyRequesterPaid(item: Reimbursement) {
    addReimbursementNotification({
      id: crypto.randomUUID(),
      reimbursementId: item.id,
      recipientEmail: item.requesterEmail,
      title: "Reimbursement sudah dibayar",
      message: `Pengajuan ${getReimbursementItems(item).length} item senilai ${rupiah(getReimbursementAmount(item))} telah dibayarkan oleh Chris.`,
      createdAt: new Date().toISOString(),
      read: false,
    });
  }

  function updateStatus(item: Reimbursement, status: ReimbursementStatus) {
    if (access !== "admin") return;
    updateReimbursement(item.id, { ...item, status });
    if (status === "Dibayar" && item.status !== "Dibayar") notifyRequesterPaid({ ...item, status });
  }

  function removeReimbursement(item: Reimbursement) {
    if (access !== "admin") return;
    if (!window.confirm(`Hapus pengajuan reimbursement ${item.requesterName} senilai ${rupiah(getReimbursementAmount(item))}?`)) return;
    deleteReimbursement(item.id);
  }

  return (
    <>
      <Header title="Reimbursement" subtitle="Ajukan beberapa biaya sekaligus dan pantau status approval." />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Pengajuan", value: String(visibleReimbursements.length), icon: ReceiptText },
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
          {!isReadOnly && <Button onClick={openNewRequest}><Plus size={16} />Ajukan</Button>}
        </div>
        {!visibleReimbursements.length ? (
          <EmptyState title="Belum ada reimbursement" description="Buat pengajuan operasional pertama dari tombol Ajukan." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[.12em] text-slate-400 dark:bg-slate-950">
                <tr>{["Tanggal", "Requester", "Isi Pengajuan", "Project / Client", "Deskripsi", "Total", "Bukti", "Status", ...(!isReadOnly ? ["Aksi"] : [])].map((item) => <th key={item} className="p-4">{item}</th>)}</tr>
              </thead>
              <tbody>
                {visibleReimbursements.map((request) => {
                  const items = getReimbursementItems(request);
                  const imageCount = items.filter((item) => item.receiptImage).length;
                  return <tr key={request.id} className="border-t border-slate-100 align-top dark:border-slate-800">
                    <td className="p-4 font-bold">{formatDate(items[0]?.date || request.date)}</td>
                    <td className="p-4">{request.requesterName}</td>
                    <td className="p-4"><Badge tone="slate">{items.length} item</Badge><p className="mt-2 max-w-40 text-xs text-slate-400">{uniqueSummary(items.map((item) => item.category))}</p></td>
                    <td className="p-4 text-xs text-slate-500">{uniqueSummary(items.flatMap((item) => [item.project || "", item.client || ""]))}</td>
                    <td className="max-w-xs p-4"><p className="line-clamp-3 text-xs leading-5 text-slate-500">{items.map((item) => item.description).join(" · ")}</p></td>
                    <td className="p-4 font-black">{rupiah(getReimbursementAmount(request))}</td>
                    <td className="p-4">{imageCount ? <button onClick={() => setPreview(request)} className="inline-flex items-center gap-1 text-xs font-black text-teal-600"><ImageIcon size={13} />{imageCount} foto</button> : "-"}</td>
                    <td className="p-4"><Badge tone={statusTone[request.status]}>{request.status}</Badge></td>
                    {!isReadOnly && <td className="p-4"><div className="flex flex-wrap gap-1">
                      <button onClick={() => openEditRequest(request)} title="Edit reimbursement" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><Pencil size={14} /></button>
                      {access === "admin" && request.status !== "Dibayar" && <button onClick={() => updateStatus(request, "Dibayar")} title="Tandai dibayar" className="grid h-9 w-9 place-items-center rounded-lg border border-teal-200 text-teal-600 hover:bg-teal-50"><CheckCircle2 size={14} /></button>}
                      {access === "admin" && request.status !== "Ditolak" && <button onClick={() => updateStatus(request, "Ditolak")} title="Tolak" className="grid h-9 w-9 place-items-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50"><XCircle size={14} /></button>}
                      {access === "admin" && <button onClick={() => removeReimbursement(request)} title="Hapus reimbursement" className="grid h-9 w-9 place-items-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50"><Trash2 size={14} /></button>}
                    </div></td>}
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} title={editing ? "Edit Pengajuan Reimbursement" : "Ajukan Reimbursement"} onClose={closeModal}>
        <form onSubmit={submitReimbursement} className="space-y-4">
          <div className="rounded-lg bg-teal-50 p-3 text-xs font-bold leading-5 text-teal-800">Tambahkan semua biaya yang ingin diajukan dalam satu kali apply. Setiap item memiliki nominal dan foto bukti sendiri.</div>
          {draftItems.map((draft, index) => <div key={draft.id} className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center justify-between gap-3"><p className="text-sm font-black">Item {index + 1}</p>{draftItems.length > 1 && <button type="button" onClick={() => removeDraftItem(draft.id)} title="Hapus item" className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 text-rose-500"><Trash2 size={14} /></button>}</div>
            <div className="grid gap-3 md:grid-cols-2">
              <label><span className="mb-2 block text-xs font-bold">Tanggal biaya</span><input name={`date-${index}`} type="date" required defaultValue={draft.date || today()} className={fieldClass} /></label>
              <label><span className="mb-2 block text-xs font-bold">Kategori</span><select name={`category-${index}`} defaultValue={draft.category || "Operasional"} className={fieldClass}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label><span className="mb-2 block text-xs font-bold">Project</span><input name={`project-${index}`} list="reimbursement-projects" defaultValue={draft.project || ""} className={fieldClass} placeholder="Opsional" /></label>
              <label><span className="mb-2 block text-xs font-bold">Client</span><input name={`client-${index}`} list="reimbursement-clients" defaultValue={draft.client || ""} className={fieldClass} placeholder="Opsional" /></label>
            </div>
            <label><span className="mb-2 block text-xs font-bold">Nominal</span><input name={`amount-${index}`} type="number" min="1" required defaultValue={draft.amount || ""} className={fieldClass} placeholder="Contoh: 150000" /></label>
            <label><span className="mb-2 block text-xs font-bold">Keterangan</span><textarea name={`description-${index}`} required rows={3} defaultValue={draft.description || ""} className={`${fieldClass} h-auto py-3`} placeholder="Jelaskan kebutuhan operasionalnya" /></label>
            <label><span className="mb-2 block text-xs font-bold">Foto bukti</span><input name={`receiptImage-${index}`} type="file" accept="image/*" required={!draft.receiptImage} className={`${fieldClass} cursor-pointer py-2`} /></label>
            {draft.receiptImage && <button type="button" onClick={() => setPreview({ ...(editing as Reimbursement), items: [draft] })} className="inline-flex items-center gap-2 text-xs font-black text-teal-600"><ImageIcon size={14} />Lihat foto tersimpan{draft.receiptFileName ? `: ${draft.receiptFileName}` : ""}</button>}
          </div>)}
          <datalist id="reimbursement-projects">{projectOptions.map((project) => <option key={project} value={project} />)}</datalist>
          <datalist id="reimbursement-clients">{clientOptions.map((client) => <option key={client} value={client} />)}</datalist>
          <Button type="button" variant="outline" onClick={addDraftItem} className="w-full"><Plus size={16} />Tambah Item Reimbursement</Button>
          {receiptError && <p className="rounded-lg bg-rose-50 p-3 text-xs font-bold text-rose-700">{receiptError}</p>}
          {access === "admin" && <div className="grid gap-3 md:grid-cols-2">
            <label><span className="mb-2 block text-xs font-bold">Status</span><select name="status" defaultValue={editing?.status || "Diajukan"} className={fieldClass}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label><span className="mb-2 block text-xs font-bold">Catatan admin</span><input name="notes" defaultValue={editing?.notes || ""} className={fieldClass} placeholder="Opsional" /></label>
          </div>}
          {editing?.notes && access !== "admin" && <div className="rounded-lg bg-slate-50 p-3 text-xs font-bold text-slate-500">Catatan admin: {editing.notes}</div>}
          <Button disabled={submitting} className="w-full"><FileText size={16} />{submitting ? "Memproses Foto..." : `Simpan ${draftItems.length} Item`}</Button>
        </form>
      </Modal>

      <Modal open={Boolean(preview)} title="Foto Bukti Reimbursement" onClose={() => setPreview(null)}>
        {preview && <div className="space-y-5">{getReimbursementItems(preview).filter((item) => item.receiptImage).map((item, index) => <figure key={item.id} className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <img src={item.receiptImage} alt={`Bukti reimbursement ${index + 1}`} className="max-h-[65vh] w-full bg-slate-50 object-contain dark:bg-slate-950" />
          <figcaption className="p-3"><p className="text-xs font-black">{item.description}</p><p className="mt-1 text-[11px] text-slate-400">{item.receiptFileName || `Foto bukti ${index + 1}`}</p></figcaption>
        </figure>)}</div>}
      </Modal>
    </>
  );
}
