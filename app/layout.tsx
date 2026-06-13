import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = { title: "GrowthHive OS", description: "CRM, invoice, dan finance management" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning><body><Providers><AppShell>{children}</AppShell></Providers></body></html>;
}
