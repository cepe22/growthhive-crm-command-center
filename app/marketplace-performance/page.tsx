"use client";

import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { Badge, Button, Card } from "@/components/ui";
import { marketplacePerformanceSource, shopeePerformance, type MarketplaceService } from "@/lib/marketplace-performance";
import { rupiah } from "@/lib/utils";
import { BarChart3, ExternalLink, MousePointerClick, Search, ShoppingBag, Target } from "lucide-react";
import { useMemo, useState } from "react";

const services: MarketplaceService[] = ["Shopee", "TikTok", "Meta Ads"];
const number = (value: number) => new Intl.NumberFormat("id-ID").format(value);

export default function MarketplacePerformancePage() {
  const [service, setService] = useState<MarketplaceService>("Shopee");
  const [query, setQuery] = useState("");
  const clients = useMemo(() => shopeePerformance.filter((item) => !query || item.client.toLowerCase().includes(query.toLowerCase())), [query]);
  const sales = shopeePerformance.reduce((sum, item) => sum + item.sales, 0);
  const spend = shopeePerformance.reduce((sum, item) => sum + item.adSpend, 0);
  const orders = shopeePerformance.reduce((sum, item) => sum + item.orders, 0);

  return <>
    <Header title="Marketplace & Ads Performance" subtitle="Pantau performa campaign per layanan dan per client." />
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {services.map((item) => <button key={item} onClick={() => setService(item)} className={`rounded-lg px-4 py-2 text-xs font-bold ${service === item ? "bg-teal-50 text-teal-700 dark:bg-teal-950" : "text-slate-400"}`}>{item}</button>)}
      </div>
      <a href={marketplacePerformanceSource} target="_blank" rel="noreferrer"><Button variant="outline"><ExternalLink size={15} />Buka data sumber</Button></a>
    </div>

    {service !== "Shopee" ? <Card><EmptyState title={`Data ${service} belum tersedia`} description={`Struktur dashboard ${service} sudah siap. Tambahkan spreadsheet performa untuk mulai menampilkan data client.`} /></Card> : <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Sales dari Ads", value: rupiah(sales), icon: ShoppingBag, color: "bg-orange-50 text-orange-700" },
          { label: "Total Ad Spend", value: rupiah(spend), icon: Target, color: "bg-rose-50 text-rose-700" },
          { label: "Blended ROAS", value: `${(sales / spend).toFixed(2)}x`, icon: BarChart3, color: "bg-teal-50 text-teal-700" },
          { label: "Total Orders", value: number(orders), icon: MousePointerClick, color: "bg-sky-50 text-sky-700" },
        ].map(({ label, value, icon: Icon, color }) => <Card key={label} className="p-5"><div className={`mb-5 grid h-11 w-11 place-items-center rounded-xl ${color}`}><Icon size={20} /></div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-xl font-black">{value}</p><p className="mt-2 text-xs text-slate-400">Snapshot Mei 2026</p></Card>)}
      </section>

      <div className="my-5 flex items-center justify-between gap-3">
        <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari client Shopee" className="w-44 bg-transparent text-sm outline-none" /></div>
        <Badge tone="slate">{clients.length} client · Mei 2026</Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {clients.map((client) => <Card key={client.client} className="p-5">
          <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="font-black">{client.client}</h2><p className="mt-1 text-xs text-slate-400">Shopee Ads · {client.period}</p></div><Badge tone={client.roas >= 5 ? "teal" : client.roas >= 3 ? "amber" : "red"}>ROAS {client.roas.toFixed(2)}x</Badge></div>
          <div className="grid grid-cols-2 gap-3">
            {[["Sales Ads", rupiah(client.sales)], ["Ad Spend", rupiah(client.adSpend)], ["Orders", number(client.orders)], ["Items Sold", number(client.itemsSold)], ["Impressions", number(client.impressions)], ["Clicks", number(client.clicks)], ["CTR", `${client.ctr.toFixed(2)}%`], ["AOV", rupiah(client.aov)]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>)}
          </div>
          <div className="mt-4"><div className="mb-1 flex justify-between text-[10px] font-bold text-slate-400"><span>ROAS efficiency</span><span>{client.roas.toFixed(2)}x</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.min(100, client.roas / 10 * 100)}%` }} /></div></div>
        </Card>)}
      </div>
      {!clients.length && <Card><EmptyState title="Client tidak ditemukan" description="Coba gunakan nama client Shopee yang lain." /></Card>}
    </>}
  </>;
}
