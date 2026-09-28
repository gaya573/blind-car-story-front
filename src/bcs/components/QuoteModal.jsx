import React, { useEffect, useRef } from 'react';
import { useConsultForm } from '../useConsultForm';
import PrivacyRow from './PrivacyRow';

// 퍼블리싱 quote-modal.js 의 오른쪽 미리보기. 실제 견적이 아니라 화면 예시다.
const PREVIEW_PARTNERS = [
  { name: '하나캐피탈', logoUrl: '/bcs/images/partners/hana-capital.svg', monthly: '306,500', takeover: '41,495,120' },
  { name: 'KB캐피탈', logoUrl: '/bcs/images/partners/kb-capital.svg', monthly: '316,120', takeover: '41,495,120' },
  { name: 'NH농협캐피탈', logoUrl: '/bcs/images/partners/nh-capital.svg', monthly: '326,340', takeover: '41,495,120' },
  { name: '신한카드', logoUrl: '/bcs/images/partners/shinhan-card.svg', monthly: '336,560', takeover: '41,495,120' },
  { name: '삼성카드', logoUrl: '/bcs/images/partners/samsung-card.svg', monthly: '348,910', takeover: '41,495,120' },
];

/** 실시간 견적 받기 모달 (재고 특가 핫딜 · 출고후기 · 모바일 화면 공용). */
export default function QuoteModal({ open, carName, source, onClose }) {
  const formRef = useRef(null);
  const phoneRef = useRef(null);
  const lastFocused = useRef(null);
  const { handleSubmit, error, submitting } = useConsultForm({
    source: source || 'quote-modal',
    entryLabel: '실시간 견적 모달',
    onSuccess: onClose,
  });

  useEffect(() => {
    if (!open) return undefined;
    lastFocused.current = document.activeElement;
    const car = formRef.current?.elements.namedItem('carModel');
    if (car) car.value = carName || '';
    document.body.style.overflow = 'hidden';
    const focusTimer = setTimeout(() => phoneRef.current?.focus(), 0);
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      lastFocused.current?.focus?.();
    };
  }, [open, carName, onClose]);

  return (
    <div
      className={`modal-overlay qm-overlay${open ? ' is-open' : ''}`}
      aria-hidden={open ? 'false' : 'true'}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="qm-card" role="dialog" aria-modal="true" aria-labelledby="qm-title">
        <div className="qm-head">
          <h2 id="qm-title">실시간 견적 받기</h2>
        </div>
        <button className="qm-close" type="button" aria-label="닫기" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="qm-body">
          <form className="qm-form" ref={formRef} onSubmit={handleSubmit} noValidate>
            <p className="qm-title">
              <strong>1분만에</strong> 견적만 <em>스으윽</em> 받아보세요
            </p>
            <p className="qm-desc">휴대폰 번호를 남겨주시면 차량 전문 매니저가 곧 연락드립니다.</p>
            <div className="qm-fields">
              <div className="qm-row">
                <label htmlFor="qm-name">이름</label>
                <input id="qm-name" name="name" type="text" placeholder="예: 홍길동" autoComplete="name" />
              </div>
              <div className="qm-row">
                <label htmlFor="qm-phone">
                  휴대폰 번호<span className="required">*</span>
                </label>
                <input ref={phoneRef} id="qm-phone" name="phone" type="tel" inputMode="numeric" placeholder="예: 010-1234-5678" />
              </div>
              <div className="qm-row">
                <label htmlFor="qm-car">차종</label>
                <input id="qm-car" name="carModel" type="text" placeholder="ex) 쏘렌토" />
              </div>
            </div>
            <PrivacyRow id="qm-privacy" label="[필수] 개인정보 이용 동의" className="qm-agree" />
            <p className="qm-note">*견적은 카카오톡으로 발송되며, 미사용 시 문자로 전송됩니다.</p>
            <p className="form-error">{error}</p>
            <button className="qm-submit" type="submit" disabled={submitting}>
              {submitting ? '접수 중…' : '실시간 무료견적 받기'}
            </button>
          </form>
          <div className="qm-preview" aria-hidden="true">
            <div className="qm-phone">
              <div className="qm-phone__head">
                최대 <em>30개사</em> 조건별 월 납입금 비교
              </div>
              {PREVIEW_PARTNERS.map((partner) => (
                <div className="qm-partner" key={partner.name}>
                  <span className="qm-partner__mark">
                    <img src={partner.logoUrl} alt="" />
                  </span>
                  <span className="qm-partner__name">{partner.name}</span>
                  <span className="qm-partner__price">
                    <strong>월 {partner.monthly}원</strong>
                    <small>*인수가 {partner.takeover}원</small>
                  </span>
                  <span className="qm-partner__arrow">›</span>
                </div>
              ))}
            </div>
            <p className="qm-preview__note">예시 화면입니다. 조건별 실제 월 납입금은 상담 시 안내드립니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
