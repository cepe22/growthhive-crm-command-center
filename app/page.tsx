"use client";

import { useAppData } from "@/components/app-data";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { Badge, Card } from "@/components/ui";
import { getUserAccess } from "@/lib/auth";
import { getClientProjects, getClientValue, stages } from "@/lib/data";
import type { TeamMember } from "@/lib/client-projects";
import { rupiah } from "@/lib/utils";
import { BriefcaseBusiness, CircleDollarSign, Clock3, CreditCard, ListChecks, PhoneCall, ReceiptText, UsersRound } from "lucide-react";
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
  const currentMember = teamMembers.find((member) => member.email.toLowerCase() === email.toLowerCase()) || (access === "admin" ? teamMembers[0] : undefined);
  const allowedProjectKeywords = access === "admin" ? [] : memberProjectKeywords(currentMember);
  const canSeeProjectName = (projectName: string) => access === "admin" || textMatchesKeywords(projectName, allowedProjectKeywords);
  const visibleActiveClients = clients.filter((client) => client.stage === "Client (Active)" && (access === "admin" || getClientProjects(client).some((project) => canSeeProjectName(`${project.name} ${project.scope || ""}`))));
  const visibleProjectTasks = projectTasks.filter((task) => {
    if (access === "admin") return true;
    if (!currentMember) return false;
    if ([task.assigneeId, task.assignedById, task.watcherId].includes(currentMember.id)) return true;
    return canSeeProjectName(task.project);
  });
  const total = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paid = invoices.filter((invoice) => invoice.status === "Lunas").reduce((sum, invoice) => sum + invoice.amount, 0);
  const openPipeline = clients.filter((client) => !["Client (Active)", "Post-Client"].includes(client.stage)).reduce((sum, client) => sum + getClientValue(client), 0);
  const visibleActiveProjects = visibleProjectTasks.filter((task) => task.status !== "Done").length;
  const today = new Date().toISOString().slice(0, 10);
  const acceptedEvents = calendarEvents.filter((event) => Object.values(event.responses).some((response) => response === "Accepted")).length;
  const activeClients = visibleActiveClients.length;
  const visibleReimbursements = access === "admin" ? reimbursements : reimbursements.filter((item) => item.requesterEmail === email);
  const pendingReimbursements = visibleReimbursements.filter((item) => ["Diajukan", "Diproses", "Disetujui"].includes(item.status)).length;
  const stats = [
    { label: "Task Aktif", value: String(visibleActiveProjects), icon: BriefcaseBusiness },
    { label: "CRM Pipeline", value: rupiah(openPipeline), icon: CreditCard },
    { label: "Event Disetujui", value: String(acceptedEvents), icon: CircleDollarSign },
    { label: "Belum Terbayar", value: rupiah(total - paid), icon: Clock3 },
  ];
  const teamStats = [
    { label: "Task Aktif", value: String(visibleActiveProjects), icon: BriefcaseBusiness },
    { label: "Active Client", value: String(activeClients), icon: UsersRound },
    { label: "Event Disetujui", value: String(acceptedEvents), icon: CircleDollarSign },
    { label: "Reimbursement Proses", value: String(pendingReimbursements), icon: ReceiptText },
  ];

  const upcomingItems = [
    ...clients
      .filter((client) => client.dueDate && client.nextAction)
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

  const teamUpcomingItems = upcomingItems.filter((item) => item.type === "Task");

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
                <h2 className="font-black">Task Terdekat</h2>
                <p className="text-xs text-slate-400">Prioritas dari Project Hub berdasarkan deadline</p>
              </div>
              <Link href="/client-management" className="text-xs font-bold text-teal-600">Project Hub</Link>
            </div>
            {!teamUpcomingItems.length ? (
              <EmptyState title="Belum ada task terjadwal" description="Task dari Project Hub akan muncul di sini ketika memiliki deadline." />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {teamUpcomingItems.map((item) => {
                  const Icon = item.icon;
                  const distance = daysUntil(today, item.dueDate);
                  return (
                    <Link key={item.id} href={item.href} className="flex flex-wrap items-center gap-4 p-5 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700"><Icon size={18} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="teal">Task</Badge>
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
