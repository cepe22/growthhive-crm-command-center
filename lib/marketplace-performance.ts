export type MarketplaceService = "Shopee" | "TikTok" | "Meta Ads";

export type ShopeePerformance = {
  client: string;
  period: string;
  sales: number;
  adSpend: number;
  impressions: number;
  clicks: number;
  orders: number;
  itemsSold: number;
  roas: number;
  ctr: number;
  aov: number;
};

export const marketplacePerformanceSource =
  "https://docs.google.com/spreadsheets/d/1ZzzEWdpG4_1nl7GODJgTFftjiX0_7rJW67Ml1LNE898/edit";

export const shopeePerformance: ShopeePerformance[] = [
  { client: "Beyond Jeans", period: "Mei 2026", sales: 10_600_000, adSpend: 2_400_000, impressions: 134_600, clicks: 4_800, orders: 52, itemsSold: 57, roas: 4.42, ctr: 3.57, aov: 203_342 },
  { client: "Blanche", period: "Mei 2026", sales: 41_500_000, adSpend: 5_800_000, impressions: 470_900, clicks: 20_200, orders: 136, itemsSold: 157, roas: 7.16, ctr: 4.29, aov: 335_280 },
  { client: "Miumi", period: "Mei 2026", sales: 98_300_000, adSpend: 11_800_000, impressions: 1_100_000, clicks: 45_100, orders: 707, itemsSold: 912, roas: 8.33, ctr: 4.10, aov: 107_785 },
  { client: "Sabilla", period: "Mei 2026", sales: 56_700_000, adSpend: 6_100_000, impressions: 702_400, clicks: 30_600, orders: 837, itemsSold: 1_200, roas: 9.30, ctr: 4.36, aov: 47_250 },
  { client: "Verdant Tech", period: "Mei 2026", sales: 41_100_000, adSpend: 13_900_000, impressions: 778_500, clicks: 21_500, orders: 1_364, itemsSold: 1_645, roas: 2.96, ctr: 2.76, aov: 31_142 },
  { client: "MyBestie", period: "Mei 2026", sales: 16_500_000, adSpend: 4_400_000, impressions: 309_100, clicks: 12_300, orders: 78, itemsSold: 105, roas: 3.75, ctr: 3.98, aov: 218_817 },
];
