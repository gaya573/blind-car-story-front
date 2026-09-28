import React from 'react';
import { useConsultForm } from '../useConsultForm';
import PrivacyRow from './PrivacyRow';
import { SITE_NAME } from '../site';

/**
 * 퍼블리싱 .consult-banner (메인·출고후기·브랜드 혜택 상세에 반복되는 "1분 만에 카카오로 간편 상담" 배너).
 * 퍼블리싱에는 이 폼에 개인정보 동의가 없어서, 동의 없이 연락처를 받지 않도록 동의 줄을 더했다.
 */
export default function ConsultBannerForm({
  idPrefix,
  source,
  entryLabel,
  id,
  variant,
  description,
  title = `합리적인 신차구매, ${SITE_NAME}`,
  carModel = '',
  brand = '',
}) {
  const { handleSubmit, error, submitting } = useConsultForm({ source, entryLabel, defaults: { model: carModel, brand } });
  const titleId = id ? `${id}-title` : undefined;
  return (
    <section
      className={`consult-banner${variant ? ` consult-banner--${variant}` : ''}`}
      id={id}
      aria-label={titleId ? undefined : '상담 배너'}
      aria-labelledby={titleId}
    >
      <img className="consult-banner__car" src="/bcs/images/banner/consult-car-gold.png" alt="" aria-hidden="true" />
      <div className="consult-banner__left">
        <h3 id={titleId}>{title}</h3>
        <div className="consult-banner__phone">쉽고 투명한 신차 견적</div>
        {description ? <p>{description}</p> : null}
      </div>
      <form className="consult-banner__form" onSubmit={handleSubmit} noValidate>
        <h4>
          <img className="consult-banner__kakao" src="/bcs/images/banner/kakao-bubble.png" alt="" aria-hidden="true" />
          <span>
            <em>1분 만에</em> 카카오로 간편 상담
          </span>
        </h4>
        <div className="consult-banner__fields">
          <label htmlFor={`${idPrefix}-name`}>이름</label>
          <input className="consult-input" id={`${idPrefix}-name`} name="name" type="text" placeholder="ex) 이름" />
          <label htmlFor={`${idPrefix}-phone`}>연락처</label>
          <input className="consult-input" id={`${idPrefix}-phone`} name="phone" type="tel" inputMode="numeric" placeholder="ex) 01012345678" />
          <label htmlFor={`${idPrefix}-car`}>차종</label>
          <input className="consult-input" id={`${idPrefix}-car`} name="carModel" type="text" placeholder="ex) 쏘렌토" defaultValue={carModel} />
        </div>
        <PrivacyRow id={`${idPrefix}-privacy`} className="privacy-row consult-banner__privacy" />
        <button className="consult-banner__submit" type="submit" disabled={submitting}>
          <img src="/bcs/images/banner/cta-gold-button.png" alt={submitting ? '접수 중' : '실시간 무료견적 받기'} />
        </button>
        <p className="form-error">{error}</p>
      </form>
    </section>
  );
}
