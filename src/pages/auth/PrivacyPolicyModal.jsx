import React from 'react';
import ReactDOM from 'react-dom';
import { PrivacyPolicyContent } from './PrivacyPolicy';
import styles from './PrivacyPolicy.module.css';

const PrivacyPolicyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (typeof document === 'undefined') {
    // SSR 환경 대비 안전 장치
    return null;
  }

  const modalRoot = document.getElementById('modal-root') || document.body;

  return ReactDOM.createPortal(
    <div
      className={styles.modalOverlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacyPolicyModalTitle"
    >
      <div className={styles.modalContainer}>
        <div className={styles.modalHeaderBar}>
          <h2 id="privacyPolicyModalTitle" className={styles.modalTitle}>
            개인정보 처리방침
          </h2>
          <button
            type="button"
            className={styles.modalCloseButton}
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          <PrivacyPolicyContent />
        </div>
      </div>
    </div>,
    modalRoot,
  );
};

export default PrivacyPolicyModal;


