export type ContractStatus = "Aktif" | "Bulanan" | "Perlu diperbarui" | "Periode belum diisi";

export type ClientProject = {
  scope: string;
  monthlyFee?: number;
  feeNote?: string;
};

export type ManagedClient = {
  brand: string;
  projects: ClientProject[];
  contractPeriod?: string;
  status: ContractStatus;
  notes?: string;
};

export const clientContractSource =
  "https://docs.google.com/spreadsheets/d/1Ty2vlG7Uhz2IZka0t_xYjYPOcey10rL3dtVEU7ilpp8/edit";

export const managedClients: ManagedClient[] = [
  {
    brand: "Blanche",
    projects: [
      { scope: "Meta Ads Management", monthlyFee: 1_500_000 },
      { scope: "Shopee Ads Management", monthlyFee: 1_650_000 },
    ],
    contractPeriod: "Agt 2025 - Jan 2026",
    status: "Perlu diperbarui",
  },
  {
    brand: "MyBestie",
    projects: [{ scope: "Shopee Ads Management", monthlyFee: 1_750_000 }],
    contractPeriod: "Okt 2025 - Mar 2026",
    status: "Perlu diperbarui",
    notes: "Deposit 1 bulan",
  },
  {
    brand: "Surin",
    projects: [{ scope: "Meta Ads Management", monthlyFee: 4_500_000 }],
    contractPeriod: "Diperbarui setiap bulan",
    status: "Bulanan",
  },
  {
    brand: "Ayam Geybok Bang Jarwo",
    projects: [
      { scope: "Social Media Agency", monthlyFee: 8_000_000 },
      { scope: "Meta Ads Management", monthlyFee: 2_500_000 },
    ],
    contractPeriod: "Diperbarui setiap bulan",
    status: "Bulanan",
  },
  {
    brand: "Chronos Time",
    projects: [{ scope: "Meta Ads Management", monthlyFee: 2_000_000 }],
    contractPeriod: "Nov 2025 - Jan 2026",
    status: "Perlu diperbarui",
    notes: "Deposit 1 bulan",
  },
  {
    brand: "Verdant Tech",
    projects: [{ scope: "Shopee Ads Management", monthlyFee: 1_750_000 }],
    contractPeriod: "Apr - Sep 2026",
    status: "Aktif",
    notes: "Deposit 1 bulan",
  },
  {
    brand: "McDonat",
    projects: [
      { scope: "Marketing Consulting", feeNote: "5% dari net profit cabang" },
      { scope: "Meta Ads Management" },
    ],
    status: "Periode belum diisi",
  },
  {
    brand: "Miumi",
    projects: [{ scope: "Shopee Ads Management", monthlyFee: 1_850_000 }],
    status: "Periode belum diisi",
  },
  {
    brand: "Sabilla",
    projects: [{ scope: "Shopee Ads Management", monthlyFee: 1_800_000 }],
    status: "Periode belum diisi",
  },
  {
    brand: "YOUMEI",
    projects: [{ scope: "Shopee Ads Management", monthlyFee: 2_000_000 }],
    status: "Periode belum diisi",
    notes: "Deposit 1 bulan; tambahan 2% total omzet, minimum Rp2 juta",
  },
  {
    brand: "Geprek Bakar Melcis",
    projects: [{ scope: "Social Media Agency", monthlyFee: 5_750_000 }],
    status: "Periode belum diisi",
    notes: "Deposit 1 bulan",
  },
  {
    brand: "King Ayamku",
    projects: [{ scope: "Social Media Agency", monthlyFee: 1_500_000 }],
    status: "Periode belum diisi",
    notes: "DP Rp750 ribu; perkiraan mulai Juli 2026",
  },
  {
    brand: "Beyond Jeans",
    projects: [{ scope: "Shopee Ads Management", monthlyFee: 1_750_000 }],
    contractPeriod: "Apr - Sep 2026",
    status: "Aktif",
    notes: "Deposit 1 bulan",
  },
];

export const knownMonthlyFee = managedClients.reduce(
  (total, client) => total + client.projects.reduce((sum, project) => sum + (project.monthlyFee || 0), 0),
  0,
);

export const activeProjectCount = managedClients.reduce((total, client) => total + client.projects.length, 0);
