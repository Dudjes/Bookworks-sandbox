import BaseHeader from "@/components/baseHeader";
import Modal from "@/components/Modal";
import TransactionForm from "@/components/TransactionForm";
import { useState } from "react";

export default function Transaction(){
    const [modalVisible, setModalVisible] = useState(false);
    
    const handleSaveTransaction = (lines: any) => {
        console.log("Saving transaction lines:", lines);
        // TODO: Send to backend/database
        setModalVisible(false);
    };
    
    return (
        <div>
            <BaseHeader
                title="Transacties"
                buttonText="Nieuwe transactie"
                searchPlaceholder="Zoek transacties via omschrijving of transactienummer..."
                subtitle="Beheer en maak nieuwe transacties"
                searchAriaLabel="Zoek transacties"
                onButtonClick={() => setModalVisible(true)}
            />


            <Modal
                isOpen={modalVisible}
                onClose={() => setModalVisible(false)}
                width="90vw" 
                height="auto"
            >
                <TransactionForm 
                    onSave={handleSaveTransaction}
                    onClose={() => setModalVisible(false)}
                />
            </Modal>
        </div>
    )
}