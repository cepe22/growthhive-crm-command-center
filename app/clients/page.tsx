"use client";

import { useAppData } from "@/components/app-data";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { Badge, Card } from "@/components/ui";
import { getClientProjects, getClientValue, type Client } from "@/lib/data";
import { rupiah } from "@/lib/utils";
import { BriefcaseBusiness, CircleDollarSign, HeartPulse, Target } from "lucide-react";

const stageTone: Record<Client["stage"], "teal" | "amber" | "red" | "slate"> = {
  Leads: "slate",
  "Discovery Call": "slate",
  "Pitching & Propose": "amber",
  "Negotiating & Dealing": "amber",
  "Agreement Signed": "teal",
  "Client (Active)": "teal",
  "Post-Client": "slate",
};

const clientDirectoryStages: Client["stage"][] = ["Client (Active)"];

function projectFee(project: ReturnType<typeof getClientProjects>[number]) {
  if (project.monthlyFee) return rupiah(project.monthlyFee);
  return project.feeNote || "-";
}

export default function ClientsPage() {
  const { clients } = useAppData();
  const directoryClients = clients.filter((client) => clientDirectoryStages.includes(client.stage));
  const totalValue = directoryClients.reduce((sum, client) => sum + getClientValue(client), 0);
  const healthyClients = directoryClients.filter((client) => (client.health || "Green") === "Green").length;

  return (
    <>
      <Header title="Client Directory" subtitle="Data client, nilai kerja sama, scope, dan status commercial GrowthHive." />

      <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Active Client", value: String(directoryClients.length), icon: BriefcaseBusiness, color: "bg-teal-50 text-teal-700" },
          { label: "Healthy Client", value: String(healthyClients), icon: HeartPulse, color: "bg-emerald-50 text-emerald-700" },
          { label: "Nilai Kerja Sama", value: rupiah(totalValue), icon: CircleDollarSign, color: "bg-sky-50 text-sky-700" },
          { label: "Projected Revenue", value: rupiah(totalValue), icon: Target, color: "bg-amber-50 text-amber-700" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="rounded-lg p-5">
            <div className={`mb-5 grid h-11 w-11 place-items-center rounded-lg ${color}`}><Icon size={20} /></div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-2 text-xl font-black text-ink dark:text-white">{value}</p>
          </Card>
        ))}
      </section>

      <section className="mb-5 rounded-lg border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-black">Client Status</h2>
            <p className="mt-1 text-xs text-slate-400">Hanya client dengan stage CRM Client (Active).</p>
          </div>
          <Badge tone="teal">{healthyClients} healthy</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {clientDirectoryStages.map((stage) => (
            <div key={stage} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
              <p className="min-h-9 text-xs font-black text-slate-500 dark:text-slate-300">{stage}</p>
              <p className="mt-2 text-2xl font-black">{directoryClients.filter((client) => client.stage === stage).length}</p>
            </div>
          ))}
        </div>
      </section>

      <Card className="overflow-hidden rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="font-black">Client Commercial Data</h2>
            <p className="mt-1 text-xs text-slate-400">Halaman ini memuat nilai kerja sama, jadi dipisahkan dari Project Hub.</p>
          </div>
        </div>
        {!directoryClients.length ? <EmptyState title="Belum ada active client" description="Deal yang masih leads, pitching, negotiation, atau agreement signed tetap ada di CRM dan akan muncul di sini setelah stage-nya Client (Active)." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[.12em] text-slate-400 dark:bg-slate-950">
                <tr>{["Client", "PIC", "Stage", "Layanan / Project", "Scope Kerja Sama", "Nilai Kerja Sama", "Projected Revenue", "Owner", "Health", "Next Output"].map((item) => <th key={item} className="p-4">{item}</th>)}</tr>
              </thead>
              <tbody>
                {directoryClients.map((client) => {
                  const projects = getClientProjects(client);
                  return (
                    <tr key={client.id} className="border-t border-slate-100 align-top dark:border-slate-800">
                      <td className="p-4">
                        <p className="font-black">{client.brand}</p>
                        <p className="mt-1 text-xs text-slate-400">{client.industry} · {client.source || "Direct"}</p>
                      </td>
                      <td className="p-4">{client.pic}</td>
                      <td className="p-4"><Badge tone={stageTone[client.stage]}>{client.stage}</Badge></td>
                      <td className="p-4">
                        <div className="space-y-2">
                          {projects.map((project) => (
                            <div key={project.id} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-950">
                              <p className="text-xs font-black">{project.name}</p>
                              <p className="mt-1 text-[11px] text-slate-400">{projectFee(project)}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="max-w-sm p-4 text-xs leading-5 text-slate-500">
                        <div className="space-y-2">{projects.map((project) => <p key={project.id}>{project.scope || project.name}</p>)}</div>
                      </td>
                      <td className="p-4 font-black">{rupiah(getClientValue(client))}</td>
                      <td className="p-4">{rupiah(getClientValue(client))}</td>
                      <td className="p-4">{client.owner || "GH"}</td>
                      <td className="p-4"><Badge tone={client.health === "Red" ? "red" : client.health === "Amber" ? "amber" : "teal"}>{client.health || "Green"}</Badge></td>
                      <td className="max-w-xs p-4 text-xs leading-5 text-slate-500">{client.nextAction || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
