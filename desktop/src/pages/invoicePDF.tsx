import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

interface InvoiceLine {
  rowDescription: string;
  quantity: number;
  price: number;
  lineTotalIncl: number;
}

interface Invoice {
  invoiceNumber: string;
  invoiceDate: string | Date;
  dueDate: string | Date;
  subTotal: number;
  vatTotal: number;
  total: number;
  paymentTerm: number;
  invoiceLines?: InvoiceLine[];
  company?: {
    name: string;
    logo?: string;
    address?:  string;
    postcode?: string;
    city?:     string;
    country?:  string;
    btwNumber?: string;
    kvkNumber?: string;
    iban?: string;
    phone?: string;
    email?: string;
  };
  relation?: {
    companyName: string;
    address?:  string;
    postcode?: string;
    city?:     string;
    country?:  string;
    btwNumber?: string;
  }
}

const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('nl-NL');

export function InvoicePDF({ invoice }: { invoice: Invoice }) {
  // Only render logo if it exists and is a valid data URL
  const hasValidLogo = invoice.company?.logo && invoice.company.logo.startsWith('data:image');

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.pageContent}>
                    <View style={styles.row}>
                        <View style={styles.header}>
                            {hasValidLogo && (
                            <View style={styles.logoWrapper}>
                                <Image src={invoice.company?.logo!} style={styles.logo} />
                            </View>
                            )}
                            <View style={styles.recieverInfo}>
                                <Text>{invoice.relation?.companyName || "Bedrijf naam"}</Text>
                                <Text>{invoice.relation?.address || "adres" } {invoice.relation?.postcode || "postcode"}</Text>
                                <Text>{invoice.relation?.city || "stad" } {invoice.relation?.country || "land"}</Text>
                            </View>
                        </View>
                        <View style={styles.senderInfoContainer}>
                            <View style={styles.senderRow}>
                                <Text style={styles.senderLabel}>Adres:</Text>
                                <View>
                                    <Text style={[styles.senderValue, {fontWeight: 600, fontSize: 12}]}>{invoice.company?.name}</Text>
                                    <Text style={styles.senderValue}>{invoice.company?.address}</Text>
                                    <Text style={styles.senderValue}>{invoice.company?.postcode} {invoice.company?.city}</Text>
                                    <Text style={styles.senderValue}>{invoice.company?.country}</Text>
                                </View>
                            </View>

                            <View style={styles.senderRow}>
                                <View>
                                    <Text style={styles.senderLabel}>KvK nr:</Text>
                                    <Text style={styles.senderLabel}>Btw nr:</Text>
                                </View>
                                <View>
                                    <Text style={styles.senderValue}>{invoice.company?.kvkNumber || "—"}</Text>
                                    <Text style={styles.senderValue}>{invoice.company?.btwNumber || "—"}</Text>
                                </View>
                            </View>

                            <View style={styles.senderRow}>
                                <View>
                                    <Text style={styles.senderLabel}>IBAN:</Text>
                                </View>
                                <View>
                                    <Text style={styles.senderValue}>{invoice.company?.iban || "—"}</Text>
                                </View>
                            </View>

                            <View style={styles.senderRow}>
                                <View>
                                    <Text style={styles.senderLabel}>Tel:</Text>
                                    <Text style={styles.senderLabel}>E-mail:</Text>
                                </View>
                                <View>
                                    <Text style={styles.senderValue}>{invoice.company?.phone || "—"}</Text>
                                    <Text style={styles.senderValue}>{invoice.company?.email || "—"}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.cell, { flex: 3 }]}>Product</Text>
                        <Text style={styles.cell}>Aantal</Text>
                        <Text style={styles.cell}>Prijs (EUR)</Text>
                        <Text style={styles.cell}>Subtotaal</Text>
                    </View>
                    {invoice.invoiceLines?.map((line: InvoiceLine, i: number) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.cell, { flex: 3 }]}>{line.rowDescription}</Text>
                            <Text style={styles.cell}>{line.quantity}</Text>
                            <Text style={styles.cell}>€ {line.price.toFixed(2)}</Text>
                            <Text style={styles.cell}>€ {line.lineTotalIncl.toFixed(2)}</Text>
                        </View>
                    ))}
                    </View>
                </View>

                <View style={styles.bottomSection}>
                        <View style={styles.totalsContainer}>
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>Subtotaal</Text>
                            <Text>:</Text>
                            <Text style={styles.totalsValue}>EUR</Text>
                            <Text style={styles.totalsAmount}>{invoice.subTotal.toFixed(2)}</Text>
                        </View>
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>BTW-totaal</Text>
                            <Text>:</Text>
                            <Text style={styles.totalsValue}>EUR</Text>
                            <Text style={styles.totalsAmount}>{invoice.vatTotal.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.totalsRow, styles.totalsFinal]}>
                            <Text style={[styles.totalsLabel, { fontWeight: 'bold' }]}>Totaal</Text>
                            <Text>:</Text>
                            <Text style={[styles.totalsValue, { fontWeight: 'bold' }]}>EUR</Text>
                            <Text style={[styles.totalsAmount, { fontWeight: 'bold' }]}>{invoice.total.toFixed(2)}</Text>
                        </View>
                    </View>

                    <Text style={styles.paymentTerms}>Te betalen binnen {invoice.paymentTerm || "-"} dagen na factuurdatum.</Text>
                </View>
            </Page>
        </Document>
    );
}
const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 11, flexDirection: "column", height: "100%" },
    pageContent: { flex: 1 },
    logoWrapper: { marginBottom: 10 },
    logo: { width: 100, height: 100 },
    row: { 
        display: "flex",
        flexDirection: "row", 
        justifyContent: "space-between", 
        marginBottom: 5 
    },
    table: { marginTop: 30, marginBottom: 30 },
    tableHeader: { 
        flexDirection: "row",
        borderBottomWidth: 2,
        borderColor: "#000000",
        paddingBottom: 8,
        marginBottom: 8,
        fontWeight: "bold",
        fontSize: 11,
    },
    tableRow: {
        flexDirection: "row",
        paddingBottom: 10,
        paddingTop: 10,
        borderBottomWidth: 0.5,
        borderColor: "#cccccc",
    },
    cell: { flex: 1, paddingRight: 5 },
    totalsContainer: {
        alignItems: "flex-end",
    },
    totalsRow: {
        flexDirection: "row",
        marginBottom: 6,
        gap: 10,
    },
    totalsLabel: {
        width: 100,
        textAlign: "right",
    },
    totalsValue: {
        width: 30,
    },
    totalsAmount: {
        width: 60,
        textAlign: "right",
    },
    totalsFinal: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderColor: "#000000",
    },
    bottomSection: {
        marginTop: "auto",
        paddingTop: 20,
        borderTopWidth: 1,
        borderColor: "#dddddd",
    },
    paymentTerms: {
        marginTop: 10,
        fontSize: 10,
        color: "#666666",
    },
    header: {
        flexDirection: "column",
        gap: 20,
        width: "50%",
    },
    recieverInfo: {
        flexDirection: "column",
        gap: 5,
        fontSize: 12,
    },
    senderInfoContainer: {
        flexDirection: "column",
        gap: 8,
        padding: 10,
        borderWidth: 1,
        borderColor: "#cccccc",
        borderRadius: 4,
        marginTop: 10,
    },
    senderRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 4,
    },
    senderLabel: {
        fontSize: 9,
        color: "#888888",
        width: 45,
        lineHeight: 1.5,
    },
    senderValue: {
        fontSize: 9,
        color: "#222222",
        lineHeight: 1.5,
    },
});