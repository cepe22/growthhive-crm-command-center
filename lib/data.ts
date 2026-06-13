export const stages = [
  "Leads",
  "Discovery Call",
  "Pitching & Propose",
  "Negotiating & Dealing",
  "Agreement Signed",
  "Client (Active)",
  "Post-Client",
] as const;

export const clients = [
  { id: "1", brand: "Kopi Nusa", pic: "Andika Putra", industry: "FnB", stage: "Client (Active)", value: 18500000, service: "Meta Ads", owner: "Nadya", contract: "Aktif", initials: "KN", color: "bg-amber-100 text-amber-700" },
  { id: "2", brand: "Solace Studio", pic: "Mira Halim", industry: "Fitness & Wellness", stage: "Negotiating & Dealing", value: 12000000, service: "Social Media", owner: "Christopher", contract: "Belum Ditandatangani", initials: "SS", color: "bg-violet-100 text-violet-700" },
  { id: "3", brand: "Fleur Beauty", pic: "Sasha Dewi", industry: "Beauty & Skincare", stage: "Pitching & Propose", value: 22000000, service: "Marketing Consulting", owner: "Nadya", contract: "Belum Ditandatangani", initials: "FB", color: "bg-pink-100 text-pink-700" },
  { id: "4", brand: "Everyday Form", pic: "Raymond T.", industry: "Fashion", stage: "Discovery Call", value: 9500000, service: "Shopee Marketplace", owner: "Kevin", contract: "Belum Ditandatangani", initials: "EF", color: "bg-sky-100 text-sky-700" },
  { id: "5", brand: "Teras Rasa", pic: "Yulia Santoso", industry: "FnB", stage: "Leads", value: 0, service: "Meta Ads", owner: "Christopher", contract: "Belum Ditandatangani", initials: "TR", color: "bg-orange-100 text-orange-700" },
  { id: "6", brand: "Northstar Living", pic: "Bima Wijaya", industry: "Other", stage: "Agreement Signed", value: 15000000, service: "Social Media", owner: "Kevin", contract: "Aktif", initials: "NL", color: "bg-emerald-100 text-emerald-700" },
] as const;

export const invoices = [
  { no: "008/VI/GHI/26", client: "Kopi Nusa", date: "10 Jun 2026", due: "17 Jun 2026", amount: 18500000, status: "Terkirim" },
  { no: "007/VI/GHI/26", client: "Northstar Living", date: "02 Jun 2026", due: "09 Jun 2026", amount: 15000000, status: "Jatuh Tempo" },
  { no: "006/V/GHI/26", client: "Fleur Beauty", date: "24 Mei 2026", due: "31 Mei 2026", amount: 22000000, status: "Lunas" },
  { no: "005/V/GHI/26", client: "Solace Studio", date: "18 Mei 2026", due: "25 Mei 2026", amount: 12000000, status: "Lunas" },
] as const;

export const expenses = [
  { date: "12 Jun 2026", description: "Langganan tools marketing", category: "Tools & Subscriptions", amount: 2450000 },
  { date: "08 Jun 2026", description: "Gaji tim freelance", category: "Team Salary", amount: 8500000 },
  { date: "04 Jun 2026", description: "Operasional kantor", category: "Operational", amount: 1850000 },
] as const;
