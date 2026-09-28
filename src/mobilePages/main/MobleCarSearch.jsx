import React, { useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// useQuery 제거 (초기 로딩 안함)
import styles from './MobleCarSearch.module.css';
import { carAPI } from '../../services/carApi.js';
import { submitConsult, ensureConsultContact } from '../../services/consultHelper.js';
import MobileContactModal from '../../components/MobileContactModal.jsx';
import ConsultSuccessModal from '../../components/ConsultSuccessModal.jsx';
import PrivacyConsentCheckbox from '../../components/PrivacyConsentCheckbox.jsx';
import { handleKakaoPopupBlocked } from '../../utils/kakaoPopup';
import { getStoredUserPhone, setStoredUserPhone } from '../../utils/phoneStorage';
import Toast from '../../components/Toast.jsx';

const FEATURED_BRANDS = [
  {
    title: '국산차',
    type: 'domestic',
    items: [
      { name: '현대', image: '/brand/현대.svg' },
      { name: '기아', image: '/brand/kia.svg' },
      { name: '제네시스', image: '/brand/제네시스.svg' },
      { name: '르노코리아', image: '/brand/르노삼성.svg' },
      { name: 'KGM', image: '/brand/kgm.svg' },
      { name: '쉐보레', image: '/brand/쉐보레.svg' },
    ],
  },
  {
    title: '수입차',
    type: 'import',
    items: [
      { name: 'BMW', image: '/importbrands/bmw.svg' },
      { name: '벤츠', image: '/importbrands/벤츠.svg' },
      { name: '아우디', image: '/importbrands/아우디.svg' },
      { name: '폭스바겐', image: '/importbrands/폭스바겐.svg' },
      { name: '테슬라', image: '/importbrands/테슬라.svg' },
      { name: '볼보', image: '/importbrands/volvo.svg' },
      { name: '렉서스', image: '/importbrands/렉서스.svg' },
      { name: '토요타', image: '/importbrands/도요타.svg' },
      { name: '포드', image: '/importbrands/포드.svg' },
    ],
  },
];

export default function MobleCarSearch() {
  const navigate = useNavigate();
  const [isTopPrivacyAgreed, setIsTopPrivacyAgreed] = useState(true);
  const [contactModalConfig, setContactModalConfig] = useState(null);
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const isContactModalOpen = Boolean(contactModalConfig);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setIsToastVisible(true);
  }, []);

  const renderBrandSections = () =>
    FEATURED_BRANDS.map((section) => {
      const origin =
        section.type === 'domestic' ? 'domestic' : section.type === 'import' ? 'imported' : '';

      const goToResults = (brandName) => {
        const params = new URLSearchParams();
        params.set('brand', brandName);
        if (origin) params.set('carOrigin', origin);
        navigate(`/m/search/results?${params.toString()}`);
      };

      return (
        <section key={section.title} className={styles.section}>
          <h3 className={styles.sectionTitle}>{section.title}</h3>
          <div className={styles.grid}>
            {section.items.map((brand) => (
              <div
                key={`${section.title}-${brand.name}`}
                className={styles.brandCard}
                role="button"
                tabIndex={0}
                aria-label={`${brand.name} 차량 보기`}
                onClick={() => goToResults(brand.name)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goToResults(brand.name);
                  }
                }}
              >
                <div className={styles.brandImageWrapper}>
                  {brand.image ? (
                    <img
                      src={brand.image}
                      alt={brand.name}
                      loading="lazy"
                      className={styles.brandImage}
                    />
                  ) : (
                    <span className={styles.brandImageFallback}>{brand.name}</span>
                  )}
                </div>
                <span className={styles.brandLabel}>{brand.name}</span>
              </div>
            ))}
          </div>
        </section>
      );
    });

  const openContactModal = useCallback((payload, options = {}, meta = {}) => {
    setContactModalConfig({
      payload,
      options,
      successMessage: meta.successMessage,
    });
  }, []);

  const handleContactModalClose = useCallback(() => {
    if (isContactSubmitting) return;
    setContactModalConfig(null);
  }, [isContactSubmitting]);

  const handleContactModalSubmit = useCallback(
    async (phoneValue) => {
      if (!contactModalConfig) return;
      const phone = (phoneValue || '').trim();
      if (!phone) {
        alert('연락처를 입력해 주세요.');
        return;
      }

      setIsContactSubmitting(true);
      try {
        const result = await submitConsult(
          {
            ...contactModalConfig.payload,
            phone,
          },
          contactModalConfig.options || {},
        );

        // API 호출이 성공하면 무조건 성공 모달 표시
        if (result.success) {
          setContactModalConfig(null);
          setIsSuccessModalOpen(true);
          // 팝업 차단 처리 (모달 표시 이후에 처리)
          handleKakaoPopupBlocked(result);
        } else if (result?.meta?.phoneMissing) {
          alert('연락처를 다시 확인해 주세요.');
        } else {
          alert(result.message || '연락처 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
      } catch (error) {
        console.error('[MobleCarSearch] 연락처 등록 실패', error);
        alert('연락처 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setIsContactSubmitting(false);
      }
    },
    [contactModalConfig],
  );

  const sendKakaoConsult = useCallback(
    async (payload) => {
      try {
        const result = await submitConsult(payload, {
          kakaoOpenTarget: '_blank',
          openKakaoOnSuccess: true,
          useKakao: false,
        });

        const handled = handleKakaoPopupBlocked(result, {
          onNeedContact: () => {
            openContactModal(
              { ...payload, phone: '' },
              {
                initialPhone: '',
                openKakaoOnSuccess: true,
                kakaoOpenTarget: '_blank',
                useKakao: false,
              },
              {
                successMessage: '상담 신청이 접수되었습니다. 곧 상담사가 연락드립니다.',
              },
            );
          },
        });
        // API 호출이 성공하면 무조건 성공 모달 표시
        if (result.success) {
          if (payload.phone) {
            setStoredUserPhone(payload.phone);
          }
          if (payload.name) {
            localStorage.setItem('wgl_user_name', payload.name);
          }
          setIsSuccessModalOpen(true);
          // 팝업 차단 처리 (모달 표시 이후에 처리)
          handleKakaoPopupBlocked(result, {
            onNeedContact: () => {
              setContactModalConfig({
                payload: { ...payload, phone: '' },
                options: {
                  initialPhone: '',
                  openKakaoOnSuccess: true,
                  kakaoOpenTarget: '_blank',
                  useKakao: false,
                },
                successMessage: '상담 신청이 접수되었습니다. 곧 상담사가 연락드립니다.',
              });
            },
          });
        } else {
          alert(result.message || '카카오톡으로 연결하는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
      } catch (error) {
        console.error('[MobleCarSearch] 카카오 상담 전송 실패', error);
        alert('카카오톡으로 연결하는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    },
    [openContactModal, showToast],
  );

  const handleKakaoButtonClick = useCallback(async () => {
    if (!isTopPrivacyAgreed) {
      alert('개인정보 이용 동의에 체크해 주세요.');
      return;
    }

    const basePayload = {
      consultType: '카카오상담',
      source: 'search-page',
      entryLabel: '모바일 / 차량검색 / 간편 상담 신청',
      model: '모바일 차량검색 간편상담',
    };

    try {
      const savedPhone = getStoredUserPhone();
      const savedName = localStorage.getItem('wgl_user_name');

      if (savedPhone) {
        await sendKakaoConsult({
          ...basePayload,
          phone: savedPhone,
          name: savedName || '',
        });
        return;
      }

      // [카카오톡 버튼 전용] 카카오 OAuth 로그인 활성화
      const contactInfo = await ensureConsultContact(basePayload, {
        useKakao: true,
        requirePhone: false,
      });
      const enrichedPayload = contactInfo?.data ?? basePayload;

      if (!contactInfo?.phoneMissing && enrichedPayload.phone) {
        await sendKakaoConsult(enrichedPayload);
        return;
      }

      // 카카오 OAuth 실패 시 모달 열기
      openContactModal(
        enrichedPayload,
        {
          initialPhone: '',
          openKakaoOnSuccess: true,
          kakaoOpenTarget: '_blank',
          useKakao: false,
        },
        {
          successMessage: '상담 신청이 접수되었습니다. 곧 상담사가 연락드립니다.',
        },
      );
    } catch (error) {
      console.error('[MobleCarSearch] 카카오 버튼 처리 실패', error);
      openContactModal(
        basePayload,
        {
          initialPhone: '',
          openKakaoOnSuccess: true,
          kakaoOpenTarget: '_blank',
          useKakao: false,
        },
        {
          successMessage: '상담 신청이 접수되었습니다. 곧 상담사가 연락드립니다.',
        },
      );
    }
  }, [isTopPrivacyAgreed, openContactModal, sendKakaoConsult]);

  return (
    <>
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.lead}>
          <div className={styles.leadTitle}>어떤 차를 찾으세요?</div>
          <div className={styles.leadSub}>브랜드를 선택하여 원하시는 차량을 찾아보세요.</div>
        </div>
      </div>

      {/* 상단 상담 버튼 섹션 */}
      <section className={styles.topButtonSection}>
        <div className={styles.topButtonWrapper}>
          <button
            type="button"
            className={`${styles.topButton} ${styles.topButtonBlue}`}
            onClick={() => {
              if (!isTopPrivacyAgreed) {
                alert('개인정보 이용 동의에 체크해 주세요.');
                return;
              }

              // 로컬 스토리지 확인 (모달에 번호 프리필용)
          const savedPhone = getStoredUserPhone();

              openContactModal(
                  {
                    consultType: '휴대폰연락',
                    source: 'search-page',
                    entryLabel: '모바일 / 차량검색 / 상단 전화 문의',
                    model: '모바일 차량검색 상단 전화 문의',
                  },
                  {
                    initialPhone: savedPhone || '',
                    openKakaoOnSuccess: false,
                    useKakao: false,
                  },
                {
                  successMessage: '상담 신청이 접수되었습니다. 곧 상담사가 연락드립니다.',
                },
                );
            }}
          >
            <img
              src="/mobile/연락이모지.svg"
              alt="전화 상담"
              className={styles.topButtonIcon}
              loading="lazy"
            />
            <div className={styles.topButtonTexts}>
              <span className={styles.topButtonLabel}>문의</span>
              <span className={styles.topButtonMain}>1577-8319</span>
              <span className={styles.topButtonSub}>지금 바로 무료 상담</span>
            </div>
          </button>

          <button
            type="button"
            className={`${styles.topButton} ${styles.topButtonYellow}`}
            onClick={handleKakaoButtonClick}
          >
            <img
              src="/mobile/카카오톡.svg"
              alt="카카오톡 상담"
              className={styles.topButtonIcon}
              loading="lazy"
            />
            <div className={styles.topButtonTexts}>
              <span className={styles.topButtonMain}>간편 상담 신청</span>
              <span className={styles.topButtonSub}>1분만에 간편상담</span>
            </div>
          </button>
        </div>
        <PrivacyConsentCheckbox
          checked={isTopPrivacyAgreed}
          onChange={setIsTopPrivacyAgreed}
          align="right"
        />
      </section>

      {renderBrandSections()}

      {/* 기존 Top Cars 섹션 제거됨 (요청사항 반영) */}

      <div className={styles.bottomSpacer} />

      <MobileContactModal
        open={isContactModalOpen}
        onClose={handleContactModalClose}
        onSubmit={handleContactModalSubmit}
        isSubmitting={isContactSubmitting}
        initialPhone=""
      />
      <ConsultSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </div>
      <Toast
        message={toastMessage}
        visible={isToastVisible}
        duration={1000}
        onClose={() => setIsToastVisible(false)}
        position="bottom"
      />
    </>
  );
}
