import React from "react";
import ReactModal from "react-modal";
import styles from "@/css/modal.module.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
  height?: string;
}

export default function Modal({
  isOpen,
  onClose,
  children,
  width = "65vw",
  height = "auto",
}: ModalProps) {
  const isFluidWidth = /(%|vw)$/.test(width.trim());
  const modalContentStyle: React.CSSProperties = {
    width: isFluidWidth ? width : `clamp(320px, ${width}, 960px)`,
    height,
  };

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      className={styles.modalContent}
      overlayClassName={styles.modalOverlay}
      style={{
        content: modalContentStyle,
      }}
    >
      {children}
    </ReactModal>
  );
}
