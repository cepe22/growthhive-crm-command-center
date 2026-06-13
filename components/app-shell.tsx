"use client";

import { usePathname } from "next/navigation";
import { AppDataProvider } from "./app-data";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;
  return <AppDataProvider><Sidebar/><main className="min-h-screen p-5 lg:ml-64 lg:p-8">{children}</main></AppDataProvider>;
}
