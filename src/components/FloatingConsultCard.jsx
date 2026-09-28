import React, { useState } from 'react';
import styles from './FloatingConsultCard.module.css';
import PrivacyConsentCheckbox from './PrivacyConsentCheckbox.jsx';
import { getPhoneValidationMessage } from '../utils/phoneStorage';

const FloatingConsultCard = ({
  modelName = '',
  onConsultSubmit,
  onPhoneConsult,
  onKakaoConsult,
  hideQuickInquiry = false,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [carModel, setCarModel] = useState(modelName);
  const [isPrivacyAgreed, setIsPrivacyAgreed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('성함을 입력해 주세요.');
      return;
    }
    
    const phoneValidationMessage = getPhoneValidationMessage(phone);
    if (phoneValidationMessage) {
      alert(phoneValidationMessage);
      return;
    }
    
    if (!isPrivacyAgreed) {
      alert('개인정보 이용 동의에 체크해 주세요.');
      return;
    }

    if (onConsultSubmit) {
      onConsultSubmit({ name, phone, carModel });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className={styles['floating-consult-wrapper']}>
      {/* 전화/카톡 상담 카드 */}
      <div className={styles['contact-options-card']}>
        <button
          type="button"
          className={styles['contact-option']}
          onClick={onPhoneConsult}
        >
          <div className={styles['contact-icon']}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M3.62 7.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V17c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
                fill="#111111"
              />
            </svg>
          </div>
          <div className={styles['contact-text']}>
            <div className={styles['contact-subtitle']}>전문상담원과 간편 전화상담</div>
            <div className={styles['contact-title']}>1577-8319</div>
          </div>
        </button>

        <div className={styles['contact-divider']} />

        <button
          type="button"
          className={styles['contact-option']}
          onClick={onKakaoConsult}
        >
          <div className={styles['contact-icon']}>
            <div className={styles['kakao-icon']}>
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                <circle cx="15" cy="15" r="15" fill="#FFE812" />
                <path
                  d="M15 7.24C10.03 7.24 6 10.42 6 14.32C6 16.64 7.48 18.68 9.75 19.92L8.82 23.37C8.76 23.58 9.01 23.74 9.18 23.61L13.28 20.77C13.84 20.84 14.41 20.88 15 20.88C19.97 20.88 24 17.7 24 13.8C24 9.9 19.97 6.72 15 6.72"
                  fill="#3C1E1E"
                />
              </svg>
            </div>
          </div>
          <div className={styles['contact-text']}>
            <div className={styles['contact-subtitle']}>1분만에 스으윽~~~</div>
            <div className={styles['contact-title']}>카톡 간편 상담 신청</div>
          </div>
        </button>
      </div>

      {/* TOP 버튼 */}
      <button
        type="button"
        className={styles['top-button']}
        onClick={scrollToTop}
        aria-label="맨 위로"
      >
        <div className={styles['top-arrow']}>
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <path
              d="M8.571 2.857L8.571 14.286M8.571 2.857L2.857 8.571M8.571 2.857L14.286 8.571"
              stroke="#555555"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.3"
            />
          </svg>
        </div>
        <div className={styles['top-text']}>TOP</div>
      </button>
    </div>
  );
};

export default FloatingConsultCard;

