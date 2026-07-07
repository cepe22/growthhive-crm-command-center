export const stages = [
  "Leads",
  "Discovery Call",
  "Pitching & Propose",
  "Negotiating & Dealing",
  "Agreement Signed",
  "Client (Active)",
  "Post-Client",
] as const;

export type Stage = (typeof stages)[number];

export type ClientProject = {
  id: string;
  name: string;
  scope?: string;
  monthlyFee?: number;
  feeNote?: string;
  deposit?: string;
  contractPeriod?: string;
  contractLink?: string;
  notes?: string;
};

export type Client = {
  id: string;
  brand: string;
  pic: string;
  industry: string;
  stage: Stage;
  value: number;
  service: string;
  services?: string[];
  projects?: ClientProject[];
  cooperationScope?: string;
  source?: string;
  priority?: "High" | "Medium" | "Low";
  probability?: number;
  owner?: string;
  nextAction?: string;
  dueDate?: string;
  projectStart?: string;
  health?: "Green" | "Amber" | "Red";
  notes?: string;
};

export function totalProjectValue(projects: ClientProject[]) {
  return projects.reduce((sum, project) => sum + (project.monthlyFee || 0), 0);
}

export function getClientProjects(client: Client): ClientProject[] {
  if (client.projects?.length) return client.projects;
  const names = client.services?.length ? client.services : client.service.split(",").map((service) => service.trim()).filter(Boolean);
  return names.map((name, index) => ({
    id: `${client.id}-project-${index}`,
    name,
    scope: client.cooperationScope || name,
    monthlyFee: index === 0 ? client.value : 0,
  }));
}

export function getClientValue(client: Client) {
  const projectValue = totalProjectValue(getClientProjects(client));
  return projectValue || client.value || 0;
}

function activeClient(input: Omit<Client, "stage" | "value" | "service" | "services" | "probability" | "health" | "source" | "owner"> & { projects: ClientProject[] }): Client {
  const services = input.projects.map((project) => project.name);
  return {
    ...input,
    stage: "Client (Active)",
    value: totalProjectValue(input.projects),
    service: services.join(", "),
    services,
    source: "GH Client & Potential",
    probability: 100,
    owner: "GH",
    health: "Green",
  };
}

export const activeGhClients: Client[] = [
  activeClient({
    id: "gh-client-blanche",
    brand: "Blanche",
    pic: "-",
    industry: "Other",
    cooperationScope: "Meta Ads Management; Shopee Ads Management",
    projects: [
      { id: "gh-project-blanche-meta", name: "Meta Ads Management", scope: "Meta Ads Management", monthlyFee: 1500000, contractPeriod: "Agt 2025 - Jan 2026" },
      { id: "gh-project-blanche-shopee", name: "Shopee Ads Management", scope: "Shopee Ads Management", monthlyFee: 1650000, contractPeriod: "Agt 2025 - Jan 2026" },
    ],
  }),
  activeClient({
    id: "gh-client-mybestie",
    brand: "MyBestie",
    pic: "-",
    industry: "Other",
    cooperationScope: "Shopee Ads Management",
    notes: "Deposit 1 bulan",
    projects: [
      { id: "gh-project-mybestie-shopee", name: "Shopee Ads Management", scope: "Shopee Ads Management", monthlyFee: 1750000, contractPeriod: "Okt 2025 - Mar 2026", notes: "Deposit 1 bulan" },
    ],
  }),
  activeClient({
    id: "gh-client-surin",
    brand: "Surin",
    pic: "-",
    industry: "Other",
    cooperationScope: "Meta Ads Management",
    nextAction: "Follow up status kerja sama",
    projects: [
      { id: "gh-project-surin-meta", name: "Meta Ads Management", scope: "Meta Ads Management", monthlyFee: 4500000, deposit: "-", contractPeriod: "No contract, renewed every month" },
    ],
  }),
  activeClient({
    id: "gh-client-ayam-geybok-bang-jarwo",
    brand: "Ayam Geybok Bang Jarwo",
    pic: "-",
    industry: "FnB",
    cooperationScope: "Social Media Agency; Meta Ads Management",
    nextAction: "Output bulanan: 7 video dan 8 feeds",
    projects: [
      { id: "gh-project-agbj-social", name: "Social Media Agency", scope: "Social Media Agency", monthlyFee: 8000000, deposit: "-", contractPeriod: "No contract, renewed every month" },
      { id: "gh-project-agbj-meta", name: "Meta Ads Management", scope: "Meta Ads Management", monthlyFee: 2500000, deposit: "-", contractPeriod: "No contract, renewed every month" },
    ],
  }),
  activeClient({
    id: "gh-client-chronos-time",
    brand: "Chronos Time",
    pic: "-",
    industry: "Other",
    cooperationScope: "Meta Ads Management",
    notes: "Deposit 1 bulan",
    projects: [
      { id: "gh-project-chronos-meta", name: "Meta Ads Management", scope: "Meta Ads Management", monthlyFee: 2000000, contractPeriod: "Nov 2025 - Jan 2026", notes: "Deposit 1 bulan" },
    ],
  }),
  activeClient({
    id: "gh-client-verdant-tech",
    brand: "Verdant Tech",
    pic: "-",
    industry: "Other",
    cooperationScope: "Shopee Ads Management",
    notes: "Deposit 1 bulan",
    projects: [
      { id: "gh-project-verdant-shopee", name: "Shopee Ads Management", scope: "Shopee Ads Management", monthlyFee: 1750000, contractPeriod: "Apr - Sep 2026", notes: "Deposit 1 bulan" },
    ],
  }),
  activeClient({
    id: "gh-client-mcdonat",
    brand: "McDonat",
    pic: "-",
    industry: "FnB",
    cooperationScope: "Marketing Consulting; Meta Ads Management",
    notes: "Sudah kasih invoice",
    projects: [
      { id: "gh-project-mcdonat-consulting", name: "Marketing Consulting", scope: "Marketing Consulting", feeNote: "5% dari net profit cabang" },
      { id: "gh-project-mcdonat-meta", name: "Meta Ads Management", scope: "Meta Ads Management", feeNote: "5% dari net profit cabang" },
    ],
  }),
  activeClient({
    id: "gh-client-miumi",
    brand: "Miumi",
    pic: "-",
    industry: "Other",
    cooperationScope: "Shopee Ads Management",
    projects: [
      { id: "gh-project-miumi-shopee", name: "Shopee Ads Management", scope: "Shopee Ads Management", monthlyFee: 1850000 },
    ],
  }),
  activeClient({
    id: "gh-client-geprek-bakar-melcis",
    brand: "Geprek Bakar Melcis",
    pic: "-",
    industry: "FnB",
    cooperationScope: "Social Media Agency",
    notes: "Deposit 1 bulan",
    nextAction: "Output bulanan: 10 konten, terdiri dari 4 video shoot, 4 feed, dan 2 video motion graphic",
    projects: [
      { id: "gh-project-melcis-social", name: "Social Media Agency", scope: "Social Media Agency", monthlyFee: 5750000, notes: "Deposit 1 bulan" },
    ],
  }),
  activeClient({
    id: "gh-client-king-ayamku",
    brand: "King Ayamku",
    pic: "-",
    industry: "FnB",
    cooperationScope: "Social Media Agency",
    notes: "Sudah DP, perkiraan berjalan",
    nextAction: "Output bulanan: 11 konten, terdiri dari 6 single feed, 3 feed carousel, dan 2 video animasi/motion graphic",
    projects: [
      { id: "gh-project-king-ayamku-social", name: "Social Media Agency", scope: "Social Media Agency", monthlyFee: 1500000, notes: "Sudah DP, perkiraan berjalan" },
    ],
  }),
  activeClient({
    id: "gh-client-beyond-jeans",
    brand: "Beyond Jeans",
    pic: "-",
    industry: "Fashion",
    cooperationScope: "Shopee Ads Management",
    notes: "Deposit 1 bulan",
    projects: [
      { id: "gh-project-beyond-jeans-shopee", name: "Shopee Ads Management", scope: "Shopee Ads Management", monthlyFee: 1750000, contractPeriod: "Apr - Sep 2026", notes: "Deposit 1 bulan" },
    ],
  }),
];

export type Invoice = {
  id: string;
  no: string;
  client: string;
  date: string;
  due: string;
  amount: number;
  description?: string;
  discount?: number;
  taxRate?: number;
  status: "Draft" | "Terkirim" | "Lunas" | "Jatuh Tempo";
};

export type Expense = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
};

export type ReimbursementStatus = "Diajukan" | "Diproses" | "Disetujui" | "Ditolak" | "Dibayar";

export type Reimbursement = {
  id: string;
  requesterEmail: string;
  requesterName: string;
  date: string;
  category: string;
  project?: string;
  client?: string;
  amount: number;
  description: string;
  receiptLink?: string;
  status: ReimbursementStatus;
  submittedAt: string;
  notes?: string;
};

export const clients: Client[] = activeGhClients;
export const invoices: Invoice[] = [];
export const expenses: Expense[] = [];
export const reimbursements: Reimbursement[] = [];
