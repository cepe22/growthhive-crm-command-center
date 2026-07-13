import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authCookies, getUserAccess, isAdminEmail, verifySessionToken } from "@/lib/auth";
import { teamMembers, type ProjectTask, type TaskNotification } from "@/lib/client-projects";

type SharedPayload = {
  tasks?: ProjectTask[];
  notifications?: TaskNotification[];
  taskIds?: string[];
  notificationIds?: string[];
};

function sharedConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const syncToken = process.env.GH_TASK_SYNC_TOKEN;
  if (!url || !apiKey || !syncToken) return null;
  return { url, apiKey, syncToken };
}

async function sharedRequest(path: string, init?: RequestInit) {
  const config = sharedConfig();
  if (!config) throw new Error("Shared task database belum dikonfigurasi.");
  return fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: config.apiKey,
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "x-gh-sync-token": config.syncToken,
      ...(init?.headers || {}),
    },
  });
}

async function requireUser() {
  return verifySessionToken(cookies().get(authCookies.session)?.value);
}

function memberIdForEmail(email: string) {
  return teamMembers.find((member) => member.email.toLowerCase() === email.toLowerCase())?.id;
}

function canWriteTask(email: string, task: ProjectTask) {
  if (isAdminEmail(email)) return true;
  const memberId = memberIdForEmail(email);
  return Boolean(memberId && [task.assignedById, task.assigneeId, task.watcherId].includes(memberId));
}

async function readRows<T>(table: string): Promise<T[]> {
  const response = await sharedRequest(`${table}?select=payload&order=updated_at.desc`);
  if (!response.ok) throw new Error(await response.text());
  const rows = (await response.json()) as Array<{ payload: T }>;
  return rows.map((row) => row.payload);
}

export async function GET() {
  const email = await requireUser();
  if (!email) return NextResponse.json({ error: "Session tidak valid." }, { status: 401 });
  if (getUserAccess(email) === "finance_readonly") return NextResponse.json({ error: "Akun ini tidak memiliki akses Project Hub." }, { status: 403 });
  try {
    const [tasks, notifications] = await Promise.all([
      readRows<ProjectTask>("gh_project_tasks"),
      readRows<TaskNotification>("gh_task_notifications"),
    ]);
    return NextResponse.json({ tasks, notifications });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal membaca task bersama." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const email = await requireUser();
  if (!email) return NextResponse.json({ error: "Session tidak valid." }, { status: 401 });
  if (!["admin", "team"].includes(getUserAccess(email) || "")) return NextResponse.json({ error: "Akun ini hanya memiliki akses baca." }, { status: 403 });
  const payload = (await request.json()) as SharedPayload;
  const requestedTasks = Array.isArray(payload.tasks) ? payload.tasks.filter((task) => task?.id).slice(0, 500) : [];
  let tasks: ProjectTask[] = [];
  const notifications = Array.isArray(payload.notifications) ? payload.notifications.filter((item) => item?.id).slice(0, 2000) : [];
  const updatedAt = new Date().toISOString();
  try {
    if (requestedTasks.length) {
      const response = await sharedRequest(`gh_project_tasks?id=in.(${requestedTasks.map((task) => encodeURIComponent(task.id)).join(",")})&select=payload`);
      if (!response.ok) throw new Error(await response.text());
      const rows = (await response.json()) as Array<{ payload: ProjectTask }>;
      const existingTasks = new Map(rows.map((row) => [row.payload.id, row.payload]));
      const memberId = memberIdForEmail(email);
      tasks = requestedTasks.filter((task) => {
        const existing = existingTasks.get(task.id);
        if (existing) return canWriteTask(email, existing);
        return isAdminEmail(email) || Boolean(memberId && task.assignedById === memberId);
      });
    }
    if (tasks.length) {
      const response = await sharedRequest("gh_project_tasks?on_conflict=id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(tasks.map((task) => ({ id: task.id, payload: task, updated_at: updatedAt }))),
      });
      if (!response.ok) throw new Error(await response.text());
    }
    if (notifications.length) {
      const response = await sharedRequest("gh_task_notifications?on_conflict=id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(notifications.map((notification) => ({ id: notification.id, payload: notification, updated_at: updatedAt }))),
      });
      if (!response.ok) throw new Error(await response.text());
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal menyimpan task bersama." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const email = await requireUser();
  if (!email) return NextResponse.json({ error: "Session tidak valid." }, { status: 401 });
  if (!["admin", "team"].includes(getUserAccess(email) || "")) return NextResponse.json({ error: "Akun ini hanya memiliki akses baca." }, { status: 403 });
  const payload = (await request.json()) as SharedPayload;
  const requestedTaskIds = Array.isArray(payload.taskIds) ? payload.taskIds.filter(Boolean).slice(0, 500) : [];
  const notificationIds = Array.isArray(payload.notificationIds) ? payload.notificationIds.filter(Boolean).slice(0, 2000) : [];
  try {
    let taskIds: string[] = [];
    if (requestedTaskIds.length) {
      const response = await sharedRequest(`gh_project_tasks?id=in.(${requestedTaskIds.map(encodeURIComponent).join(",")})&select=payload`);
      if (!response.ok) throw new Error(await response.text());
      const rows = (await response.json()) as Array<{ payload: ProjectTask }>;
      taskIds = rows.map((row) => row.payload).filter((task) => isAdminEmail(email) || task.assignedById === memberIdForEmail(email)).map((task) => task.id);
    }
    if (taskIds.length) {
      const response = await sharedRequest(`gh_project_tasks?id=in.(${taskIds.map(encodeURIComponent).join(",")})`, { method: "DELETE" });
      if (!response.ok) throw new Error(await response.text());
    }
    if (notificationIds.length && isAdminEmail(email)) {
      const response = await sharedRequest(`gh_task_notifications?id=in.(${notificationIds.map(encodeURIComponent).join(",")})`, { method: "DELETE" });
      if (!response.ok) throw new Error(await response.text());
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal menghapus task bersama." }, { status: 503 });
  }
}
