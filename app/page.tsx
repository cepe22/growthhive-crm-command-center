"use client";

import { useAppData } from "@/components/app-data";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { Badge, Card } from "@/components/ui";
import { getUserAccess } from "@/lib/auth";
import { getClientProjects, getClientValue, stages } from "@/lib/data";
import type { TeamMember } from "@/lib/client-projects";
import { financial2026 } from "@/lib/financial-2024";
import { rupiah } from "@/lib/utils";
import { BriefcaseBusiness, CircleDollarSign, Clock3, CreditCard, ListChecks, PhoneCall, ReceiptText, TrendingDown, TrendingUp, UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const dayMs = 24 * 60 * 60 * 1000;
const socialMediaKeywords = ["social media", "content", "production"];
const adsMarketplaceKeywords = ["meta ads", "shopee", "tiktok", "marketplace", "ads growth", "ads management"];

function daysUntil(from: string, to: string) {
  return Math.ceil((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / dayMs);
}

function dueLabel(today: string, dueDate: string) {
  const distance = daysUntil(today, dueDate);
  if (distance < 0) return `Overdue ${Math.abs(distance)} hari`;
  if (distance === 0) return "Hari ini";
  if (distance === 1) return "Besok";
  return `${distance} hari lagi`;
}

function textMatchesKeywords(value: string, keywords: string[]) {
  const normalized = value.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function memberProjectKeywords(member?: TeamMember) {
  if (!member) return [];
  if (member.id === "tm-inaya" || member.id === "tm-sellina") return socialMediaKeywords;
  if (member.id === "tm-joshua") return adsMarketplaceKeywords;
  return [];
}

export default function Dashboard() {
  const { clients, projectTasks, calendarEvents, invoices, reimbursements, teamMembers } = useAppData();
  const [email, setEmail] = useState("");
  useEffect(() => {
    fetch("/api/session").then((response) => response.ok ? response.json() : null).then((data) => setEmail(data?.email || "")).catch(() => setEmail(""));
  }, []);
  const access = getUserAccess(email);
  const canReadAll = access === "admin" || access === "readonly" || access === "finance_readonly";
  const currentMember = teamMembers.find((member) => member.email.toLowerCase() === email.toLowerCase()) || (access === "admin" ? teamMembers[0] : undefined);
  const allowedProjectKeywords = canReadAll ? [] : memberProjectKeywords(currentMember);
  const canSeeProjectName = (projectName: string) => canReadAll || textMatchesKeywords(projectName, allowedProjectKeywords);
  const visibleActiveClients = clients.filter((client) => client.stage === "Client (Active)" && (canReadAll || getClientProjects(client).some((project) => canSeeProjectName(`${project.name} ${project.scope || ""}`))));
  const visibleProjectTasks = projectTasks.filter((task) => {
    if (canReadAll) return true;
    if (!currentMember) return false;
    if ([task.assigneeId, task.assignedById, task.watcherId].includes(currentMember.id)) return true;
    return canSeeProjectName(task.project);
  });
  const total = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paid = invoices.filter((invoice) => invoice.status === "Lunas").reduce((sum, invoice) => sum + invoice.amount, 0);
  const openPipeline = clients.filter((client) => !["Cancelled / No Response", "Client (Active)", "Post-Client"].includes(client.stage)).reduce((sum, client) => sum + getClientValue(client), 0);
  const visibleActiveProjects = visibleProjectTasks.filter((task) => task.status !== "Done").length;
  const today = new Date().toISOString().slice(0, 10);
  const myActiveTasks = currentMember
    ? projectTasks.filter((task) => task.assigneeId === currentMember.id && task.status !== "Done")
    : [];
  const priorityOrder = { High: 0, Medium: 1, Low: 2 } as const;
  const myUrgentTasks = [...myActiveTasks]
    .sort((a, b) => {
      const deadlineDifference = new Date(`${a.dueDate}T00:00:00`).getTime() - new Date(`${b.dueDate}T00:00:00`).getTime();
      return deadlineDifference || priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 8);
  const deadlinePeriods = [
    { label: "Lewat deadline", count: myActiveTasks.filter((task) => daysUntil(today, task.dueDate) < 0).length, tone: "red" as const },
    { label: "Hari ini", count: myActiveTasks.filter((task) => daysUntil(today, task.dueDate) === 0).length, tone: "amber" as const },
    { label: "1-3 hari", count: myActiveTasks.filter((task) => { const distance = daysUntil(today, task.dueDate); return distance >= 1 && distance <= 3; }).length, tone: "amber" as const },
    { label: "4-7 hari", count: myActiveTasks.filter((task) => { const distance = daysUntil(today, task.dueDate); return distance >= 4 && distance <= 7; }).length, tone: "slate" as const },
  ];
  const acceptedEvents = calendarEvents.filter((event) => Object.values(event.responses).some((response) => response === "Accepted")).length;
  const activeClients = visibleActiveClients.length;
  const visibleReimbursements = access === "admin" ? reimbursements : reimbursements.filter((item) => item.requesterEmail === email);
  const pendingReimbursements = visibleReimbursements.filter((item) => ["Diajukan", "Diproses", "Disetujui"].includes(item.status)).length;
  const activeClientProjects = visibleActiveClients.flatMap((client) => getClientProjects(client).map((project) => ({ client: client.brand, project })));
  const monthlyProjectValue = activeClientProjects.reduce((sum, item) => sum + (item.project.monthlyFee || 0), 0);
  const nonFixedProjectCount = activeClientProjects.filter((item) => !item.project.monthlyFee && item.project.feeNote).length;
  const latestFinancialMonths = financial2026.months.slice(-3);
  const financialSummary = latestFinancialMonths.reduce((summary, month) => ({
    revenue: summary.revenue + month.revenue,
    expenses: summary.expenses + month.expenses,
    netIncome: summary.netIncome + month.netIncome,
  }), { revenue: 0, expenses: 0, netIncome: 0 });
  const firstFinancialMonth = latestFinancialMonths[0];
  const lastFinancialMonth = latestFinancialMonths[latestFinancialMonths.length - 1];
  const revenueTrend = firstFinancialMonth && lastFinancialMonth ? lastFinancialMonth.revenue - firstFinancialMonth.revenue : 0;
  const stats = [
    { label: "Task Aktif", value: String(visibleActiveProjects), icon: BriefcaseBusiness },
    { label: "CRM Pipeline", value: rupiah(openPipeline), icon: CreditCard },
    { label: "Event Disetujui", value: String(acceptedEvents), icon: CircleDollarSign },
    { label: "Belum Terbayar", value: rupiah(total - paid), icon: Clock3 },
  ];
  const teamStats = [
    { label: "Task Aktif Saya", value: String(myActiveTasks.length), icon: BriefcaseBusiness },
    { label: "Active Client", value: String(activeClients), icon: UsersRound },
    { label: "Event Disetujui", value: String(acceptedEvents), icon: CircleDollarSign },
    { label: "Reimbursement Proses", value: String(pendingReimbursements), icon: ReceiptText },
  ];
  const readOnlyStats = [
    { label: "Active Client", value: String(activeClients), helper: "Client aktif saat ini", icon: UsersRound },
    { label: "Nilai Project / Bulan", value: rupiah(monthlyProjectValue), helper: nonFixedProjectCount ? `${nonFixedProjectCount} project berbasis persentase belum masuk angka` : "Fixed monthly fee", icon: BriefcaseBusiness },
    { label: "Pendapatan 3 Bulan", value: rupiah(financialSummary.revenue), helper: financial2026.period, icon: CircleDollarSign },
    { label: "Net Income 3 Bulan", value: rupiah(financialSummary.netIncome), helper: revenueTrend >= 0 ? "Revenue naik dari bulan awal" : "Revenue turun dari bulan awal", icon: revenueTrend >= 0 ? TrendingUp : TrendingDown },
  ];

  const upcomingItems = [
    ...clients
      .filter((client) => client.stage !== "Cancelled / No Response" && client.dueDate && client.nextAction)
      .map((client) => ({
        id: `crm-${client.id}`,
        type: "Follow-up",
        title: client.nextAction || "Follow-up client",
        context: `${client.brand} · ${client.stage}`,
        dueDate: client.dueDate as string,
        href: "/crm",
        icon: PhoneCall,
      })),
    ...(access === "team" ? visibleProjectTasks : projectTasks)
      .filter((task) => task.status !== "Done")
      .map((task) => ({
        id: `task-${task.id}`,
        type: "Task",
        title: task.title,
        context: `${task.project} · ${task.client || "Internal"}`,
        dueDate: task.dueDate,
        href: "/client-management",
        icon: ListChecks,
      })),
  ].sort((a, b) => new Date(`${a.dueDate}T00:00:00`).getTime() - new Date(`${b.dueDate}T00:00:00`).getTime()).slice(0, 6);

  if (access === "team") {
    return (
      <>
        <Header title="Dashboard Tim" subtitle="Ringkasan pekerjaan, jadwal, dan kebutuhan operasional yang bisa kamu akses." />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {teamStats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="p-5">
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon size={20} /></div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="mt-2 text-xl font-black text-ink dark:text-white">{value}</p>
            </Card>
          ))}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <h2 className="font-black">Pekerjaan Paling Urgent</h2>
                <p className="text-xs text-slate-400">Hanya task yang di-assign kepadamu, diurutkan dari deadline terdekat</p>
              </div>
              <Link href="/client-management" className="text-xs font-bold text-teal-600">Project Hub</Link>
            </div>
            <div className="grid grid-cols-2 border-y border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/30 sm:grid-cols-4">
              {deadlinePeriods.map((period) => (
                <div key={period.label} className="border-b border-r border-slate-100 p-4 last:border-r-0 dark:border-slate-800 sm:border-b-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{period.label}</p>
                  <div className="mt-2"><Badge tone={period.tone}>{period.count} task</Badge></div>
                </div>
              ))}
            </div>
            {!myUrgentTasks.length ? (
              <EmptyState title="Belum ada pekerjaan aktif" description="Task yang di-assign kepadamu akan muncul di sini berdasarkan urutan deadline." />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {myUrgentTasks.map((task) => {
                  const distance = daysUntil(today, task.dueDate);
                  return (
                    <Link key={task.id} href="/client-management" className="flex flex-wrap items-center gap-4 p-5 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700"><ListChecks size={18} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={task.priority === "High" ? "red" : task.priority === "Medium" ? "amber" : "slate"}>{task.priority}</Badge>
                          <Badge tone="slate">{task.status}</Badge>
                          <span className="text-xs font-bold text-slate-400">{task.dueDate}</span>
                        </div>
                        <p className="mt-2 truncate font-black text-ink dark:text-white">{task.title}</p>
                        <p className="mt-1 truncate text-xs text-slate-400">{task.project} · {task.client || "Internal"}</p>
                      </div>
                      <Badge tone={distance < 0 ? "red" : distance <= 3 ? "amber" : "slate"}>{dueLabel(today, task.dueDate)}</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-black">Reimbursement</h2>
                <p className="text-xs text-slate-400">Status pengajuan operasional kamu</p>
              </div>
              <Link href="/reimbursements" className="text-xs font-bold text-teal-600">Ajukan</Link>
            </div>
            {!visibleReimbursements.length ? (
              <EmptyState title="Belum ada pengajuan" description="Ajukan reimbursement operasional dari halaman Reimbursement." />
            ) : (
              <div className="space-y-3">
                {visibleReimbursements.slice(0, 4).map((item) => (
                  <Link href="/reimbursements" key={item.id} className="block rounded-lg border border-slate-100 p-3 text-sm transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-black">{item.category}</p>
                      <Badge tone={item.status === "Ditolak" ? "red" : item.status === "Diajukan" || item.status === "Diproses" ? "amber" : "teal"}>{item.status}</Badge>
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-500">{rupiah(item.amount)}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-400">{item.description}</p>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </section>
      </>
    );
  }

  if (access === "readonly" || access === "finance_readonly") {
    const monitorName = access === "finance_readonly" ? "Riko" : "Gaby";
    return (
      <>
        <Header title={`Selamat datang, ${monitorName}`} subtitle="Dashboard monitoring GrowthHive: client aktif, nilai project bulanan, dan performa keuangan terbaru." />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {readOnlyStats.map(({ label, value, helper, icon: Icon }) => (
            <Card key={label} className="p-5">
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon size={20} /></div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="mt-2 text-xl font-black text-ink dark:text-white">{value}</p>
              <p className="mt-2 min-h-8 text-xs leading-4 text-slate-400">{helper}</p>
            </Card>
          ))}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_1fr]">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <h2 className="font-black">Nilai Project per Bulan</h2>
                <p className="text-xs text-slate-400">Hanya menghitung project active client dengan fixed monthly fee</p>
              </div>
              <Badge tone="teal">{activeClientProjects.length} project</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-900/70">
                  <tr>
                    <th className="px-5 py-4">Client</th>
                    <th className="px-5 py-4">Scope</th>
                    <th className="px-5 py-4">Nilai / Bulan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeClientProjects.map(({ client, project }) => (
                    <tr key={project.id}>
                      <td className="px-5 py-4 font-black text-ink dark:text-white">{client}</td>
                      <td className="px-5 py-4 text-slate-500">{project.scope || project.name}</td>
                      <td className="px-5 py-4 font-bold">{project.monthlyFee ? rupiah(project.monthlyFee) : project.feeNote || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-5">
              <h2 className="font-black">Performa Keuangan 3 Bulan</h2>
              <p className="text-xs text-slate-400">Disusun per bulan dari laporan {financial2026.year}</p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {latestFinancialMonths.map((month) => (
                <div key={month.month} className="p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="font-black text-ink dark:text-white">{month.month} {financial2026.year}</p>
                    <Badge tone={month.netIncome >= 0 ? "teal" : "red"}>{month.netIncome >= 0 ? "Profit" : "Loss"}</Badge>
                  </div>
                  <div className="grid gap-3 text-xs">
                    <div className="flex justify-between gap-3"><span className="text-slate-400">Pendapatan</span><span className="font-bold">{rupiah(month.revenue)}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-400">Biaya</span><span className="font-bold">{rupiah(month.expenses)}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-400">Net Income</span><span className={month.netIncome < 0 ? "font-black text-rose-600" : "font-black text-teal-700"}>{rupiah(month.netIncome)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
          <Card className="p-5">
            <h2 className="font-black">Ringkasan Active Client</h2>
            <p className="mb-5 text-xs text-slate-400">Distribusi scope kerja sama client aktif</p>
            <div className="space-y-3">
              {visibleActiveClients.map((client) => (
                <div key={client.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 text-sm dark:border-slate-800">
                  <div>
                    <p className="font-black">{client.brand}</p>
                    <p className="mt-1 text-xs text-slate-400">{client.cooperationScope || client.service}</p>
                  </div>
                  <Badge tone="teal">{rupiah(getClientValue(client))}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-black">Akumulasi 3 Bulan Terakhir</h2>
            <p className="mb-5 text-xs text-slate-400">Total pendapatan, biaya, dan net income dari {latestFinancialMonths.map((month) => month.month).join(", ")} {financial2026.year}</p>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800"><span className="font-semibold text-slate-500">Pendapatan</span><span className="font-black">{rupiah(financialSummary.revenue)}</span></div>
              <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800"><span className="font-semibold text-slate-500">Biaya</span><span className="font-black">{rupiah(financialSummary.expenses)}</span></div>
              <div className="flex justify-between"><span className="font-semibold text-slate-500">Net Income</span><span className={financialSummary.netIncome < 0 ? "font-black text-rose-600" : "font-black text-teal-700"}>{rupiah(financialSummary.netIncome)}</span></div>
            </div>
          </Card>
        </section>
      </>
    );
  }

  return (
    <>
      <Header title="Selamat pagi, Christopher" subtitle="Berikut ringkasan bisnis GrowthHive hari ini." />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon size={20} /></div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-2 text-xl font-black text-ink dark:text-white">{value}</p>
          </Card>
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card className="p-5">
          <h2 className="font-black">Tren Pendapatan</h2>
          <EmptyState title="Belum ada visualisasi pendapatan" description="Grafik bulanan akan tersedia setelah integrasi database dan pencatatan periode diaktifkan." />
        </Card>
        <Card className="p-5">
          <div className="mb-5 flex justify-between">
            <div>
              <h2 className="font-black">Ringkasan Pipeline</h2>
              <p className="text-xs text-slate-400">Prospek berdasarkan tahap CRM</p>
            </div>
            <Link href="/crm" className="text-xs font-bold text-teal-600">Lihat CRM</Link>
          </div>
          <div className="space-y-4">
            {stages.map((stage) => (
              <div key={stage} className="flex justify-between text-xs">
                <span className="font-semibold">{stage}</span>
                <Badge tone="slate">{clients.filter((client) => client.stage === stage).length}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="font-black">Follow-up & Task Terdekat</h2>
            <p className="text-xs text-slate-400">Prioritas dari CRM dan Project Hub berdasarkan tanggal terdekat</p>
          </div>
          <div className="flex gap-3">
            <Link href="/crm" className="text-xs font-bold text-teal-600">CRM</Link>
            <Link href="/client-management" className="text-xs font-bold text-teal-600">Project Hub</Link>
          </div>
        </div>
        {!upcomingItems.length ? (
          <EmptyState title="Belum ada follow-up atau task terjadwal" description="Isi tanggal follow-up di CRM atau deadline task di Project Hub agar muncul di dashboard." />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {upcomingItems.map((item) => {
              const Icon = item.icon;
              const distance = daysUntil(today, item.dueDate);
              return (
                <Link key={item.id} href={item.href} className="flex flex-wrap items-center gap-4 p-5 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={item.type === "Follow-up" ? "amber" : "teal"}>{item.type}</Badge>
                      <span className="text-xs font-bold text-slate-400">{item.dueDate}</span>
                    </div>
                    <p className="mt-2 truncate font-black text-ink dark:text-white">{item.title}</p>
                    <p className="mt-1 truncate text-xs text-slate-400">{item.context}</p>
                  </div>
                  <Badge tone={distance < 0 ? "red" : distance <= 1 ? "amber" : "slate"}>{dueLabel(today, item.dueDate)}</Badge>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
