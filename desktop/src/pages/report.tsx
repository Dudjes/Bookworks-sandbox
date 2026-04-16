import styles from "@/css/report.module.css"
import { useEffect, useState } from "react";
import { CiCalendar } from "react-icons/ci"
import { IoDocumentTextOutline } from "react-icons/io5";
import { useUser } from "@/context/UserContext";
import { TransactionLineInput } from "electron/database/transaction";

export default function Report(){
    const TABS = [
        {
            id: 1,
            title: "Winst- en Verliesrekening",
            subTitle: "Opbrengsten minus kosten",
        },
        {
            id: 2,
            title: "Balans",
            subTitle: "Activa en passiva",
        },
    ];
    const [selectedPeriod, setSelectedPeriod] = useState("2026");
    const [transactions, setTransactions] = useState<TransactionLineInput[]>([]);
    const [balanceTransactions, setBalanceTransactions] = useState<TransactionLineInput[]>([]);
    const [selectedTab, setSelectedTab] = useState(1);

    const {user} = useUser();

    const getTransactions = async (year: number, quarter?: number | undefined) => {
        try {
            let transactionList: TransactionLineInput[] = [];
            if(quarter){
                transactionList = await window.api?.invoke("report:getReportByQuarter", { year, quarter, userId: user?.id }) as TransactionLineInput[]
            }
            else{
                transactionList = await window.api?.invoke("report:getReportByYear", { year, userId: user?.id }) as TransactionLineInput[]
            }
            
            setTransactions(transactionList)
            console.log(transactionList);

        } catch (error) {
            console.error(error);
        }
    }

    const getBalance = async (year: number, quarter?: number | undefined) => {
        try {
            let balanceTransactionsList: TransactionLineInput[] = [];
            if(quarter){
                balanceTransactionsList = await window.api?.invoke("report:getBalansByPeriod", { year, quarter, userId: user?.id }) as TransactionLineInput[]
            }
            else{
                balanceTransactionsList = await window.api?.invoke("report:getBalansByYear", { year, userId: user?.id }) as TransactionLineInput[]
            }
            
            setBalanceTransactions(balanceTransactionsList)
            console.log(balanceTransactionsList);

        } catch (error) {
            console.error(error);
        }
    }

    const handlePeriodChange = (value: string) => {
        setSelectedPeriod(value);
        
        // Parse the value to extract year and quarter
        let year: number;
        let quarter: number | undefined;
        
        if (value.includes("Q")) {
            // Format: "Q1-2026"
            const [q, y] = value.split("-");
            quarter = parseInt(q.replace("Q", ""));
            year = parseInt(y);
            getTransactions(year, quarter);
            getBalance(year, quarter);
        } else {
            // Format: "2026"
            year = parseInt(value);
            getTransactions(year);
            getBalance(year);
        }
    }

    const organizeTransactions = (transactions: any[]) => {
        const ledgerTotals: Record<string, { name: string; amount: number; type: string }> = {};

        transactions.forEach((transaction) => {
            const amount = Number(transaction.amount);
            const ledgerId = transaction.ledgerId;
            const ledgerName = transaction.ledger?.name || "Unknown";
            const type = transaction.type;

            if (!ledgerTotals[ledgerId]) {
                ledgerTotals[ledgerId] = { name: ledgerName, amount: 0, type };
            }
            ledgerTotals[ledgerId].amount += amount;
        });

        const positive = Object.values(ledgerTotals).filter(l => l.type === "ontvangen");
        const negative = Object.values(ledgerTotals).filter(l => l.type === "betalen");

        const totalPositive = positive.reduce((sum, val) => sum + val.amount, 0);
        const totalNegative = negative.reduce((sum, val) => sum + val.amount, 0);

        return {
            positive,
            negative,
            totalPositive,
            totalNegative,
            netProfit: totalPositive - totalNegative
        };
    };

    const organizeBalance = (transactions: any[]) => {
        const ledgerTotals: Record<string, { name: string; amount: number; category: string }> = {};

        transactions.forEach((transaction) => {
            const amount = Number(transaction.amount);
            const ledgerId = transaction.ledgerId;
            const ledgerName = transaction.ledger?.name || "Unknown";
            const category = transaction.ledger?.category || "Unknown";

            if (!ledgerTotals[ledgerId]) {
                ledgerTotals[ledgerId] = { name: ledgerName, amount: 0, category };
            }
            ledgerTotals[ledgerId].amount += amount;
        });

        const ledgerList = Object.values(ledgerTotals);

        // Fixed assets (Vaste activa)
        const vasteActiva = ledgerList.filter(l => 
            ['Immateriële vaste activa', 'Materiële vaste activa', 'Financiële vaste activa', 'Totaal voorraden']
            .includes(l.category)
        );

        // Current assets (Vlottende activa)
        const vlottendeActiva = ledgerList.filter(l => 
            ['liquide middelen', 'Vorderingen en overlopende activa']
            .includes(l.category)
        );

        // Equity (Eigen vermogen)
        const eigenVermogen = ledgerList.filter(l => 
            ['Kapitaal vennoot 1']
            .includes(l.category)
        );

        // Long-term liabilities (Vaste schulden)
        const vasteSchulden = ledgerList.filter(l => 
            ['Langlopende schulden', 'Voorzieningen']
            .includes(l.category)
        );

        // Short-term liabilities (Vlottende schulden)
        const vlottendeSchulden = ledgerList.filter(l => 
            ['Kortlopende schulden en overl. passiva']
            .includes(l.category)
        );

        // Calculate totals
        const totalVasteActiva = vasteActiva.reduce((sum, val) => sum + val.amount, 0);
        const totalVlottendeActiva = vlottendeActiva.reduce((sum, val) => sum + val.amount, 0);
        const totalActiva = totalVasteActiva + totalVlottendeActiva;

        const totalEigenVermogen = eigenVermogen.reduce((sum, val) => sum + val.amount, 0);
        const totalVasteSchulden = vasteSchulden.reduce((sum, val) => sum + val.amount, 0);
        const totalVlottendeSchulden = vlottendeSchulden.reduce((sum, val) => sum + val.amount, 0);
        const totalPassiva = totalEigenVermogen + totalVasteSchulden + totalVlottendeSchulden;

        return {
            activa: {
                vasteActiva,
                vlottendeActiva,
                totalVasteActiva,
                totalVlottendeActiva,
                totalActiva
            },
            passiva: {
                eigenVermogen,
                vasteSchulden,
                vlottendeSchulden,
                totalEigenVermogen,
                totalVasteSchulden,
                totalVlottendeSchulden,
                totalPassiva
            }
        };
    };

    useEffect(() => {
        getTransactions(2026);
        getBalance(2026);
    }, [user?.id])

    return(
        <div className={styles.mainContainer}>
            <div className={styles.header}>
                <h2>Rapportage</h2>
                <p>Financiële overzichten en analyses</p>
            </div>
            <div className={styles.body}>
                <div className={styles.period}>
                    <CiCalendar size={24}/>
                    <h4>Periode: </h4>
                    <div>
                        <select name="period" id="period" onChange={(e) => handlePeriodChange(e.target.value)}>
                            <option value="2026">Jaar 2026</option>
                            <option value="2025">Jaar 2025</option>
                            <option value="Q1-2026">Q1-2026</option>
                            <option value="Q2-2026">Q2-2026</option>
                            <option value="Q3-2025">Q3-2025</option>
                            <option value="Q4-2025">Q4-2025</option>
                        </select>
                    </div>
                </div>

                <div className={styles.tabsContainer}>
                    {TABS.map((tab) => (
                        <div key={tab.id} className={styles.tab} onClick={() => setSelectedTab(tab.id)}>
                            <IoDocumentTextOutline size={30}/>
                            <p className={styles.tabTitle}>{tab.title}</p>
                            <p>{tab.subTitle}</p>
                        </div>
                    ))}
                </div>

                {selectedTab === 1 && transactions.length > 0 && (
                    <div className={styles.reportContainer}>
                        <div className={styles.reportHeader}>
                            <h2>Winst- en Verliesrekening - {selectedPeriod}</h2>
                            <button className={styles.exportBtn}>Export PDF</button>
                        </div>

                        {(() => {
                            const report = organizeTransactions(transactions);
                            return (
                                <>
                                    <div className={styles.section}>
                                        <h3 className={styles.sectionTitle}>Opbrengsten</h3>
                                        {report.positive.map((item, idx) => (
                                            <div key={idx} className={styles.lineItem}>
                                                <span>{item.name}</span>
                                                <span>€ {item.amount.toFixed(3)}</span>
                                            </div>
                                        ))}
                                        <div className={styles.total}>
                                            <span>Totaal opbrengsten</span>
                                            <span>€ {report.totalPositive.toFixed(3)}</span>
                                        </div>
                                    </div>

                                    <div className={styles.section}>
                                        <h3 className={styles.sectionTitle}>Kosten</h3>
                                        {report.negative.map((item, idx) => (
                                            <div key={idx} className={styles.lineItem}>
                                                <span>{item.name}</span>
                                                <span>€ {item.amount.toFixed(3)}</span>
                                            </div>
                                        ))}
                                        <div className={styles.totalNegative}>
                                            <span>Totaal kosten</span>
                                            <span>€ {report.totalNegative.toFixed(3)}</span>
                                        </div>
                                    </div>

                                    <div className={styles.netProfit}>
                                        <span>Netto winst</span>
                                        <span>€ {report.netProfit.toFixed(3)}</span>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}

                {selectedTab === 2 && balanceTransactions.length > 0 && (
                    <div className={styles.reportContainer}>
                        <div className={styles.reportHeader}>
                            <h2>Balans - {selectedPeriod}</h2>
                            <button className={styles.exportBtn}>Export PDF</button>
                        </div>

                        {(() => {
                            const balance = organizeBalance(balanceTransactions);
                            return (
                                <div className={styles.balanceContainer}>
                                    <div className={styles.balanceColumn}>
                                        <h3 className={styles.sectionTitle}>Activa</h3>
                                        
                                        <div>
                                            <p style={{ fontWeight: "500", marginTop: "10px" }}>Vaste activa</p>
                                            {balance.activa.vasteActiva.map((item, idx) => (
                                                <div key={idx} className={styles.lineItem}>
                                                    <span>{item.name}</span>
                                                    <span>€ {item.amount.toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <div className={styles.lineItem} style={{ paddingLeft: "20px" }}>
                                                <span>Totaal vaste activa</span>
                                                <span>€ {balance.activa.totalVasteActiva.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <p style={{ fontWeight: "500", marginTop: "10px" }}>Vlottende activa</p>
                                            {balance.activa.vlottendeActiva.map((item, idx) => (
                                                <div key={idx} className={styles.lineItem}>
                                                    <span>{item.name}</span>
                                                    <span>€ {item.amount.toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <div className={styles.lineItem} style={{ paddingLeft: "20px" }}>
                                                <span>Totaal vlottende activa</span>
                                                <span>€ {balance.activa.totalVlottendeActiva.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className={styles.total}>
                                            <span>Totaal activa</span>
                                            <span>€ {balance.activa.totalActiva.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className={styles.balanceColumn}>
                                        <h3 className={styles.sectionTitle}>Passiva</h3>
                                        
                                        <div>
                                            <p style={{ fontWeight: "500", marginTop: "10px" }}>Eigen vermogen</p>
                                            {balance.passiva.eigenVermogen.map((item, idx) => (
                                                <div key={idx} className={styles.lineItem}>
                                                    <span>{item.name}</span>
                                                    <span>€ {item.amount.toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <div className={styles.lineItem} style={{ paddingLeft: "20px" }}>
                                                <span>Totaal eigen vermogen</span>
                                                <span>€ {balance.passiva.totalEigenVermogen.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <p style={{ fontWeight: "500", marginTop: "10px" }}>Vaste schulden</p>
                                            {balance.passiva.vasteSchulden.map((item, idx) => (
                                                <div key={idx} className={styles.lineItem}>
                                                    <span>{item.name}</span>
                                                    <span>€ {item.amount.toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <div className={styles.lineItem} style={{ paddingLeft: "20px" }}>
                                                <span>Totaal vaste schulden</span>
                                                <span>€ {balance.passiva.totalVasteSchulden.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <p style={{ fontWeight: "500", marginTop: "10px" }}>Vlottende schulden</p>
                                            {balance.passiva.vlottendeSchulden.map((item, idx) => (
                                                <div key={idx} className={styles.lineItem}>
                                                    <span>{item.name}</span>
                                                    <span>€ {item.amount.toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <div className={styles.lineItem} style={{ paddingLeft: "20px" }}>
                                                <span>Totaal vlottende schulden</span>
                                                <span>€ {balance.passiva.totalVlottendeSchulden.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className={styles.total}>
                                            <span>Totaal passiva</span>
                                            <span>€ {balance.passiva.totalPassiva.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    )
}