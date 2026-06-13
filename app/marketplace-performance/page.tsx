"use client";

import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { MarketplaceBrandChart } from "@/components/marketplace-brand-chart";
import { Badge, Button, Card } from "@/components/ui";
import { marketplacePerformanceSource, shopeeBrands, type MarketplaceService } from "@/lib/marketplace-performance";
import { rupiah } from "@/lib/utils";
import { BarChart3, ExternalLink, MousePointerClick, Search, ShoppingBag, Target } from "lucide-react";
import { useMemo, useState } from "react";

const services: MarketplaceService[] = ["Shopee", "TikTok", "Meta Ads"];
const years = ["Semua", "2026", "2025"];
const number = (value: number) => new Intl.NumberFormat("id-ID").format(value);

export default function MarketplacePerformancePage() {
  const [service, setService] = useState<MarketplaceService>("Shopee");
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("Semua");
  const clients = useMemo(() => shopeeBrands.filter((item) => {
    const matchesQuery = !query || item.client.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (year === "Semua" || item.years[year]);
  }), [query, year]);
  const selectedData = clients.flatMap((client) => year === "Semua" ? Object.values(client.years).flat() : client.years[year] || []);
  const sales = selectedData.reduce((sum, item) => sum + item.sales, 0);
  const spend = selectedData.reduce((sum, item) => sum + item.adSpend, 0);
  const orders = selectedData.reduce((sum, item) => sum + item.orders, 0);

  return <>
    <Header title="Marketplace & Ads Performance" subtitle="Histori performa bulanan seluruh brand per layanan." />
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
          { label: "Blended ROAS", value: `${spend ? (sales / spend).toFixed(2) : "0.00"}x`, icon: BarChart3, color: "bg-teal-50 text-teal-700" },
          { label: "Total Orders", value: number(orders), icon: MousePointerClick, color: "bg-sky-50 text-sky-700" },
        ].map(({ label, value, icon: Icon, color }) => <Card key={label} className="p-5"><div className={`mb-5 grid h-11 w-11 place-items-center rounded-xl ${color}`}><Icon size={20} /></div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-xl font-black">{value}</p><p className="mt-2 text-xs text-slate-400">{year === "Semua" ? "Seluruh periode tersedia" : `Tahun ${year}`}</p></Card>)}
      </section>

      <div className="my-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari brand Shopee" className="w-44 bg-transparent text-sm outline-none" /></div>
          <select value={year} onChange={(event) => setYear(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-900">{years.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        <Badge tone="slate">{clients.length} brand terlist</Badge>
      </div>

      <div className="space-y-5">
        {clients.map((client) => {
          const availableYears = Object.keys(client.years).sort().reverse().filter((item) => year === "Semua" || item === year);
          return <Card key={client.client} className="overflow-hidden">
            <div className="border-b border-slate-100 p-5 dark:border-slate-800">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black">{client.client}</h2><p className="mt-1 text-xs text-slate-400">Shopee Ads · {Object.keys(client.years).sort().join("–")}</p></div><div className="flex gap-2">{availableYears.map((item) => <Badge key={item} tone="slate">{item}</Badge>)}</div></div>
            </div>
            <div className="space-y-6 p-5">
              {availableYears.map((item) => {
                const data = client.years[item];
                const yearSales = data.reduce((sum, month) => sum + month.sales, 0);
                const yearSpend = data.reduce((sum, month) => sum + month.adSpend, 0);
                const yearOrders = data.reduce((sum, month) => sum + month.orders, 0);
                return <section key={item}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="font-black">Performa {item}</h3><div className="flex flex-wrap gap-2"><Badge tone="teal">Sales {rupiah(yearSales)}</Badge><Badge tone="amber">Spend {rupiah(yearSpend)}</Badge><Badge tone="slate">ROAS {yearSpend ? (yearSales / yearSpend).toFixed(2) : "0.00"}x</Badge><Badge tone="slate">{number(yearOrders)} orders</Badge></div></div>
                  <MarketplaceBrandChart data={data} />
                  <div className="mt-3 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400"><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-teal-600" />Sales Ads</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-amber-500" />Ad Spend</span><span className="flex items-center gap-1"><i className="h-0.5 w-4 bg-blue-600" />ROAS</span></div>
                </section>;
              })}
            </div>
          </Card>;
        })}
      </div>
      {!clients.length && <Card><EmptyState title="Brand tidak ditemukan" description="Coba ubah pencarian atau filter tahun." /></Card>}
    </>}
  </>;
}
