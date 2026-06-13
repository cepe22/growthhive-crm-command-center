import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = { title: "GrowthHive OS", description: "CRM, invoice, dan finance management" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning><body><Providers><Sidebar/><main className="min-h-screen p-5 lg:ml-64 lg:p-8">{children}</main></Providers></body></html>;
}
