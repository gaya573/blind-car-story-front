import React, { useState } from 'react';
import styles from '../pages/CarPromotion/Promotion.module.css';
import PrivacyConsentCheckbox from './PrivacyConsentCheckbox.jsx';
import { handleKakaoPopupBlocked, KAKAO_POPUP_BLOCKED_MESSAGE } from '../utils/kakaoPopup';
import { fetchPhoneWithKakaoFallback, KAKAO_OAUTH_CANCELLED_MESSAGE } from '../services/consultHelper';

/**
 * 펭귄 일러스트가 포함된 공통 하단 상담 배너
 *
 * @param {object} props
 * @param {string} props.model 상담 요청 시 model 필드에 들어갈 설명 텍스트
 * @param {string} props.consultType consultType 값
 * @param {string} props.source source 값
 * @param {string} props.entryLabel entryLabel 값
 */
const PenguinConsultBanner = ({ model, consultType, source, entryLabel }) => {
  const [isPrivacyAgreed, setIsPrivacyAgreed] = useState(true);
  const [supportMessage, setSupportMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPrivacyAgreed) {
      alert('개인정보 이용 동의에 체크해 주세요.');
      return;
    }
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const phoneInput = formData.get('phone');

    try {
      const { submitConsult } = await import('../services/consultHelper');
      const { phone, kakaoCancelled, validationMessage } = await fetchPhoneWithKakaoFallback(String(phoneInput || ''));
      if (!phone) {
        if (validationMessage) {
          alert(validationMessage);
          return;
        }
        setSupportMessage(
          kakaoCancelled
            ? KAKAO_OAUTH_CANCELLED_MESSAGE
            : '연락처를 입력해 주세요.',
        );
        return;
      }

      const result = await submitConsult(
        {
          name: name || '',
          phone: phone || '',
          brand: '',
          model,
          consultType,
          source,
          entryLabel,
        },
        {
          openKakaoOnSuccess: true,
          kakaoOpenTarget: '_blank',
        },
      );

      const handled = handleKakaoPopupBlocked(result, {
        onNeedContact: () => setSupportMessage(KAKAO_POPUP_BLOCKED_MESSAGE),
      });
      if (handled) {
        return;
      }

      if (result?.success) {
        e.target.reset();
        setSupportMessage('');
      } else if (result?.meta?.kakaoCancelled) {
        setSupportMessage(KAKAO_OAUTH_CANCELLED_MESSAGE);
      }
    } catch (error) {
      // UX 정책상 알림을 띄우지 않고 콘솔만 남김
      // (기존 Promotion 페이지 동작과 동일하게 유지)
      // eslint-disable-next-line no-console
      console.error('[PenguinConsultBanner] 상담 신청 실패', error);
    }
  };

  return (
    <>
      <section className={styles['promo-bottom-cta']}>
        <div className={styles['cta-visual']}>
          <div className={styles['cta-visual__badge']}>심사승인율 독보적 1위</div>
          <div className={styles['cta-visual__brand']}>블라인드 카스토리</div>
          <div className={styles['cta-visual__phone']}>1577 - 8319</div>
          <div className={styles['cta-visual__note']}>연중무휴 무료상담</div>
        </div>
        <div className={styles['cta-wrap']}>
          <div className={styles['cta__heading']}>“1:1 맞춤견적, 지금 바로 상담받기”</div>
          <form onSubmit={handleSubmit} className={styles['cta__form']}>
            <div className={styles['cta__fields']}>
              <div className={styles['cta__row']}>
                <label htmlFor="penguin-cta-name" className={styles['cta__label']}>
                  이름
                </label>
                <input
                  id="penguin-cta-name"
                  name="name"
                  className={styles['cta__input']}
                  type="text"
                  placeholder="이름"
                  aria-label="이름"
                />
              </div>
              <div className={styles['cta__row']}>
                <label htmlFor="penguin-cta-phone" className={styles['cta__label']}>
                  연락처
                </label>
                <input
                  id="penguin-cta-phone"
                  name="phone"
                  className={styles['cta__input']}
                  type="tel"
                  placeholder="연락처"
                  aria-label="연락처"
                />
              </div>
            </div>

            <div className={styles['cta__actions']}>
              <button className={styles['cta__submit']} type="submit">
                실시간 무료견적 받기
              </button>
            </div>
          </form>
          {supportMessage && (
            <p className={styles['cta__helper']}>{supportMessage}</p>
          )}
        </div>
      </section>

      <div className={styles['cta__privacy-outside']}>
        <PrivacyConsentCheckbox
          checked={isPrivacyAgreed}
          onChange={setIsPrivacyAgreed}
          align="right"
        />
      </div>
    </>
  );
};

export default PenguinConsultBanner;


