import React, { useEffect, useState } from 'react';
import styles from './MobileContactModal.module.css';
import PrivacyConsentCheckbox from './PrivacyConsentCheckbox';
import { getPhoneValidationMessage } from '../utils/phoneStorage';

export const CONTACT_MODAL_MESSAGE =
  '초기 비용 없이 전 차종 비교 가능합니다.';

/**
 * 모바일 연락처 입력 모달 (카카오톡 상담용)
 *
 * props:
 * - open: boolean           // 모달 열림 여부
 * - onClose: () => void     // 닫기 콜백
 * - onSubmit: (phone, name) => Promise<void> | void  // 연락처 제출 콜백
 * - isSubmitting?: boolean  // 상위 컴포넌트에서 전송 중 상태 제어 가능 (선택)
 * - title?: string
 * - description?: string
 */
function MobileContactModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  title = '실시간 견적문의',
  description = CONTACT_MODAL_MESSAGE,
  highlightText = '카톡으로 24개 렌트사',
  highlightEmphasis = '스으윽 받아보세요.',
  initialPhone = '',
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(initialPhone || '');
  const [agree, setAgree] = useState(true);
  const [localSubmitting, setLocalSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line no-console
      console.info('[MobileContactModal] open', {
        initialPhone,
        title,
      });
      setName('');
      setPhone(initialPhone || '');
      setAgree(true);
      setLocalSubmitting(false);
    }
  }, [open, initialPhone]);

  if (!open) return null;

  const handleSubmit = async () => {
    const trimmedName = (name || '').trim();
    const trimmedPhone = (phone || '').trim();
    
    const phoneValidationMessage = getPhoneValidationMessage(trimmedPhone);
    if (phoneValidationMessage) {
      alert(phoneValidationMessage);
      return;
    }

    if (!agree) {
      alert('개인정보 이용 동의에 체크해 주세요.');
      return;
    }

    try {
      setLocalSubmitting(true);
      // eslint-disable-next-line no-console
      console.info('[MobileContactModal] handleSubmit: submitting', {
        name: trimmedName,
        phone: trimmedPhone,
      });
      // 하위 호환성을 위해 phone을 첫 번째 인자로 전달, name은 두 번째 인자로 전달
      await onSubmit(trimmedPhone, trimmedName);
    } finally {
      setLocalSubmitting(false);
    }
  };

  const submitting = isSubmitting || localSubmitting;

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>
        <div className={styles.header}>
          <p className={styles.heroTitle}>{title}</p>
          <button
            type="button"
            className={styles.iconClose}
            onClick={onClose}
            aria-label="닫기"
            disabled={submitting}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.heroSection}>
            <div className={styles.phoneImageWrapper}>
              <img src="/모바일화면.svg" alt="모바일 화면" className={styles.phoneImage} />
            </div>
            <div className={styles.heroTextArea}>
              <p className={styles.desc}>
                {highlightText}<br />
                1분만에 견적만 <span className={styles.highlightWrapper}><span className={styles.highlightEmphasis}>{highlightEmphasis}</span></span>
              </p>
              <p className={styles.subDesc}>{description}</p>
            </div>
          </div>

          <div className={styles.formArea}>
            <div className={styles.inputBox}>
              <label className={styles.label} htmlFor="mobile-contact-name">
                이름
              </label>
              <input
                id="mobile-contact-name"
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 홍길동"
                disabled={submitting}
              />
            </div>

            <div className={styles.inputBox}>
              <label className={styles.label} htmlFor="mobile-contact-phone">
                휴대폰 번호
              </label>
              <input
                id="mobile-contact-phone"
                type="tel"
                className={styles.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="예: 010-1234-5678"
                disabled={submitting}
              />
            </div>
          </div>

          <div className={styles.consentArea}>
             <PrivacyConsentCheckbox 
                id="mobile-contact-agree"
                checked={agree}
                onChange={setAgree}
                align="right"
             />
          </div>

          <div className={styles.noticeGroup}>
            <p className={styles.notice}>* 견적은 카카오톡으로 발송되며, 미사용 시 문자로 전송됩니다.</p>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '전송 중...' : '실시간 무료견적 받기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileContactModal;
