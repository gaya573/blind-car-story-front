import React, { useState } from 'react';
import RotateLoading from './modals/RotateLoading';
import { getStoredUserPhone } from '../utils/phoneStorage';
import { handleKakaoPopupBlocked } from '../utils/kakaoPopup';
import { logButtonClick } from '../utils/analyticsUtils';

const KakaoConsultButton = ({
  isPrivacyAgreed,
  buildPayload,
  onNeedContactModal,
  className,
  style,
  imageClass,
  altText = "카카오톡으로 견적서 발송",
  analyticsId = 'kakao_consult_button', // 버튼별 식별용 ID (페이지별로 override 가능)
  analyticsEntryLabel, // 선택: 버튼 위치 설명 문자열
}) => {
  const [showRotateLoading, setShowRotateLoading] = useState(false);

  const normalizePhone = (value) => {
    if (!value) return '';
    return String(value).replace(/[^\d]/g, '').slice(0, 30);
  };

  const handleClick = () => {
    if (!isPrivacyAgreed) {
      alert('개인정보 이용 동의에 체크해 주세요.');
      return;
    }

    // 버튼 단위 로깅: 카카오 상담 버튼 클릭
    try {
      logButtonClick(analyticsId, {
        entryLabel: analyticsEntryLabel || altText,
      });
    } catch {
      // analytics 에러는 상담 흐름에 영향 주지 않도록 무시
    }

    // eslint-disable-next-line no-console
    console.info('[KakaoConsultButton] handleClick: privacy agreed, opening RotateLoading');
    setShowRotateLoading(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const processConsult = async () => {
    try {
      const { submitConsult } = await import('../services/consultHelper');

      // 1) 로컬스토리지에서 저장된 연락처 확인
      const storedPhone = getStoredUserPhone();
      const phone = normalizePhone(storedPhone);
      
      // eslint-disable-next-line no-console
      console.info('[KakaoConsultButton] processConsult: stored phone from localStorage', {
        phone,
      });

      // 2) 연락처 없으면 바로 모달 오픈 (카카오 OAuth 제거!)
      if (!phone) {
        // eslint-disable-next-line no-console
        console.warn('[KakaoConsultButton] processConsult: phone missing, opening contact modal');
        setShowRotateLoading(false);
        onNeedContactModal?.();
        return;
      }
      
      // 3) 연락처 있으면 바로 상담 신청
      const payload = await buildPayload(phone);
      // eslint-disable-next-line no-console
      console.info('[KakaoConsultButton] processConsult: payload built', payload);

      const result = await submitConsult(payload, {
        openKakaoOnSuccess: false,
        useKakao: false,  // 카카오 OAuth 사용 안 함
      });

      // eslint-disable-next-line no-console
      console.info('[KakaoConsultButton] processConsult: submitConsult result', result);

      // 성공 시 로딩 닫기
      if (result.success) {
        setShowRotateLoading(false);
        return;
      }

      // 실패 시 모달 띄우기
      setShowRotateLoading(false);
      onNeedContactModal?.();
    } catch (error) {
      console.error('[KakaoConsultButton] 상담 신청 실패', error);
      setShowRotateLoading(false);
      onNeedContactModal?.();
    }
  };

  return (
    <>
      <div
        className={className}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={style}
      >
        <img
          src="/mobile/상세페이지_카카오톡_버튼.svg"
          alt={altText}
          className={imageClass}
          loading="lazy"
        />
      </div>

      <RotateLoading
        open={showRotateLoading}
        onClose={() => setShowRotateLoading(false)}
        onComplete={processConsult}
      />
    </>
  );
};

export default KakaoConsultButton;

