import Modal from "react-modal";

Modal.setAppElement("#root");

interface AlertProps {
    isOpen: boolean;
    message: string;
    onClose: () => void;
    option2?: {
        label: string;
        onClick: () => void;
    };
}

export default function Alert({ isOpen, message, onClose, option2 }: AlertProps) {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            style={{
                overlay: {
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                },
                content: {
                    top: "50%",
                    left: "50%",
                    right: "auto",
                    bottom: "auto",
                    transform: "translate(-50%, -50%)",
                    padding: "24px",
                    borderRadius: "8px",
                    maxWidth: "400px",
                    width: "100%",
                    color: "black",
                },
            }}
        >
            <p style={{ color: "black", marginBottom: "20px", fontSize: "16px" }}>{message}</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                    onClick={onClose}
                    style={{
                        padding: "12px 30px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                        backgroundColor: "white",
                        color: "black",
                        fontWeight: "600",
                        cursor: "pointer",
                    }}
                >
                    Close
                </button>
                {option2 && (
                    <button
                        onClick={option2.onClick}
                        style={{
                            padding: "12px 30px",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            fontWeight: "600",
                            cursor: "pointer",
                        }}
                    >
                        {option2.label}
                    </button>
                )}
            </div>
        </Modal>
    );
}