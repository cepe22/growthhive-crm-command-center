"use client";

import { Header } from "@/components/header";
import { Badge, Button, Card } from "@/components/ui";
import {
  activeProjectCount,
  clientContractSource,
  knownMonthlyFee,
  managedClients,
  type ContractStatus,
} from "@/lib/client-projects";
import { rupiah } from "@/lib/utils";
import { AlertTriangle, BriefcaseBusiness, CalendarClock, ExternalLink, Search, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";

const statuses: ContractStatus[] = ["Aktif", "Bulanan", "Perlu diperbarui", "Periode belum diisi"];

const tone = (status: ContractStatus) => {
  if (status === "Aktif") return "teal";
  if (status === "Perlu diperbarui") return "red";
  if (status === "Bulanan") return "amber";
  return "slate";
};

export default function ClientManagementPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ContractStatus | "">("");
  const filtered = useMemo(
    () =>
      managedClients.filter(
        (client) =>
          (!status || client.status === status) &&
          (!query ||
            `${client.brand} ${client.projects.map((project) => project.scope).join(" ")}`
              .toLowerCase()
              .includes(query.toLowerCase())),
      ),
    [query, status],
  );
  const needsAttention = managedClients.filter(
    (client) => client.status === "Perlu diperbarui" || client.status === "Periode belum diisi",
  ).length;

  return (
    <>
      <Header
        title="Client Management"
        subtitle="Pantau seluruh project aktif, scope, fee, dan masa berlaku kontrak."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "On-going Client", value: String(managedClients.length), icon: BriefcaseBusiness, color: "bg-teal-50 text-teal-700" },
          { label: "Project / Scope Aktif", value: String(activeProjectCount), icon: CalendarClock, color: "bg-sky-50 text-sky-700" },
          { label: "Known Monthly Fee", value: rupiah(knownMonthlyFee), icon: WalletCards, color: "bg-emerald-50 text-emerald-700" },
          { label: "Perlu Perhatian", value: String(needsAttention), icon: AlertTriangle, color: "bg-amber-50 text-amber-700" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card className="p-5" key={label}>
            <div className={`mb-5 grid h-11 w-11 place-items-center rounded-xl ${color}`}><Icon size={20} /></div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-2 text-xl font-black text-ink dark:text-white">{value}</p>
          </Card>
        ))}
      </section>

      <div className="my-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-44 bg-transparent text-sm outline-none"
              placeholder="Cari klien atau scope"
            />
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ContractStatus | "")}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-900"
          >
            <option value="">Semua status kontrak</option>
            {statuses.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <a href={clientContractSource} target="_blank" rel="noreferrer">
          <Button variant="outline"><ExternalLink size={15} />Buka data sumber</Button>
        </a>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400 dark:bg-slate-800">
              <tr>{["Client", "Scope & Fee", "Total Fee / Bulan", "Masa Kontrak", "Status", "Notes"].map((label) => <th key={label} className="p-4">{label}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((client) => {
                const total = client.projects.reduce((sum, project) => sum + (project.monthlyFee || 0), 0);
                return (
                  <tr key={client.brand} className="border-t border-slate-100 align-top dark:border-slate-800">
                    <td className="p-4 font-black">{client.brand}</td>
                    <td className="space-y-2 p-4">
                      {client.projects.map((project) => (
                        <div key={project.scope} className="flex items-center justify-between gap-4">
                          <span>{project.scope}</span>
                          <span className="shrink-0 text-xs font-bold text-slate-500">
                            {project.monthlyFee ? rupiah(project.monthlyFee) : project.feeNote || "Fee belum diisi"}
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className="p-4 font-black">{total ? rupiah(total) : "Variable / belum diisi"}</td>
                    <td className="p-4 text-slate-500">{client.contractPeriod || "Belum diisi"}</td>
                    <td className="p-4"><Badge tone={tone(client.status)}>{client.status}</Badge></td>
                    <td className="max-w-xs p-4 text-xs leading-5 text-slate-500">{client.notes || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length && <p className="p-8 text-center text-sm text-slate-400">Tidak ada klien yang sesuai filter.</p>}
      </Card>
      <p className="mt-3 text-xs text-slate-400">
        Known monthly fee hanya menghitung fee nominal yang tercatat. Skema persentase dan fee yang belum diisi tidak termasuk.
      </p>
    </>
  );
}
