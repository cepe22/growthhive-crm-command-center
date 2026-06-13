"use client";

import type { Invoice } from "@/lib/data";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { InvoicePdf } from "./invoice-pdf";

export default function InvoiceDownloadButton({ invoice }: { invoice: Invoice }) {
  return (
    <PDFDownloadLink
      document={<InvoicePdf invoice={invoice} />}
      fileName={`Invoice ${invoice.no.replaceAll("/", "-")} - ${invoice.client}.pdf`}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
    >
      {({ loading }) => <><Download size={14} />{loading ? "Menyiapkan..." : "PDF"}</>}
    </PDFDownloadLink>
  );
}
