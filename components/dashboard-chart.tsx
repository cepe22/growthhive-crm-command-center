"use client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const data = [{ month: "Jan", revenue: 42 }, { month: "Feb", revenue: 58 }, { month: "Mar", revenue: 51 }, { month: "Apr", revenue: 68 }, { month: "Mei", revenue: 76 }, { month: "Jun", revenue: 92 }];
export function DashboardChart() {
  return <ResponsiveContainer width="100%" height={230}><AreaChart data={data} margin={{ left: -25, right: 8, top: 10 }}><defs><linearGradient id="tealFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0D9488" stopOpacity={.25}/><stop offset="95%" stopColor="#0D9488" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }}/><Tooltip formatter={(v) => [`Rp${v} jt`, "Pendapatan"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}/><Area type="monotone" dataKey="revenue" stroke="#0D9488" strokeWidth={3} fill="url(#tealFill)"/></AreaChart></ResponsiveContainer>;
}
