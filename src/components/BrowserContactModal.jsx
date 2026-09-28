import React, { useEffect, useState, useRef } from 'react';
import styles from './BrowserContactModal.module.css';
import PrivacyConsentCheckbox from './PrivacyConsentCheckbox';
import { logContactModalEvent } from '../utils/analyticsUtils';
import { getPhoneValidationMessage } from '../utils/phoneStorage';

function BrowserContactModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  title = '실시간 견적 받기',
  description = '초기 비용 없이 전 차종 비교 가능합니다.',
  carName = '',
  initialPhone = '',
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(initialPhone || '');
  const [agree, setAgree] = useState(true);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const hasSubmittedRef = useRef(false);

  const maskPhone = (value) => {
    if (!value) return '';
    const digits = String(value).replace(/[^\d]/g, '');
    if (!digits) return '';
    if (digits.length <= 4) return '*'.repeat(digits.length);
    return `${digits.slice(0, 3)}${'*'.repeat(Math.max(0, digits.length - 5))}${digits.slice(-2)}`;
  };

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line no-console
      console.info('[BrowserContactModal] open', { initialPhone, title });
      setName('');
      setPhone(initialPhone || '');
      setAgree(true);
      setLocalSubmitting(false);
      hasSubmittedRef.current = false;

      try {
        logContactModalEvent('open', {
          initialPhoneMasked: maskPhone(initialPhone),
          hasInitialPhone: Boolean(initialPhone),
          modalTitle: title,
        });
      } catch {
        // analytics 에러 무시
      }
    }
  }, [open, initialPhone]);

  if (!open) return null;

  const submitting = isSubmitting || localSubmitting;

  const handleSubmit = async () => {
    const trimmedName = (name || '').trim();
    const trimmedPhone = (phone || '').trim();

    const phoneValidationMessage = getPhoneValidationMessage(
      trimmedPhone,
      '휴대폰 번호를 입력해 주세요.',
    );
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
      console.info('[BrowserContactModal] handleSubmit: submitting', { name: trimmedName, phone: trimmedPhone });

      try {
        logContactModalEvent('submit', {
          phoneMasked: maskPhone(trimmedPhone),
          phoneLength: trimmedPhone.replace(/[^\d]/g, '').length || 0,
          hasName: Boolean(trimmedName),
        });
      } catch {
        // 무시
      }
      hasSubmittedRef.current = true;
      await onSubmit?.(trimmedPhone, trimmedName);
    } finally {
      setLocalSubmitting(false);
    }
  };

  const handleClose = () => {
    try {
      if (!hasSubmittedRef.current) {
        logContactModalEvent('cancel', {
          phoneMasked: maskPhone(phone),
          phoneLength: phone.replace(/[^\d]/g, '').length || 0,
        });
      }
    } catch {
      // 무시
    }
    onClose?.();
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        {/* 헤더 */}
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.close}
            onClick={handleClose}
            aria-label="닫기"
            disabled={submitting}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* 2컬럼 본문 (데스크톱: 좌=폼, 우=이미지 / 모바일: 상=이미지, 하=폼) */}
        <div className={styles.content}>
          {/* 이미지 컬럼 (데스크톱: 우측 / 모바일: 상단) */}
          <div className={styles.imageColumn}>
            <img
              src="/home/pone.svg"
              alt="모바일 화면"
              className={styles.phoneImage}
              loading="lazy"
            />
          </div>

          {/* 폼 컬럼 */}
          <div className={styles.formColumn}>
            {/* 헤드라인 */}
            <div className={styles.heroTextArea}>
              <p className={styles.desc}>
                1분만에 견적만{' '}
                <span className={styles.highlightWrapper}>
                  <span className={styles.highlightEmphasis}>스으윽</span>
                </span>{' '}
                받아보세요
              </p>
              <p className={styles.subDesc}>{description}</p>
            </div>

            {/* 입력 폼 */}
            <div className={styles.formArea}>
              <div className={styles.inputBox}>
                <label className={styles.inlineLabel} htmlFor="browser-contact-name">
                  이름
                </label>
                <input
                  id="browser-contact-name"
                  type="text"
                  className={styles.inlineInput}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 홍길동"
                  disabled={submitting}
                />
              </div>

              <div className={styles.inputBox}>
                <label className={styles.inlineLabel} htmlFor="browser-contact-phone">
                  휴대폰 번호<span className={styles.required}>*</span>
                </label>
                <input
                  id="browser-contact-phone"
                  type="tel"
                  className={styles.inlineInput}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  disabled={submitting}
                />
              </div>

              <div className={styles.inputBox}>
                <label className={styles.inlineLabel} htmlFor="browser-contact-car">
                  차종
                </label>
                <input
                  id="browser-contact-car"
                  type="text"
                  className={styles.inlineInput}
                  defaultValue={carName}
                  placeholder="ex) 쏘렌토"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* 동의 */}
            <div className={styles.consentArea}>
              <PrivacyConsentCheckbox
                id="browser-contact-agree"
                checked={agree}
                onChange={setAgree}
                align="right"
              />
            </div>

            <p className={styles.notice}>*견적은 카카오톡으로 발송되며, 미사용 시 문자로 전송됩니다.</p>

            {/* 제출 버튼 */}
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
    </div>
  );
}

export default BrowserContactModal;
