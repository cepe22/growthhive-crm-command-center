"use client";

import type { MonthlyPerformance } from "@/lib/marketplace-performance";
import { rupiah } from "@/lib/utils";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function MarketplaceBrandChart({ data }: { data: MonthlyPerformance[] }) {
  return <ResponsiveContainer width="100%" height={260}><ComposedChart data={data} margin={{ top: 12, right: 10, left: 4 }}>
    <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
    <YAxis yAxisId="money" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(value) => `${Math.round(value / 1_000_000)}jt`} />
    <YAxis yAxisId="roas" orientation="right" domain={[0, "auto"]} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(value) => `${value}x`} />
    <Tooltip formatter={(value: number, name: string) => [name === "roas" ? `${value.toFixed(2)}x` : rupiah(value), name === "sales" ? "Sales Ads" : name === "adSpend" ? "Ad Spend" : "ROAS"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
    <Bar yAxisId="money" dataKey="sales" fill="#0d9488" radius={[5, 5, 0, 0]} />
    <Bar yAxisId="money" dataKey="adSpend" fill="#f59e0b" radius={[5, 5, 0, 0]} />
    <Line yAxisId="roas" type="monotone" dataKey="roas" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />
  </ComposedChart></ResponsiveContainer>;
}
