import type { Invoice } from "@/lib/data";

const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export function generateInvoiceNumber(invoices: Invoice[], dateValue: string) {
  const date = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
  const sequence = invoices.reduce((highest, invoice) => {
    const number = Number(invoice.no.split("/")[0]);
    return Number.isFinite(number) ? Math.max(highest, number) : highest;
  }, 0) + 1;

  return `${String(sequence).padStart(3, "0")}/${romanMonths[date.getMonth()]}/GHI/${String(date.getFullYear()).slice(-2)}`;
}
