"use client";

import type { Invoice } from "@/lib/data";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const blue = "#1f5dcc";
const darkBlue = "#203963";
const border = "#b7b7b7";

const styles = StyleSheet.create({
  page: { padding: 0, fontFamily: "Helvetica", fontSize: 9, color: "#111" },
  sidebar: { position: "absolute", left: 0, top: 130, bottom: 90, width: 135, borderRightWidth: 1, borderRightColor: "#111" },
  titleBox: { height: 47, backgroundColor: "#bdd7ee", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22 },
  brandBox: { height: 85, backgroundColor: "#f6f6f6", alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 16, fontWeight: 700 },
  company: { margin: "20 18 0", fontSize: 7.5, lineHeight: 1.6, color: "#444" },
  content: { marginLeft: 155, marginRight: 50, paddingTop: 178 },
  meta: { position: "absolute", top: 178, right: 50, width: 105, textAlign: "center" },
  metaLabel: { color: darkBlue, fontWeight: 700, borderBottomWidth: 1, borderBottomColor: border, paddingBottom: 3, marginTop: 7 },
  metaValue: { paddingTop: 4 },
  bill: { marginTop: 86, width: 175 },
  sectionLabel: { color: darkBlue, fontWeight: 700, borderBottomWidth: 1, borderBottomColor: border, paddingBottom: 3 },
  client: { paddingTop: 6, fontSize: 10 },
  table: { marginTop: 82 },
  header: { flexDirection: "row", backgroundColor: blue, color: "#fff", fontWeight: 700, paddingVertical: 4 },
  descriptionCol: { width: "78%", paddingHorizontal: 3 },
  amountCol: { width: "22%", paddingHorizontal: 3, textAlign: "right" },
  row: { flexDirection: "row", minHeight: 16, backgroundColor: "#f4f4f4", borderBottomWidth: 1, borderBottomColor: border },
  rowCell: { padding: "3 3" },
  bottom: { flexDirection: "row", marginTop: 5 },
  remarks: { width: "58%", fontSize: 8.5, lineHeight: 1.8 },
  totals: { width: "42%" },
  totalRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: border, paddingVertical: 3 },
  totalLabel: { width: "63%", textAlign: "right", paddingRight: 4, fontWeight: 700, color: "#344054" },
  totalValue: { width: "37%", textAlign: "right" },
  balanceRow: { flexDirection: "row", marginTop: 5, alignItems: "center" },
  balanceLabel: { width: "63%", textAlign: "right", paddingRight: 4, fontWeight: 700, fontSize: 11, color: "#344054" },
  balanceValue: { width: "37%", textAlign: "right", backgroundColor: "#cfe2f3", padding: "10 3", fontWeight: 700, fontSize: 10, borderBottomWidth: 1, borderBottomColor: "#111" },
});

const money = (value: number) => `Rp${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
const date = (value: string) => value ? new Intl.DateTimeFormat("en-GB").format(new Date(`${value}T00:00:00`)) : "-";

export function InvoicePdf({ invoice }: { invoice: Invoice }) {
  const discount = invoice.discount || 0;
  const subtotalLessDiscount = invoice.amount - discount;
  const tax = subtotalLessDiscount * ((invoice.taxRate || 0) / 100);
  const balance = subtotalLessDiscount + tax;

  return (
    <Document title={`Invoice ${invoice.no}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.sidebar}>
          <View style={styles.titleBox}><Text style={styles.title}>INVOICE</Text></View>
          <View style={styles.brandBox}><Text style={styles.brand}>Growthhive</Text></View>
          <View style={styles.company}>
            <Text>PT. Growth Hive Indonesia</Text>
            <Text>APL Tower Central Park Lt. 26 T3, Jl. Letjen S. Parman No.Kav. 28</Text>
            <Text>DKI Jakarta, 11470</Text>
            <Text style={{ marginTop: 6 }}>0881-0824-87487</Text>
            <Text style={{ marginTop: 6 }}>growthhiveofficial@gmail.com</Text>
          </View>
        </View>

        <View style={styles.meta}>
          <Text style={[styles.metaLabel, { marginTop: 0 }]}>{date(invoice.date)}</Text>
          <Text style={styles.metaValue}>due on {date(invoice.due)}</Text>
          <Text style={styles.metaLabel}>INVOICE NO.</Text>
          <Text style={styles.metaValue}>{invoice.no}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.bill}>
            <Text style={styles.sectionLabel}>BILL TO</Text>
            <Text style={styles.client}>{invoice.client}</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.header}><Text style={[styles.descriptionCol, { textAlign: "center" }]}>DESCRIPTION</Text><Text style={[styles.amountCol, { textAlign: "center" }]}>TOTAL</Text></View>
            <View style={styles.row}><Text style={[styles.descriptionCol, styles.rowCell]}>{invoice.description || "Professional services"}</Text><Text style={[styles.amountCol, styles.rowCell]}>{money(invoice.amount)}</Text></View>
            {[1, 2, 3, 4, 5, 6, 7].map((item) => <View key={item} style={styles.row}><Text style={styles.descriptionCol}> </Text><Text style={styles.amountCol}> </Text></View>)}
          </View>

          <View style={styles.bottom}>
            <View style={styles.remarks}>
              <Text>Remarks / Payment Instructions:</Text>
              <Text style={{ marginTop: 6 }}>BCA 0760256536</Text>
              <Text>A/N GROWTH HIVE INDONESIA</Text>
            </View>
            <View style={styles.totals}>
              {[["SUBTOTAL", invoice.amount], ["DISCOUNT", discount], ["SUBTOTAL LESS DISCOUNT", subtotalLessDiscount], ["TAX RATE", `${invoice.taxRate || 0}.00%`], ["TOTAL TAX", tax]].map(([label, value]) => (
                <View style={styles.totalRow} key={String(label)}><Text style={styles.totalLabel}>{label}</Text><Text style={styles.totalValue}>{typeof value === "number" ? money(value) : value}</Text></View>
              ))}
              <View style={styles.balanceRow}><Text style={styles.balanceLabel}>Balance Due</Text><Text style={styles.balanceValue}>{money(balance)}</Text></View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
