"use client";

import { Header } from "@/components/header";
import { fieldClass, Modal } from "@/components/modal";
import { useAppData } from "@/components/app-data";
import { Badge, Button, Card } from "@/components/ui";
import { getUserAccess } from "@/lib/auth";
import { getClientProjects, getClientValue, stages, totalProjectValue, type Client, type ClientProject } from "@/lib/data";
import { cn } from "@/lib/utils";
import { rupiah } from "@/lib/utils";
import {
  ArrowUpRight,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Filter,
  LayoutGrid,
  List,
  MailCheck,
  MessageSquareText,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

const stageMeta: Record<Client["stage"], { tone: string; accent: string; label: string }> = {
  Leads: { tone: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200", accent: "bg-slate-400", label: "Capture" },
  "Discovery Call": { tone: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-200", accent: "bg-sky-500", label: "Qualify" },
  "Pitching & Propose": { tone: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200", accent: "bg-indigo-500", label: "Propose" },
  "Negotiating & Dealing": { tone: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200", accent: "bg-amber-500", label: "Close" },
  "Agreement Signed": { tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200", accent: "bg-emerald-500", label: "Onboard" },
  "Client (Active)": { tone: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-200", accent: "bg-teal-500", label: "Deliver" },
  "Post-Client": { tone: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200", accent: "bg-rose-500", label: "Retain" },
};

const priorityTone: Record<NonNullable<Client["priority"]>, "red" | "amber" | "slate"> = {
  High: "red",
  Medium: "amber",
  Low: "slate",
};

const serviceOptions = [
  "Social media production",
  "Consultation",
  "Shopee ads growth",
  "Tiktok ads growth",
  "Meta ads growth",
  "Social Media Agency",
  "Meta Ads Management",
  "Shopee Ads Management",
  "Marketing Consulting",
];

function formatDate(value?: string) {
  if (!value) return "Belum dijadwalkan";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(new Date(value));
}

function projectNames(client: Client) {
  return getClientProjects(client).map((project) => project.name).filter(Boolean).join(", ");
}

function projectScopes(client: Client) {
  return getClientProjects(client).map((project) => project.scope || project.name).filter(Boolean).join("; ");
}

function projectFormRows(editing: Client | null) {
  const projects = editing ? getClientProjects(editing) : [];
  const rowCount = Math.max(4, projects.length + 1);
  return Array.from({ length: rowCount }, (_, index) => projects[index] || null);
}

export default function CRMPage() {
  const { clients, addClient, updateClient, moveClient } = useAppData();
  const [email, setEmail] = useState("");
  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  useEffect(() => {
    fetch("/api/session").then((response) => response.ok ? response.json() : null).then((data) => setEmail(data?.email || "")).catch(() => setEmail(""));
  }, []);
  const canWrite = getUserAccess(email) !== "readonly";
  const filtered = clients.filter((client) => {
    const haystack = `${client.brand} ${client.pic} ${projectNames(client)} ${projectScopes(client)} ${client.cooperationScope || ""} ${client.industry}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (!industry || client.industry === industry);
  });
  const weightedPipeline = filtered.reduce((sum, client) => sum + getClientValue(client) * ((client.probability ?? 45) / 100), 0);
  const wonValue = filtered.filter((client) => client.stage === "Client (Active)" || client.stage === "Post-Client").reduce((sum, client) => sum + getClientValue(client), 0);
  const openValue = filtered.filter((client) => !["Client (Active)", "Post-Client"].includes(client.stage)).reduce((sum, client) => sum + getClientValue(client), 0);
  const hotDeals = filtered.filter((client) => (client.priority ?? "Medium") === "High").length;
  const conversionBase = filtered.filter((client) => client.stage !== "Leads").length || 1;
  const conversionRate = Math.round((filtered.filter((client) => ["Agreement Signed", "Client (Active)", "Post-Client"].includes(client.stage)).length / conversionBase) * 100);
  const industries = Array.from(new Set([...clients.map((client) => client.industry), "FnB", "Fitness & Wellness", "Fashion", "Beauty & Skincare", "Other"]));
  const maxStageValue = Math.max(...stages.map((stage) => filtered.filter((client) => client.stage === stage).reduce((sum, client) => sum + getClientValue(client), 0)), 1);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) return;
    const data = new FormData(event.currentTarget);
    const projectNames = data.getAll("projectName").map(String);
    const projectScopes = data.getAll("projectScope").map(String);
    const projectFees = data.getAll("projectMonthlyFee").map(String);
    const projectFeeNotes = data.getAll("projectFeeNote").map(String);
    const projectContracts = data.getAll("projectContractPeriod").map(String);
    const projectDeposits = data.getAll("projectDeposit").map(String);
    const projectNotes = data.getAll("projectNotes").map(String);
    const projects: ClientProject[] = projectNames
      .map((name, index) => ({
        id: editing?.projects?.[index]?.id || crypto.randomUUID(),
        name: name.trim(),
        scope: projectScopes[index]?.trim(),
        monthlyFee: Number(projectFees[index]) || undefined,
        feeNote: projectFeeNotes[index]?.trim(),
        contractPeriod: projectContracts[index]?.trim(),
        deposit: projectDeposits[index]?.trim(),
        notes: projectNotes[index]?.trim(),
      }))
      .filter((project) => project.name || project.scope || project.monthlyFee || project.feeNote)
      .map((project, index) => ({ ...project, name: project.name || `Project ${index + 1}` }));
    if (!projects.length) {
      window.alert("Isi minimal satu project.");
      return;
    }
    const selectedServices = projects.map((project) => project.name);
    const cooperationScope = String(data.get("cooperationScope")) || projects.map((project) => project.scope || project.name).join("; ");
    const client: Client = {
      id: editing?.id || crypto.randomUUID(),
      brand: String(data.get("brand")),
      pic: String(data.get("pic")),
      industry: String(data.get("industry")),
      service: selectedServices.join(", "),
      services: selectedServices,
      projects,
      cooperationScope,
      stage: String(data.get("stage")) as Client["stage"],
      value: totalProjectValue(projects),
      source: String(data.get("source")),
      priority: String(data.get("priority")) as Client["priority"],
      probability: Number(data.get("probability")) || 35,
      owner: String(data.get("owner")),
      nextAction: String(data.get("nextAction")),
      dueDate: String(data.get("dueDate")),
      health: String(data.get("health")) as Client["health"],
    };
    if (editing) updateClient(editing.id, client);
    else addClient(client);
    setOpen(false);
    setEditing(null);
  }

  function openCreateModal() {
    if (!canWrite) return;
    setEditing(null);
    setOpen(true);
  }

  function openEditModal(client: Client) {
    if (!canWrite) return;
    setEditing(client);
    setOpen(true);
  }

  return (
    <>
      <Header title="GH CRM Command Center" subtitle="Lead, customer, post-customer, dan nilai project dalam satu workspace." />

      <section className="mb-6 grid gap-4 xl:grid-cols-[1.45fr_.95fr]">
        <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-black uppercase tracking-[.18em] text-teal-700 dark:bg-teal-950 dark:text-teal-200">
                <Sparkles size={13} /> GrowthHive CRM
              </div>
              <h2 className="text-xl font-black tracking-tight text-ink dark:text-white">Journey revenue GH</h2>
            </div>
            {canWrite && <Button onClick={openCreateModal}>
              <Plus size={16} /> Tambah Deal
            </Button>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 min-[1540px]:grid-cols-4">
            <MetricCard icon={CircleDollarSign} label="Open Pipeline" value={rupiah(openValue)} helper={`${filtered.length} opportunity`} tone="teal" />
            <MetricCard icon={TrendingUp} label="Weighted Forecast" value={rupiah(weightedPipeline)} helper="Berdasarkan probability" tone="blue" />
            <MetricCard icon={Banknote} label="Won/Post Value" value={rupiah(wonValue)} helper="Active + post-client" tone="emerald" />
            <MetricCard icon={Target} label="Close Readiness" value={`${conversionRate}%`} helper={`${hotDeals} high priority deal`} tone="amber" />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-slate-400">Next Actions</p>
              <h3 className="mt-1 font-black text-ink dark:text-white">Follow-up terdekat</h3>
            </div>
            <CalendarClock className="text-teal-600" size={20} />
          </div>
          <div className="space-y-3">
            {filtered.length ? (
              filtered
              .slice()
              .sort((a, b) => String(a.dueDate || "9999").localeCompare(String(b.dueDate || "9999")))
              .slice(0, 4)
              .map((client) => (
                <div key={client.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                  <div className={cn("h-2.5 w-2.5 rounded-full", stageMeta[client.stage].accent)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{client.brand}</p>
                    <p className="truncate text-xs text-slate-400">{client.nextAction || "Tentukan next action"}</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-slate-500">{formatDate(client.dueDate)}</span>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm font-bold text-slate-400 dark:border-slate-800">
                Belum ada follow-up. Tambahkan deal pertama untuk mulai mengisi journey GH.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-slate-200/80 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
            <button onClick={() => setView("pipeline")} className={cn("inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-black", view === "pipeline" ? "bg-white text-teal-700 shadow-sm dark:bg-slate-900" : "text-slate-400")}>
              <SlidersHorizontal size={14} /> Pipeline
            </button>
            <button onClick={() => setView("list")} className={cn("inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-black", view === "list" ? "bg-white text-teal-700 shadow-sm dark:bg-slate-900" : "text-slate-400")}>
              <List size={14} /> Table
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-950">
              <Search size={15} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-40 bg-transparent text-sm outline-none" placeholder="Cari brand, PIC, service" />
            </div>
            <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-950">
              <Filter size={15} />
              <select value={industry} onChange={(event) => setIndustry(event.target.value)} className="bg-transparent text-sm outline-none">
                <option value="">Semua industri</option>
                {industries.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {view === "pipeline" ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {stages.map((stage) => {
              const items = filtered.filter((client) => client.stage === stage);
              const stageValue = items.reduce((sum, client) => sum + getClientValue(client), 0);
              return (
                <div key={stage} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { if (!canWrite) return; moveClient(event.dataTransfer.getData("id"), stage); }} className="min-h-64 w-[238px] shrink-0 rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                  <div className="mb-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black", stageMeta[stage].tone)}>{stageMeta[stage].label}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-400 dark:bg-slate-900">{items.length}</span>
                    </div>
                    <h3 className="min-h-8 text-xs font-black leading-4 text-ink dark:text-white">{stage}</h3>
                    <p className="mt-1 text-[11px] font-bold text-slate-400">{rupiah(stageValue)}</p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className={cn("h-full rounded-full", stageMeta[stage].accent)} style={{ width: `${Math.max(8, (stageValue / maxStageValue) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {items.map((client) => {
                      const projects = getClientProjects(client);
                      return (
                        <article key={client.id} draggable={canWrite && clients.some((item) => item.id === client.id)} onDragStart={(event) => { if (!canWrite) return; event.dataTransfer.setData("id", client.id); }} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900">
                          <div className="mb-3 flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="truncate text-sm font-black">{client.brand}</h4>
                              <p className="truncate text-[11px] text-slate-400">{client.pic}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge tone={priorityTone[client.priority ?? "Medium"]}>{client.priority ?? "Medium"}</Badge>
                              {canWrite && <button onClick={() => openEditModal(client)} title="Edit deal" className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-teal-700 dark:border-slate-700 dark:hover:bg-slate-800"><Pencil size={13} /></button>}
                            </div>
                          </div>
                          <p className="line-clamp-2 min-h-8 text-xs text-slate-500 dark:text-slate-300">{projects.map((project) => project.name).join(", ") || "Project belum diisi"}</p>
                          {projects[0]?.scope && <p className="mt-2 line-clamp-2 rounded-lg bg-slate-50 p-2 text-[11px] leading-4 text-slate-500 dark:bg-slate-950 dark:text-slate-300">{projects[0].scope}</p>}
                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                            <span className="text-xs font-black text-teal-700 dark:text-teal-300">{rupiah(getClientValue(client))}</span>
                            <span className="text-[11px] font-bold text-slate-400">{projects.length} project</span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[.12em] text-slate-400 dark:bg-slate-950">
                <tr>
                  {["Brand", "Journey", "PIC", "Scope", "Project Value", "Forecast", "Next Action", "Owner", "Health", ...(canWrite ? ["Admin"] : [])].map((item) => (
                    <th key={item} className="px-4 py-3 font-black">{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr key={client.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-4">
                      <p className="font-black text-ink dark:text-white">{client.brand}</p>
                      <p className="mt-1 text-xs text-slate-400">{client.industry} · {client.source || "Direct"}</p>
                    </td>
                    <td className="px-4 py-4"><span className={cn("rounded-full px-2.5 py-1 text-[11px] font-black", stageMeta[client.stage].tone)}>{client.stage}</span></td>
                    <td className="px-4 py-4">{client.pic}</td>
                    <td className="max-w-xs px-4 py-4 text-xs leading-5 text-slate-500">{projectScopes(client) || "-"}</td>
                    <td className="px-4 py-4 font-black">{rupiah(getClientValue(client))}</td>
                    <td className="px-4 py-4">{rupiah(getClientValue(client) * ((client.probability ?? 35) / 100))}</td>
                    <td className="px-4 py-4">
                      <p className="font-bold">{client.nextAction || "Belum ada"}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDate(client.dueDate)}</p>
                    </td>
                    <td className="px-4 py-4"><span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-xs font-black text-white">{client.owner || "GH"}</span></td>
                    <td className="px-4 py-4"><HealthBadge health={client.health} /></td>
                    {canWrite && <td className="px-4 py-4"><button onClick={() => openEditModal(client)} title="Edit deal" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-teal-700 dark:border-slate-700 dark:hover:bg-slate-800"><Pencil size={14} /></button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[.95fr_1.05fr]">
        <Card className="rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-slate-400">Project Value</p>
              <h3 className="mt-1 font-black text-ink dark:text-white">Distribusi nilai per journey</h3>
            </div>
            <LayoutGrid className="text-teal-600" size={20} />
          </div>
          <div className="space-y-4">
            {stages.map((stage) => {
              const stageValue = filtered.filter((client) => client.stage === stage).reduce((sum, client) => sum + getClientValue(client), 0);
              return (
                <div key={stage}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                    <span className="font-bold text-slate-500 dark:text-slate-300">{stage}</span>
                    <span className="font-black">{rupiah(stageValue)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className={cn("h-full rounded-full", stageMeta[stage].accent)} style={{ width: `${Math.max(2, (stageValue / maxStageValue) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-slate-400">Customer Journey</p>
              <h3 className="mt-1 font-black text-ink dark:text-white">Lead to post-customer flow</h3>
            </div>
            <UsersRound className="text-teal-600" size={20} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <JourneyTile icon={MessageSquareText} label="Lead to Customer" value={filtered.filter((client) => !["Client (Active)", "Post-Client"].includes(client.stage)).length} helper="Prospecting sampai signed" />
            <JourneyTile icon={MailCheck} label="Customer Success" value={filtered.filter((client) => client.stage === "Client (Active)").length} helper="Delivery dan review" />
            <JourneyTile icon={CheckCircle2} label="Post-Customer" value={filtered.filter((client) => client.stage === "Post-Client").length} helper="Testimonial, upsell, referral" />
          </div>
        </Card>
      </section>

      <Modal open={open} title={editing ? `Edit Deal · ${editing.brand}` : "Tambah Deal CRM"} onClose={() => { setOpen(false); setEditing(null); }}>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          {[
            ["Brand", "brand", "text"],
            ["Nama PIC", "pic", "text"],
            ["Source", "source", "text"],
            ["Owner", "owner", "text"],
            ["Probability (%)", "probability", "number"],
            ["Next action", "nextAction", "text"],
          ].map(([label, name, type]) => (
            <label key={name}>
              <span className="mb-2 block text-xs font-bold">{label}</span>
              <input name={name} defaultValue={editing?.[name as keyof Client] as string | number | undefined || ""} required={["brand", "pic"].includes(name)} type={type} min={name === "probability" ? 0 : undefined} max={name === "probability" ? 100 : undefined} className={fieldClass} />
            </label>
          ))}
          <div className="space-y-3 md:col-span-2">
            <span className="block text-xs font-bold">Project client</span>
            {projectFormRows(editing).map((project, index) => (
              <div key={project?.id || index} className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-xs font-bold">Project {index + 1}</span>
                  <input name="projectName" list="project-options" defaultValue={project?.name || ""} className={fieldClass} />
                </label>
                <label>
                  <span className="mb-2 block text-xs font-bold">Fee bulanan</span>
                  <input name="projectMonthlyFee" defaultValue={project?.monthlyFee || ""} type="number" className={fieldClass} />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-xs font-bold">Scope project</span>
                  <textarea name="projectScope" defaultValue={project?.scope || ""} rows={2} className={`${fieldClass} h-auto py-3`} />
                </label>
                <label>
                  <span className="mb-2 block text-xs font-bold">Periode kontrak</span>
                  <input name="projectContractPeriod" defaultValue={project?.contractPeriod || ""} className={fieldClass} />
                </label>
                <label>
                  <span className="mb-2 block text-xs font-bold">Deposit</span>
                  <input name="projectDeposit" defaultValue={project?.deposit || ""} className={fieldClass} />
                </label>
                <label>
                  <span className="mb-2 block text-xs font-bold">Fee note</span>
                  <input name="projectFeeNote" defaultValue={project?.feeNote || ""} className={fieldClass} />
                </label>
                <label>
                  <span className="mb-2 block text-xs font-bold">Catatan</span>
                  <input name="projectNotes" defaultValue={project?.notes || ""} className={fieldClass} />
                </label>
              </div>
            ))}
            <datalist id="project-options">
              {serviceOptions.map((service) => <option key={service} value={service} />)}
            </datalist>
          </div>
          <label>
            <span className="mb-2 block text-xs font-bold">Industri</span>
            <select name="industry" defaultValue={editing?.industry || industries[0]} className={fieldClass}>{industries.map((item) => <option key={item}>{item}</option>)}</select>
          </label>
          <label>
            <span className="mb-2 block text-xs font-bold">Journey Stage</span>
            <select name="stage" defaultValue={editing?.stage || stages[0]} className={fieldClass}>{stages.map((item) => <option key={item}>{item}</option>)}</select>
          </label>
          <label>
            <span className="mb-2 block text-xs font-bold">Priority</span>
            <select name="priority" defaultValue={editing?.priority || "Medium"} className={fieldClass}>{["High", "Medium", "Low"].map((item) => <option key={item}>{item}</option>)}</select>
          </label>
          <label>
            <span className="mb-2 block text-xs font-bold">Health</span>
            <select name="health" defaultValue={editing?.health || "Green"} className={fieldClass}>{["Green", "Amber", "Red"].map((item) => <option key={item}>{item}</option>)}</select>
          </label>
          <label className="md:col-span-2">
            <span className="mb-2 block text-xs font-bold">Scope kerja sama</span>
            <textarea name="cooperationScope" defaultValue={editing?.cooperationScope || ""} rows={4} className={`${fieldClass} h-auto py-3`} placeholder="Contoh: 12 konten feed/bulan, 8 video reels, monthly report, optimasi campaign mingguan" />
          </label>
          <label className="md:col-span-2">
            <span className="mb-2 block text-xs font-bold">Tanggal follow-up</span>
            <input name="dueDate" defaultValue={editing?.dueDate || ""} type="date" className={fieldClass} />
          </label>
          <Button className="md:col-span-2">{editing ? "Update Deal" : "Simpan Deal"}</Button>
        </form>
      </Modal>
    </>
  );
}

function MetricCard({ icon: Icon, label, value, helper, tone }: { icon: typeof CircleDollarSign; label: string; value: string; helper: string; tone: "teal" | "blue" | "emerald" | "amber" }) {
  const tones = {
    teal: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-200",
    blue: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-200",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
  };

  return (
    <div className="rounded-lg border border-slate-100 p-4 dark:border-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <span className={cn("grid h-9 w-9 place-items-center rounded-lg", tones[tone])}><Icon size={18} /></span>
        <ArrowUpRight className="text-slate-300" size={18} />
      </div>
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-2 break-words text-lg font-black leading-tight tracking-tight text-ink dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </div>
  );
}

function HealthBadge({ health = "Green" }: { health?: Client["health"] }) {
  const tone = health === "Red" ? "bg-red-50 text-red-700" : health === "Amber" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700";
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-black", tone)}>{health}</span>;
}

function JourneyTile({ icon: Icon, label, value, helper }: { icon: typeof MessageSquareText; label: string; value: number; helper: string }) {
  return (
    <div className="rounded-lg border border-slate-100 p-4 dark:border-slate-800">
      <Icon className="text-teal-600" size={20} />
      <p className="mt-4 text-2xl font-black text-ink dark:text-white">{value}</p>
      <p className="mt-1 text-sm font-black">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{helper}</p>
    </div>
  );
}
