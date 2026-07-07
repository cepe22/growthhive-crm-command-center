export type FinancialReport = {
  year: string; status: string; source: string; sourceUrl: string; period: string;
  revenue: number; costOfRevenue: number; operatingExpenses: number; totalExpenses: number; operatingProfit: number; tax: number; netIncome: number; netMargin: number;
  months: { month: string; revenue: number; expenses: number; netIncome: number }[];
  expenseCategories: { label: string; amount: number }[];
  balanceSheet: { cash: number; receivables: number; prepaidTax: number; totalAssets: number; taxPayable: number; capital: number; currentProfit: number; retainedEarnings?: number; unearnedRevenue?: number; dividend?: number; totalLiabilitiesEquity: number };
};

export const financial2024: FinancialReport = {
  year:"2024",status:"Final",source:"Reporting GHI 2024.xlsx",sourceUrl:"https://docs.google.com/spreadsheets/d/183_4vBAA1LWjKj4EF3KRwv_1BUDn2h5t/edit",period:"Februari - Desember 2024",
  revenue:973360094,costOfRevenue:53271982,operatingExpenses:796855877,totalExpenses:850127859,operatingProfit:123232235,tax:4966799.96,netIncome:118265435.04,netMargin:.1215022434,
  months:[{month:"Feb",revenue:60229592,expenses:55738711,netIncome:4189733.04},{month:"Mar",revenue:64311223,expenses:58436749,netIncome:5552918},{month:"Apr",revenue:67440475,expenses:60155791,netIncome:6947482},{month:"Mei",revenue:72262284,expenses:63041571,netIncome:8859402},{month:"Jun",revenue:94493896,expenses:72779841,netIncome:21241586},{month:"Jul",revenue:102906119,expenses:82066774,netIncome:20324814},{month:"Agu",revenue:91644897,expenses:89809715,netIncome:1333590},{month:"Sep",revenue:97168366,expenses:95449056,netIncome:1067601},{month:"Okt",revenue:122743040,expenses:103885333,netIncome:18353226},{month:"Nov",revenue:117305100,expenses:93825391,netIncome:22897418},{month:"Des",revenue:82855102,expenses:74938927,netIncome:7497665}],
  expenseCategories:[{label:"Biaya Gaji",amount:639392500},{label:"Professional Fee",amount:78925011},{label:"Biaya Produksi",amount:46171982},{label:"Tunjangan PPh 21",amount:45941350},{label:"Transportasi & Perjalanan Dinas",amount:13592631},{label:"Biaya Talent",amount:7100000},{label:"Entertainment",amount:5624082},{label:"Biaya Sewa",amount:4000000},{label:"Meeting",amount:3671803},{label:"Iklan & Promosi",amount:3000000},{label:"THR",amount:1670000},{label:"Training",amount:625000},{label:"Administrasi Bank",amount:413500}],
  balanceSheet:{cash:78351594,receivables:25690896,prepaidTax:4866800,totalAssets:108909290,taxPayable:-3140778,capital:33917833,currentProfit:123132235,dividend:-45000000,totalLiabilitiesEquity:108909290},
};

export const financial2025: FinancialReport = {
  year:"2025",status:"Final",source:"Reporting GHI 2025.xlsx",sourceUrl:"https://docs.google.com/spreadsheets/d/1_dwdrgsRVc-RbHUedGGb-QjzJCReDQZL/edit",period:"Januari - Desember 2025",
  revenue:867659544,costOfRevenue:31556500,operatingExpenses:837280822,totalExpenses:868837322,operatingProfit:-1177778,tax:4338297,netIncome:-5516075,netMargin:-.0063574187,
  months:[{month:"Jan",revenue:64000000,expenses:64231735,netIncome:-551735},{month:"Feb",revenue:71500000,expenses:66050160,netIncome:5092340},{month:"Mar",revenue:76600000,expenses:93328950,netIncome:-17111950},{month:"Apr",revenue:79900000,expenses:73434254,netIncome:6066246},{month:"Mei",revenue:79500000,expenses:98555854,netIncome:-19453354},{month:"Jun",revenue:70000000,expenses:72151755,netIncome:-2501755},{month:"Jul",revenue:71750000,expenses:65007383,netIncome:6383867},{month:"Agu",revenue:56650000,expenses:70075468,netIncome:-13708718},{month:"Sep",revenue:64588000,expenses:49332140,netIncome:14932920},{month:"Okt",revenue:85748000,expenses:63674598,netIncome:21644662},{month:"Nov",revenue:86207091,expenses:62030198,netIncome:23745858},{month:"Des",revenue:61216453,expenses:90964827,netIncome:-30054456}],
  expenseCategories:[{label:"Biaya Gaji",amount:638240000},{label:"Professional Fee",amount:80077437},{label:"THR",amount:40000000},{label:"Tunjangan PPh 21",amount:39011421},{label:"Biaya Produksi",amount:29356500},{label:"Iklan & Promosi",amount:21002000},{label:"Transportasi & Perjalanan Dinas",amount:12323961},{label:"Meeting",amount:2820000},{label:"Biaya Talent",amount:2200000},{label:"Entertainment",amount:2159160},{label:"Penyusutan",amount:1260413},{label:"Administrasi Bank",amount:386430}],
  balanceSheet:{cash:94201586,receivables:54842124,prepaidTax:9488347,totalAssets:162771644,taxPayable:363640,capital:33917833,currentProfit:-1177778,retainedEarnings:78132235,unearnedRevenue:51535714,totalLiabilitiesEquity:162771644},
};

export const financial2026: FinancialReport = {
  year:"2026",status:"Year to date",source:"Reporting GHI 2026.xlsx",sourceUrl:"https://docs.google.com/spreadsheets/d/1-_zuWzIJJjakZnbyujjEwvff_Qq6Rwsw/edit",period:"Januari - Mei 2026",
  revenue:247003087,costOfRevenue:14100000,operatingExpenses:264702650,totalExpenses:278802650,operatingProfit:-32372478,tax:0,netIncome:-32372478,netMargin:-.131061026,
  months:[{month:"Jan",revenue:62363173,expenses:67080571,netIncome:-4717398},{month:"Feb",revenue:61979000,expenses:60207991,netIncome:1771009},{month:"Mar",revenue:50575914,expenses:71342291,netIncome:-20766377},{month:"Apr",revenue:40397000,expenses:43750106,netIncome:-3353106},{month:"Mei",revenue:31688000,expenses:36994606,netIncome:-5306606}],
  expenseCategories:[{label:"Biaya Gaji",amount:192925000},{label:"Professional Fee",amount:36923078},{label:"Biaya Produksi",amount:14100000},{label:"THR",amount:11000000},{label:"Iklan & Promosi",amount:9050000},{label:"Tunjangan PPh 21",amount:8345242},{label:"Biaya Sewa",amount:4000000},{label:"Transportasi & Perjalanan Dinas",amount:1591700},{label:"Meeting",amount:652630},{label:"Penyusutan",amount:572915},{label:"Administrasi Bank",amount:215000}],
  balanceSheet:{cash:54749729,receivables:64549297,prepaidTax:0,totalAssets:122965698,taxPayable:4285269,capital:33917833,currentProfit:-32372478,retainedEarnings:67749360,unearnedRevenue:49385714,totalLiabilitiesEquity:122965698},
};

export const financialReports = {"2024":financial2024,"2025":financial2025,"2026":financial2026};
