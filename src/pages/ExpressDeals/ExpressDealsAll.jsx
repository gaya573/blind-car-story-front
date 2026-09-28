import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Breadcrumb from '../../components/Breadcrumb';
import PromotionCard from '../../components/PromotionCard';
import BrowserContactModal from '../../components/BrowserContactModal.jsx';
import ConsultSuccessModal from '../../components/ConsultSuccessModal.jsx';
import styles from './ExpressDealsAll.module.css';
import { contentAPI } from '../../services/contentApi';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { getPageSeo } from '../../config/seoConfig';
import {
  sendToKakaoOnly,
  KAKAO_OAUTH_CANCELLED_MESSAGE,
  acquireContactViaKakao,
} from '../../services/consultHelper';
import { getStoredUserPhone, setStoredUserPhone } from '../../utils/phoneStorage';
import { KAKAO_POPUP_BLOCKED_MESSAGE } from '../../utils/kakaoPopup';

const CONTACT_PROMPT_DEFAULT = '카카오 상담을 위해 인증창을 열고 있습니다. 창이 닫히면 아래에 연락처를 남겨 주세요.';
const CONTACT_LOADING_MESSAGE = '카카오 상담을 위해 인증창을 열고 있습니다. 인증이 끝나면 자동으로 닫혀요.';
const FALLBACK_IMAGE = '/placeholder/car.svg';

const ExpressDealsAll = () => {
  const navigate = useNavigate();
  const [contactModalPayload, setContactModalPayload] = useState(null);
  const [contactModalMessage, setContactModalMessage] = useState(null);
  const [contactModalInitialPhone, setContactModalInitialPhone] = useState('');
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const isContactModalOpen = Boolean(contactModalPayload);

  const breadcrumbItems = useMemo(
    () => [
      { label: '홈', link: '/' },
      { label: '재고특가핫딜', link: '/express-deals' },
      { label: '오늘 출고 마감 차량' },
    ],
    [],
  );

  const { data: listData = [], isLoading } = useQuery({
    queryKey: ['express-deals', 'all'],
    // 전체 목록 조회 (limit을 크게 잡음)
    queryFn: () => contentAPI.getUrgentInventory(100, null, null, null),
    staleTime: 1000 * 60,
  });

  const sanitizePhoneForStorage = useCallback((value) => {
    if (!value) return '';
    const str = String(value).trim();
    return str.length > 30 ? str.slice(0, 30) : str;
  }, []);

  const persistContactInfo = useCallback((phoneValue, nameValue) => {
    const sanitizedPhone = sanitizePhoneForStorage(phoneValue);
    if (!sanitizedPhone) return;
    setStoredUserPhone(sanitizedPhone);
    if (nameValue) {
      localStorage.setItem('wgl_user_name', nameValue);
    }
  }, [sanitizePhoneForStorage]);

  const openContactModalWithPayload = useCallback(
    (payload, message = CONTACT_PROMPT_DEFAULT, initialPhone = '') => {
      setContactModalPayload(payload);
      setContactModalMessage(message);
      setContactModalInitialPhone(initialPhone || payload?.phone || '');
    },
    [],
  );

  const handleContactModalClose = useCallback(() => {
    if (isContactSubmitting) return;
    setContactModalPayload(null);
    setContactModalMessage(null);
    setContactModalInitialPhone('');
  }, [isContactSubmitting]);

  const startKakaoContactFlow = useCallback(
    async (payload) => {
      const contactInfo = await acquireContactViaKakao(
        payload,
        {
          openModal: () =>
            openContactModalWithPayload(
              payload,
              CONTACT_LOADING_MESSAGE,
              payload?.phone || '',
            ),
          updateModal: (stage) => {
            if (stage === 'start') {
              setContactModalMessage(
                '카카오 로그인 창이 열렸습니다. 창을 닫으면 아래에 연락처를 남겨 주세요.',
              );
            } else if (stage === 'success') {
              setContactModalMessage('카카오 인증이 완료되었습니다. 상담창을 준비하고 있어요.');
            } else if (stage === 'fail') {
              setContactModalMessage(KAKAO_OAUTH_CANCELLED_MESSAGE);
            }
          },
          closeModal: () => handleContactModalClose(),
        },
        { requirePhone: false },
      );

      if (contactInfo?.phoneMissing) {
        const sanitizedPhone = sanitizePhoneForStorage(contactInfo.data?.phone);
        openContactModalWithPayload(
          {
            ...(contactInfo.data ?? payload),
            phone: sanitizedPhone,
          },
          contactInfo?.kakaoCancelled ? KAKAO_OAUTH_CANCELLED_MESSAGE : CONTACT_PROMPT_DEFAULT,
          sanitizedPhone || '',
        );
        return null;
      }

      return contactInfo;
    },
    [handleContactModalClose, openContactModalWithPayload, sanitizePhoneForStorage],
  );

  const handleConsultClick = useCallback(
    async (item) => {
      if (!item) return;
      const payload = {
        brand: item.extraInfo ?? item.brand ?? '',
        model: item.title ?? item.name ?? '',
        trim: item.trimId ?? item.id ?? null,
        consultType: '재고문의',
        source: 'express-deals-all',
        entryLabel: `express-deals-all > 재고문의 > ${item.title ?? item.name ?? ''}`,
      };

      try {
        const savedPhone = sanitizePhoneForStorage(getStoredUserPhone());
        const savedName = localStorage.getItem('wgl_user_name');

        if (savedPhone) {
          const enriched = { ...payload, phone: savedPhone, name: savedName || '' };
          const result = await sendToKakaoOnly(enriched);
          
          // API 호출이 성공하면 무조건 성공 모달 표시
          if (result?.success) {
            persistContactInfo(enriched.phone, enriched.name);
            setIsSuccessModalOpen(true);
            return;
          }
          
          if (result?.reason === 'popup_blocked' && enriched.phone) return;
          openContactModalWithPayload(
            { ...enriched, phone: '' },
            '카카오톡으로 보내는 데 실패했습니다. 아래에 연락처를 남겨 주세요.',
            enriched.phone || '',
          );
          return;
        }

        const contactInfo = await startKakaoContactFlow(payload);
        if (!contactInfo) return;
        
        const enriched = {
          ...(contactInfo?.data ?? payload),
          phone: sanitizePhoneForStorage(contactInfo?.data?.phone),
        };
        const result = await sendToKakaoOnly(enriched);
        
        // API 호출이 성공하면 무조건 성공 모달 표시
        if (result?.success) {
          persistContactInfo(enriched.phone, enriched.name);
          setIsSuccessModalOpen(true);
          return;
        }

        if (result?.reason === 'popup_blocked') {
          if (enriched.phone) return;
          openContactModalWithPayload(
            { ...enriched, phone: '' },
            KAKAO_POPUP_BLOCKED_MESSAGE,
            enriched.phone || '',
          );
        } else {
          openContactModalWithPayload(
            { ...enriched, phone: '' },
            '카카오 상담 전송에 실패했습니다. 아래에 연락처를 남겨 주세요.',
            enriched.phone || '',
          );
        }
      } catch (error) {
        console.error('[ExpressDealsAll] 연락처 확보 실패', error);
        openContactModalWithPayload(payload, '연락처를 자동으로 확보하지 못했습니다. 아래에 연락처를 남겨 주세요.', '');
      }
    },
    [openContactModalWithPayload, persistContactInfo, startKakaoContactFlow, sanitizePhoneForStorage],
  );

  const handleContactModalSubmit = useCallback(
    async (phoneValue, nameValue) => {
      if (!contactModalPayload) return;
      const phone = sanitizePhoneForStorage(phoneValue || '');
      const name = (nameValue || '').trim();

      if (!phone) {
        setContactModalMessage('연락처를 입력해 주세요.');
        return;
      }
      setIsContactSubmitting(true);
      try {
        const enriched = { ...contactModalPayload, phone, name };
        const result = await sendToKakaoOnly(enriched);

        // API 호출이 성공하면 무조건 성공 모달 표시
        if (result?.success) {
          persistContactInfo(phone, name);
          setContactModalPayload(null);
          setContactModalMessage(null);
          setContactModalInitialPhone('');
          setIsSuccessModalOpen(true);
        } else {
          setContactModalMessage(result?.message || '연락처 등록에 실패했습니다. 다시 시도해주세요.');
        }
      } catch (error) {
        setContactModalMessage('연락처 등록에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsContactSubmitting(false);
      }
    },
    [contactModalPayload, persistContactInfo, sanitizePhoneForStorage],
  );

  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = getPageSeo('express-deals');

  return (
    <>
      <SeoHelmet
        title={`[전체보기] ${seoTitle}`}
        description={seoDescription}
        keywords={seoKeywords}
      />
      <div className={styles['page-wrapper']}>
        {/* Top Banner Removed */}
        <div className={styles['content-container']}>
          <Breadcrumb items={breadcrumbItems} />

          <div className={styles['section-header']}>
            <span className={styles['siren-icon']}>🚨</span>
            <h2>[긴급] 오늘 출고 마감 차량!</h2>
          </div>

          {isLoading ? (
            <div className={styles['loading']}>차량 목록을 불러오는 중입니다...</div>
          ) : (
            <div className={styles['grid-container']}>
              {listData.map((item) => (
                <PromotionCard
                  key={item.id}
                  id={item.id}
                  name={item.title ?? '재고출고 차량'}
                  desc={item.subtitle ?? item.description ?? '빠른 출고 가능'}
                  img={item.imageUrl ?? FALLBACK_IMAGE}
                  brand={item.extraInfo ?? '블라인드 카스토리'}
                  basePrice={item.basePrice}
                  finalPrice={item.finalPrice}
                  discountPercent={item.discountPercent}
                  monthlyRentalFee={item.monthlyRentalFee}
                  discountedMonthlyFee={item.discountedMonthlyFee}
                  monthlyDiscountPercent={item.monthlyDiscountPercent}
                  badgeText={item.remainingQuantity ? `재고출고 ${item.remainingQuantity}대 남음` : null}
                  badgeVariant="red"
                  variant="medium"
                  onClick={() => handleConsultClick(item)}
                  onButtonClick={() => handleConsultClick(item)}
                  buttonText="실시간 무료견적 받기"
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Consult Banner (Reused from Home style) */}
        <section className={styles['consult-banner']}>
          <div className={styles['consult-banner-left']}>
            <img src="/home/모바일.svg" alt="모바일 앱" className={styles['consult-phone-img']} />
            <div className={styles['consult-text-group']}>
              <div className={styles['consult-text-title']}>심사승인율 독보적 1위 블라인드 카스토리</div>
              <div className={styles['consult-number']}>1577 - 8319</div>
              <div className={styles['consult-subtext']}>*언제든지 무료상담/문의 가능합니다.</div>
            </div>
          </div>
          
          <div className={styles['consult-banner-right']}>
            <div className={styles['consult-form-title']}>1분만에 카카오로 스으윽~~~</div>
            <form 
              className={styles['consult-form-container']}
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const name = formData.get('name') || '';
                const phoneInput = formData.get('phone') || '';
                const carModel = formData.get('carModel') || '';

                try {
                  const { submitConsult } = await import('../../services/consultHelper');
                  const { fetchPhoneWithKakaoFallback } = await import('../../services/consultHelper');
                  const { phone, validationMessage } = await fetchPhoneWithKakaoFallback(String(phoneInput || ''));
                  
                  if (!phone) {
                    if (validationMessage) {
                      alert(validationMessage);
                      return;
                    }
                    openContactModalWithPayload(
                      { name, phone: '', carModel, consultType: '비대면견적', source: 'express-deals-all-bottom' },
                      '연락처를 입력해 주세요.'
                    );
                    return;
                  }

                  const payload = {
                    name: name || '',
                    phone,
                    model: carModel,
                    consultType: '비대면견적',
                    source: 'express-deals-all-bottom',
                    entryLabel: '재고특가 전체보기 > 하단 배너 상담',
                  };

                  const result = await submitConsult(payload, { openKakaoOnSuccess: true, kakaoOpenTarget: '_blank' });
                  if (result?.success) {
                    e.target.reset();
                    persistContactInfo(phone, name);
                  }
                } catch (error) {
                  console.error(error);
                }
              }}
            >
              <div className={styles['consult-inputs']}>
                <div className={styles['consult-input-row']}>
                  <label className={styles['consult-label']}>이름</label>
                  <input type="text" name="name" className={styles['consult-input']} placeholder="ex) 홍길동" required />
                </div>
                <div className={styles['consult-input-row']}>
                  <label className={styles['consult-label']}>연락처</label>
                  <input type="tel" name="phone" className={styles['consult-input']} placeholder="ex) 01012345678" required />
                </div>
                <div className={styles['consult-input-row']}>
                  <label className={styles['consult-label']}>차종</label>
                  <input type="text" name="carModel" className={styles['consult-input']} placeholder="ex) 쏘렌토" />
                </div>
              </div>
              <button type="submit" className={styles['consult-submit-btn']}>
                상담신청
                <img src="/home/손모양.png" alt="" className={styles['consult-hand-img']} />
              </button>
            </form>
          </div>
        </section>

        <BrowserContactModal
          open={isContactModalOpen}
          onClose={handleContactModalClose}
          onSubmit={handleContactModalSubmit}
          isSubmitting={isContactSubmitting}
          description={contactModalMessage || undefined}
          initialPhone=""
        />
        <ConsultSuccessModal
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
        />
      </div>
    </>
  );
};

export default ExpressDealsAll;
