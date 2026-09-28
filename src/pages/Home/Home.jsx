import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeStyle from './Home.module.css';
import { CarCard } from '../../components/CarCard';
import YoutubeCard from '../../components/YoutubeCard';
import SpecialOffersSection from '../../components/SpecialOffersSection';
import PromotionCard from '../../components/PromotionCard';
import ConsultBanner from '../../components/ConsultBanner';
import ComparisonSection from '../../components/HOME/ComparisonSection';
import LumpSumSection from '../../components/HOME/LumpSumSection';
import { useHomeContent } from '../../hooks/queries/useHomeContent';
import PrivacyConsentCheckbox from '../../components/PrivacyConsentCheckbox.jsx';
import GlobalBanner from '../../components/GlobalBanner';
import { carAPI } from '../../services/carApi';
import { contentAPI } from '../../services/contentApi';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import StructuredData, { getOrganizationSchema, getLocalBusinessSchema } from '../../components/StructuredData.jsx';
import { getPageSeo } from '../../config/seoConfig';
import { handleKakaoPopupBlocked, KAKAO_POPUP_BLOCKED_MESSAGE } from '../../utils/kakaoPopup';
import BrowserContactModal from '../../components/BrowserContactModal.jsx';
import ConsultSuccessModal from '../../components/ConsultSuccessModal.jsx';
import {
  sendToKakaoOnly,
  fetchPhoneWithKakaoFallback,
  KAKAO_OAUTH_CANCELLED_MESSAGE,
  acquireContactViaKakao,
} from '../../services/consultHelper';
import {
  getPhoneValidationMessage,
  getStoredUserPhone,
  setStoredUserPhone,
  sanitizePhoneForStorage as sanitizePhone,
} from '../../utils/phoneStorage';
import {
  buildSpecialOffers,
  buildTopCarsList,
  buildClosingSoonCards,
  findShortestDeadline,
  buildPromoSourceItems,
  pickHomeSeoImage,
} from '../../utils/homeDataMappers';
import { useCountdown } from '../../hooks/useCountdown';
import { usePromoPricingMap } from '../../hooks/usePromoPricingMap';
import { PARTNER_CARDS } from '../../config/partnerCards';
import { navigateToCarTrimDetail } from '../../utils/navigateToCarDetail';
const CONTACT_LOADING_MESSAGE =
  '카카오 상담을 위해 인증창을 열고 있습니다. 인증이 끝나면 자동으로 닫혀요.';
const CONTACT_PROMPT_DEFAULT =
  '카카오 상담을 위해 인증창을 열고 있습니다. 창을 닫으면 아래에 연락처를 남겨 주세요.';

const Home = () => {
  const navigate = useNavigate();
  const {
    heroBanner,
    closingSoon,
    topCars,
    brandPromotions,
    urgentInventory,
    hotDeals,
  } = useHomeContent();

  const [isQuotePrivacyAgreed, setIsQuotePrivacyAgreed] = useState(true);
  const [quoteFormMessage, setQuoteFormMessage] = useState('');
  const [contactModalPayload, setContactModalPayload] = useState(null);
  const [contactModalMessage, setContactModalMessage] = useState('');
  const [contactModalInitialPhone, setContactModalInitialPhone] = useState('');
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const isContactModalOpen = Boolean(contactModalPayload);
  const sanitizePhoneForStorage = useCallback((value) => {
    return sanitizePhone(value);
  }, []);

  const persistContactInfo = useCallback((phoneValue, nameValue) => {
    const sanitized = sanitizePhoneForStorage(phoneValue);
    if (!sanitized) return;
    setStoredUserPhone(sanitized);
    if (nameValue) {
      localStorage.setItem('wgl_user_name', nameValue);
    }
  }, [sanitizePhoneForStorage]);

  const openContactModalWithPayload = useCallback(
    (payload, message = CONTACT_LOADING_MESSAGE, initialPhone = '') => {
      setContactModalPayload(payload);
      setContactModalMessage(message);
      setContactModalInitialPhone(initialPhone || payload?.phone || '');
    },
    [],
  );

  const handleContactModalClose = useCallback(() => {
    if (isContactSubmitting) return;
    setContactModalPayload(null);
    setContactModalMessage('');
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

  // 배너 슬라이드 상태 (메인 탑 배너만 사용)
  const [bannerIndex, setBannerIndex] = useState(0);
  const rawHeroBanners = heroBanner?.data ?? [];
  const heroBannerArray = Array.isArray(rawHeroBanners)
    ? rawHeroBanners
    : (rawHeroBanners ? [rawHeroBanners] : []);

  // position이 TOP 이거나 position이 없는 경우만 메인 히어로 배너로 사용
  const validBanners = heroBannerArray
    .filter(Boolean)
    .filter((banner) => {
      const pos = banner?.position || banner?.positionType;
      if (!pos) return true; // 예전 데이터 호환: position 없으면 TOP 취급
      return pos === 'TOP';
    });

  // 배너 데이터 변경 시 인덱스 리셋
  useEffect(() => {
    setBannerIndex(0);
  }, [validBanners.length]);

  // 무한 루프를 위해 카드 리스트 2배로 복제
  const loopPartnerCards = useMemo(
    () => [...PARTNER_CARDS, ...PARTNER_CARDS],
    [],
  );

  // 특가 차량 섹션: 선구매 핫딜(/api/content/pre-purchase) 기준으로 구성
  const specialOffers = useMemo(
    () => buildSpecialOffers(hotDeals?.data),
    [hotDeals?.data],
  );

  const topCarsList = useMemo(
    () => buildTopCarsList(topCars?.data),
    [topCars?.data],
  );

  const closingSoonCards = useMemo(
    () => buildClosingSoonCards(closingSoon?.data),
    [closingSoon?.data],
  );

  const limitedSpecialOffers = useMemo(
    () => specialOffers.slice(0, 8),
    [specialOffers],
  );

  // 3개 중 가장 짧은 마감 시간 찾기
  const shortestDeadline = useMemo(
    () => findShortestDeadline(closingSoonCards),
    [closingSoonCards],
  );

  const buildHomeConsultPayload = useCallback(
    (item) => ({
      brand: item?.brand ?? '',
      model: item?.name ?? '',
      trim: item?.trimId ?? item?.id ?? null,
      consultType: '카카오상담',
      source: 'home-page',
      entryLabel: `홈 > 마감임박 > ${item?.name ?? ''}`,
    }),
    [],
  );

  const handleHomeConsultClick = useCallback(
    async (item) => {
      if (!item) return;
      const payload = buildHomeConsultPayload(item);
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
          
          if (result?.reason === 'popup_blocked' && enriched.phone) {
            return;
          }
          openContactModalWithPayload(
            { ...enriched, phone: '' },
            '카카오톡으로 보내는 데 실패했습니다. 아래에 연락처를 남겨 주세요.',
            enriched.phone || '',
          );
          return;
        }

        const contactInfo = await startKakaoContactFlow(payload);
        if (!contactInfo) {
          return;
        }
        const phoneFromContact = sanitizePhoneForStorage(contactInfo?.data?.phone);
        const enriched = {
          ...(contactInfo?.data ?? payload),
          phone: phoneFromContact,
        };
        const result = await sendToKakaoOnly(enriched);
        
        // API 호출이 성공하면 무조건 성공 모달 표시
        if (result?.success) {
          persistContactInfo(enriched.phone, enriched.name);
          setIsSuccessModalOpen(true);
        } else if (result?.reason === 'popup_blocked') {
          if (enriched.phone) {
            return;
          }
          openContactModalWithPayload(
            { ...enriched, phone: '' },
            KAKAO_POPUP_BLOCKED_MESSAGE,
            enriched.phone || '',
          );
        } else {
          openContactModalWithPayload(
            { ...enriched, phone: '' },
            '카카오톡으로 보내는 데 실패했습니다. 아래에 연락처를 남겨 주세요.',
            enriched.phone || '',
          );
        }
      } catch (error) {
        console.error('[Home] 연락처 확보 실패', error);
        openContactModalWithPayload(
          payload,
          '연락처를 자동으로 확보하지 못했습니다. 아래에 연락처를 남겨 주세요.',
          '',
        );
      }
    },
    [buildHomeConsultPayload, openContactModalWithPayload, persistContactInfo, sanitizePhoneForStorage, startKakaoContactFlow],
  );

  const handleContactModalSubmit = useCallback(
    async (phoneValue, nameValue) => {
      if (!contactModalPayload) return;
      const phoneValidationMessage = getPhoneValidationMessage(phoneValue || '');
      if (phoneValidationMessage) {
        setContactModalMessage(phoneValidationMessage);
        return;
      }

      const phone = sanitizePhoneForStorage(phoneValue || '');
      const name = (nameValue || '').trim();

      if (!phone) {
        setContactModalMessage('연락처를 입력해 주세요.');
        return;
      }
      setIsContactSubmitting(true);
      try {
        const payload = {
          ...contactModalPayload,
          phone,
          name,
        };

        const { submitConsult } = await import('../../services/consultHelper');
        const result = await submitConsult(payload, {
          openKakaoOnSuccess: false, // 여기서는 DB 저장만 보장
          useKakao: false,
        });

        // API 호출이 성공하면 무조건 성공 모달 표시
        if (result?.success) {
          persistContactInfo(phone, name);
          setContactModalPayload(null);
          setContactModalMessage('');
          setContactModalInitialPhone('');
          setIsSuccessModalOpen(true);
        } else {
          setContactModalMessage(
            result?.message || '연락처 등록에 실패했습니다. 다시 시도해주세요.',
          );
        }
      } catch (error) {
        console.error('[Home] handleContactModalSubmit: 연락처 등록 실패', error);
        setContactModalMessage('연락처 등록에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsContactSubmitting(false);
      }
    },
    [contactModalPayload, persistContactInfo, sanitizePhoneForStorage],
  );

  const handleConsultBannerSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const name = formData.get('name') || '';
      const phoneInput = formData.get('phone') || '';
      const carModel = formData.get('carModel') || '';

      try {
        const { submitConsult } = await import('../../services/consultHelper');
        const { phone, kakaoCancelled, validationMessage } = await fetchPhoneWithKakaoFallback(String(phoneInput || ''));

        if (!phone) {
          if (validationMessage) {
            alert(validationMessage);
            return;
          }
          const message = kakaoCancelled ? KAKAO_OAUTH_CANCELLED_MESSAGE : '연락처를 입력해 주세요.';
          setContactModalMessage(
            message,
          );
          setContactModalPayload(null);
          openContactModalWithPayload(
            { name, phone: '', carModel, consultType: '비대면견적', source: 'home-bottom-banner' },
            message,
          );
          return;
        }

        const payload = {
          name: name || '',
          phone,
          model: carModel,
          consultType: '비대면견적',
          source: 'home-bottom-banner',
          entryLabel: '홈 > 하단 배너 상담',
        };

        const result = await submitConsult(payload, { openKakaoOnSuccess: true, kakaoOpenTarget: '_blank' });

        const handled = handleKakaoPopupBlocked(result, {
          onNeedContact: () => {
            openContactModalWithPayload(payload, KAKAO_POPUP_BLOCKED_MESSAGE);
          },
        });
        if (handled) return;

        if (result?.success) {
          e.target.reset();
          persistContactInfo(phone, name);
        }
      } catch (error) {
        console.error('[Home] 하단 배너 상담 신청 실패', error);
      }
    },
    [fetchPhoneWithKakaoFallback, handleKakaoPopupBlocked, openContactModalWithPayload, persistContactInfo, setContactModalMessage, setContactModalPayload],
  );

  // SEO용 대표 이미지: 히어로 배너 > 마감임박 > 주간 인기차량 순으로 우선 사용
  const seoImage = useMemo(
    () => pickHomeSeoImage({ heroBanners: validBanners, closingSoonCards, topCarsList }),
    [validBanners, closingSoonCards, topCarsList],
  );

  const handleNavigateToDetail = (car) => {
    if (!car?.trimId) return;
    navigateToCarTrimDetail(navigate, car.trimId, {
      brand: car.brand,
      model: car.name,
      terms: car.year ? `${car.year}, ${car.mileage}` : '',
    });
  };

  // 가장 짧은 마감 시간을 기준으로 카운트다운 계산
  const timeLeft = useCountdown(shortestDeadline);

  const promoSourceItems = useMemo(
    () => buildPromoSourceItems(closingSoonCards, limitedSpecialOffers),
    [closingSoonCards, limitedSpecialOffers],
  );

  const promoPriceMap = usePromoPricingMap(promoSourceItems);

  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = getPageSeo('home');

  return (
    <>
      <SeoHelmet
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={seoImage}
      />
      <StructuredData data={getOrganizationSchema()} />
      <StructuredData data={getLocalBusinessSchema()} />
      <div>
        <div className={HomeStyle['home']}>
          {/* Hero Section을 page-container 밖으로 뺌 */}
          <section className={HomeStyle['hero-section-full-width']}>
            <div className={HomeStyle['hero-content-centered']}>
              <div className={HomeStyle['main-hero-section']}>
                <section className={HomeStyle['hero-banner-wrapper']}>
                  {heroBanner?.isLoading && <p className={HomeStyle['section-subtitle']}>히어로 배너 로딩 중...</p>}
                  {heroBanner?.isError && <p className={HomeStyle['section-subtitle']}>히어로 배너를 불러오지 못했습니다.</p>}
                  {validBanners.length > 0 && !heroBanner?.isLoading && !heroBanner?.isError && (
                    <>
                      <div className={HomeStyle['hero-banner-track']} style={{ transform: `translateX(-${bannerIndex * 860}px)` }}>
                        {validBanners.map((banner, index) => (
                          <div
                            key={banner.id || index}
                            className={HomeStyle['hero-banner']}
                            style={banner?.imageUrl ? { backgroundImage: `url("${banner.imageUrl}")` } : undefined}
                          />
                        ))}
                      </div>
                      {validBanners.length > 1 && (
                        <div className={HomeStyle['hero-banner-pager']}>
                          <button
                            type="button"
                            className={HomeStyle['hero-banner-arrow']}
                            onClick={() => setBannerIndex((prev) => (prev - 1 + validBanners.length) % validBanners.length)}
                            aria-label="이전"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="15 18 9 12 15 6" />
                            </svg>
                          </button>
                          <span className={HomeStyle['hero-banner-pager-text']}>
                            {bannerIndex + 1}/{validBanners.length}
                          </span>
                          <button
                            type="button"
                            className={HomeStyle['hero-banner-arrow']}
                            onClick={() => setBannerIndex((prev) => (prev + 1) % validBanners.length)}
                            aria-label="다음"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </section>

                <div className={HomeStyle['quote-form-section']}>
                  <div className={HomeStyle['quote-form-card']}>
                    <div className={HomeStyle['form-header']}>
                      <h3><span>실시간</span> 견적문의</h3>
                    </div>

                    <form 
                      className={HomeStyle['quote-form']}
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!isQuotePrivacyAgreed) {
                          setQuoteFormMessage('개인정보 이용 동의에 체크해 주세요.');
                          return;
                        }
                        const formData = new FormData(e.target);
                        const name = formData.get('name') || '';
                        const phoneInput = formData.get('phone') || '';
                        const brand = formData.get('brand') || '';
                        const model = formData.get('model') || '';
                        const period = formData.get('period') || '';

                        // 버튼 클릭 / 폼 제출 로깅
                        // eslint-disable-next-line no-console
                        console.info('[Home] quote-form submit: button clicked', {
                          name,
                          phoneInput,
                          brand,
                          model,
                          period,
                        });
                        
                        try {
                          setQuoteFormMessage('');
                          const { submitConsult } = await import('../../services/consultHelper');
                          const { phone, kakaoCancelled, validationMessage } = await fetchPhoneWithKakaoFallback(String(phoneInput || ''));
                          // eslint-disable-next-line no-console
                          console.info('[Home] quote-form submit: phone fallback result', {
                            typedPhone: phoneInput,
                            finalPhone: phone,
                            kakaoCancelled,
                            validationMessage,
                          });
                          if (!phone) {
                            const message = kakaoCancelled
                              ? KAKAO_OAUTH_CANCELLED_MESSAGE
                              : validationMessage || '연락처를 입력해 주세요.';
                            if (validationMessage) {
                              alert(validationMessage);
                            }
                            setQuoteFormMessage(message);
                            return;
                          }
                          const payload = {
                            name: name || '',
                            phone,
                            brand,
                            model,
                            contractPeriod: period,
                            consultType: '비대면견적',
            source: 'home-page',
            entryLabel: '홈 > 실시간 견적문의',
          };
          const result = await submitConsult(payload, { openKakaoOnSuccess: true, kakaoOpenTarget: '_blank' });
          
          const handled = handleKakaoPopupBlocked(result, {
                            onNeedContact: () => {
                              setQuoteFormMessage(KAKAO_POPUP_BLOCKED_MESSAGE);
                            },
                          });
                          if (handled) {
                            return;
                          }
                          
                          if (result?.success) {
                            e.target.reset();
                            setQuoteFormMessage('');
                            persistContactInfo(phone, name);
                          } else if (result?.meta?.kakaoCancelled) {
                            setQuoteFormMessage(KAKAO_OAUTH_CANCELLED_MESSAGE);
                          }
                        } catch (error) {
                          console.error('[Home] 상담 신청 실패', error);
                          // UX 정책상 알림 팝업 미표시
                          setQuoteFormMessage(KAKAO_OAUTH_CANCELLED_MESSAGE);
                        }
                      }}
                    >
                      <div className={HomeStyle['form-group']}>
                        <label>
                          성함
                        </label>
                        <input type="text" name="name" placeholder="ex) 홍길동" />
                      </div>

                      <div className={HomeStyle['form-group']}>
                        <label>
                          연락처<span className={HomeStyle['required']}>*</span>
                        </label>
                        <input type="tel" name="phone" placeholder="ex) 01012345678" required />
                      </div>

                      <div className={HomeStyle['form-row']}>
                         <select name="brand" className={HomeStyle['form-select']}>
                           <option value="" disabled selected>브랜드</option>
                           <option value="hyundai">현대</option>
                           <option value="kia">기아</option>
                           <option value="genesis">제네시스</option>
                           <option value="bmw">BMW</option>
                           <option value="benz">Benz</option>
                         </select>
                      </div>

                      <div className={HomeStyle['form-row-half']}>
                        <select name="model" className={HomeStyle['form-select']}>
                           <option value="" disabled selected>모델</option>
                           <option value="avante">아반떼</option>
                           <option value="sonata">쏘나타</option>
                           <option value="grandeur">그랜저</option>
                           <option value="sportage">스포티지</option>
                           <option value="sorento">쏘렌토</option>
                           <option value="carnival">카니발</option>
                         </select>
                        <select name="period" className={HomeStyle['form-select']}>
                           <option value="" disabled selected>계약기간</option>
                           <option value="36">36개월</option>
                           <option value="48">48개월</option>
                           <option value="60">60개월</option>
                         </select>
                      </div>

                      <div className={HomeStyle['checkbox-group']}>
                        <PrivacyConsentCheckbox
                          checked={isQuotePrivacyAgreed}
                          onChange={setIsQuotePrivacyAgreed}
                          align="right"
                        />
                      </div>

                      <button type="submit" className={`${HomeStyle['consult-btn']} ${HomeStyle['blue']}`}>
                        실시간 무료견적 받기
                      </button>
                      {quoteFormMessage && (
                        <p className={HomeStyle['consult-help']}>{quoteFormMessage}</p>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className={HomeStyle['page-container']} style={{ marginTop: 0 }}>
            <div className={HomeStyle['main-content-wrapper']}>
              <section className={HomeStyle['closing-soon']}>
              <div className={HomeStyle['section-header']}>
                <div className={HomeStyle['header-icon']}>
                  <img
                    src="/hotdeal-timer.svg"
                    alt="마감 임박"
                    width="58"
                    height="58"
                    loading="lazy"
                  />
                </div>
                <h2>재고 특가 핫딜</h2>
              </div>
              <p className={HomeStyle['section-subtitle']}>현재 인기 차종, 단 3대 남았습니다</p>

              <div className={HomeStyle['countdown-timer']}>
                <div className={HomeStyle['timer-item']}>
                  <div className={HomeStyle['number-box']}>{timeLeft.days}</div>
                  <span className={HomeStyle['unit']}>일</span>
                </div>
                <div className={HomeStyle['timer-item']}>
                  <div className={HomeStyle['number-box']}>{timeLeft.hours}</div>
                  <span className={HomeStyle['unit']}>시</span>
                </div>
                <div className={HomeStyle['timer-item']}>
                  <div className={HomeStyle['number-box']}>{timeLeft.minutes}</div>
                  <span className={HomeStyle['unit']}>분</span>
                </div>
                <div className={HomeStyle['timer-item']}>
                  <div className={HomeStyle['number-box']}>{timeLeft.seconds}</div>
                  <span className={HomeStyle['unit']}>초</span>
                </div>
              </div>

              <div className={HomeStyle['featured-cars']}>
                {closingSoon?.isLoading && (
                  <p className={HomeStyle['section-subtitle']}>마감 임박 차량을 불러오는 중입니다...</p>
                )}
                {closingSoon?.isError && (
                  <p className={HomeStyle['section-subtitle']}>마감 임박 차량을 불러오지 못했습니다.</p>
                )}
                {!closingSoon?.isLoading && !closingSoon?.isError && closingSoonCards.length === 0 && (
                  <p className={HomeStyle['section-subtitle']}>현재 마감 임박 차량이 없습니다.</p>
                )}
                {!closingSoon?.isLoading &&
                  !closingSoon?.isError &&
                  closingSoonCards.map((car) => {
                    const pricing = car.trimId ? promoPriceMap[String(car.trimId)] : null;
                    
                    // 트림 데이터 추출
                    const trim = car.trim || car.trims?.[0] || {};
                    
                    return (
                    <PromotionCard
                      key={car.id}
                      id={car.id}
                      name={car.name}
                      desc={car.desc}
                      img={car.img}
                      brand={car.brand}
                      onClick={() => handleHomeConsultClick(car)}
                      onButtonClick={() => handleHomeConsultClick(car)}
                      buttonText="실시간 무료견적 받기"
                      basePrice={pricing?.basePrice}
                      finalPrice={pricing?.finalPrice}
                      discountPercent={pricing?.discountPercent}
                      // 마감임박 영역은 PRE_PURCHASE 월 렌탈 기준 할인 정보를 강조
                      discountDisplay="monthly"
                      monthlyRentalFee={pricing?.monthlyRentalFee}
                      discountedMonthlyFee={pricing?.discountedMonthlyFee}
                      monthlyDiscountPercent={pricing?.monthlyDiscountPercent}
                      trim={trim}
                    />
                    );
                  })}
              </div>
              <p className={HomeStyle['disclaimer-text']}>* 특가 혜택은 예고 없이 종료될 수 있습니다.</p>
            </section>
            </div>
          </div>

          <section className={HomeStyle['youtube-section']}>
            <YoutubeCard />
          </section>

          <ConsultBanner styles={HomeStyle} onSubmit={handleConsultBannerSubmit} />

          <section className={HomeStyle['popular-section-full']}>
            <div className={HomeStyle['page-container']} style={{ marginTop: 0 }}>
              <div className={HomeStyle['main-content-wrapper']}>
              <section className={HomeStyle['popular-cars']}>
              <div className={HomeStyle['section-header']}>
                <h2>주간 인기차량 <span>TOP 5</span></h2>
                <p className={HomeStyle['section-subtitle']}>
                  고객 계약 데이터를 기반으로 선정된 한 주간 가장 인기 있었던 차량입니다.
                </p>
              </div>

              <div className={HomeStyle['cars-list']}>
                {topCars?.isLoading && (
                  <p className={HomeStyle['section-subtitle']}>인기 차량을 불러오는 중입니다...</p>
                )}
                {topCars?.isError && (
                  <p className={HomeStyle['section-subtitle']}>인기 차량 데이터를 불러오지 못했습니다.</p>
                )}
                {!topCars?.isLoading && !topCars?.isError && topCarsList.length === 0 && (
                  <p className={HomeStyle['section-subtitle']}>주간 인기 차량 데이터가 없습니다.</p>
                )}
                {!topCars?.isLoading &&
                  !topCars?.isError &&
                  topCarsList.map((car, index) => {
                    const uniqueKey = car.id || `top-car-${index}`;
                    return (
                        <div
                          key={uniqueKey}
                          className={car.trimId ? HomeStyle['clickable-car-card'] : ''}
                          onClick={() => car.trimId && handleNavigateToDetail(car)}
                        >
                        <CarCard {...car} />
                      </div>
                    );
                  })}
              </div>
            </section>
          </div>
        </div>
        </section>
      </div>

      <SpecialOffersSection
        offers={limitedSpecialOffers}
        isLoading={brandPromotions?.isLoading}
        onCardClick={(id, item) => handleHomeConsultClick(item ?? { id })}
        onButtonClick={handleHomeConsultClick}
        icon={<img src="/특가차량.png" alt="특가 차량" width="60" height="50" loading="lazy" />}
        pricingMap={promoPriceMap}
      />

    
      {/* 공장 특판 섹션 */}
      <section className={HomeStyle['factory-deal-section']}>
        <div className={HomeStyle['factory-deal-container']}>
          <h2 className={HomeStyle['factory-deal-title']}>
            <span className={HomeStyle['title-line']}>
              <span className={HomeStyle['text-with-underline']}>
                블라인드 카스토리는 <span className={HomeStyle['highlight-yellow']}>중간단계 없이,</span>
              </span>
            </span>
            <br />
            <span className={HomeStyle['title-line']}>
              <span className={HomeStyle['text-with-underline']}>공장 특판 혜택을 그대로 제공합니다.</span>
            </span>
          </h2>

          <div className={HomeStyle['car-showcase']}>
            <img 
              src="/mobileMain/쏘렌토.png" 
              alt="쏘렌토 2026" 
              className={HomeStyle['showcase-car-image']}
            />
            <div className={HomeStyle['car-info-card']}>
              <p className={HomeStyle['car-model']}>쏘렌토  2026년형 가솔린 터보 2.5</p>
              <p className={HomeStyle['car-conditions']}>선납금 30% / 48개월 / 2만km 기준</p>
            </div>
          </div>

          <div className={HomeStyle['factory-deal-description']}>
            <p className={HomeStyle['description-line1']}>
              블라인드 카스토리는 공장 공급 조건을 기반으로
            </p>
            <p className={HomeStyle['description-line2']}>
              중간 마진을 제거한 <span className={HomeStyle['highlight-yellow-text']}>수수료 0%</span> 견적을 제공합니다.
            </p>
            <p className={HomeStyle['description-line3']}>
              대리점·영업사원 수수료가 포함된 일반 견적과 달리
            </p>
            <p className={HomeStyle['description-line4']}>
              공장 특판 조건을 직접 적용해 더 합리적인 월 렌탈료를 제공합니다.
            </p>
          </div>

          <div className={HomeStyle['price-comparison-table']}>
            <div className={HomeStyle['table-header']}>
              <div className={HomeStyle['table-cell-header-empty']}></div>
              <div className={HomeStyle['table-cell-header']}>
                <img src="/card/cc/농협.svg" alt="NH캐피탈" className={HomeStyle['capital-logo']} />
                <span>NH캐피탈</span>
              </div>
              <div className={HomeStyle['table-cell-header']}>
                <img src="/card/cc/롯데.svg" alt="롯데캐피탈" className={HomeStyle['capital-logo']} />
                <span>롯데캐피탈</span>
              </div>
              <div className={HomeStyle['table-cell-header']}>
                <img src="/card/cc/신한.svg" alt="신한카드" className={HomeStyle['capital-logo']} />
                <span>신한카드</span>
              </div>
              <div className={HomeStyle['table-cell-header']}>
                <img src="/card/cc/bnk.svg" alt="캐피탈" className={HomeStyle['capital-logo']} />
                <span>캐피탈</span>
              </div>
              <div className={HomeStyle['table-cell-header']}>
                <img src="/card/orix.svg" alt="IM캐피탈" className={HomeStyle['capital-logo']} />
                <span>IM캐피탈</span>
              </div>
            </div>

            <div className={HomeStyle['table-row']}>
              <div className={HomeStyle['table-cell-label']}>
                <p className={HomeStyle['label-small']}>블라인드 카스토리</p>
                <p className={HomeStyle['label-fee']}>
                  수수료 <span className={HomeStyle['fee-highlight']}>0%</span>
                </p>
              </div>
              <div className={HomeStyle['table-cell-price-highlight']}>252,303</div>
              <div className={HomeStyle['table-cell-price']}>258,800</div>
              <div className={HomeStyle['table-cell-price']}>265,400</div>
              <div className={HomeStyle['table-cell-price']}>267160</div>
              <div className={HomeStyle['table-cell-price']}>280,813</div>
            </div>

            <div className={HomeStyle['table-row']}>
              <div className={HomeStyle['table-cell-label']}>
                <p className={HomeStyle['label-small']}>타 업체</p>
                <p className={HomeStyle['label-fee']}>수수료 5~7%</p>
              </div>
              <div className={HomeStyle['table-cell-price']}>264,918</div>
              <div className={HomeStyle['table-cell-price']}>271,740</div>
              <div className={HomeStyle['table-cell-price']}>27,8,670</div>
              <div className={HomeStyle['table-cell-price']}>280,518</div>
              <div className={HomeStyle['table-cell-price']}>294,854</div>
            </div>

            <p className={HomeStyle['table-disclaimer']}>
              *차종·제휴사 정책에 따라 적용 조건은 달라질 수 있습니다.
            </p>
          </div>

          <div className={HomeStyle['zero-fee-banner']}>
            <p className={HomeStyle['zero-fee-text-top']}>지금 블라인드 카스토리에서 공장 특판 견적을 받으면</p>
            <h2 className={HomeStyle['zero-fee-text-main']}> 수수료 0% !!</h2>
            <div className={HomeStyle['penguin-character']}>
              <img 
                src="/home/고해상도_찾아보기 펭귄 5.svg" 
                alt="블라인드 카스토리 펭귄" 
              />
            </div>
          </div>
        </div>
      </section>

      <ConsultBanner styles={HomeStyle} onSubmit={handleConsultBannerSubmit} />

      {/* 장기렌트 비교 섹션 */}
      <section className={HomeStyle['long-term-rent-section']}>
        <div className={HomeStyle['long-term-rent-container']}>
          {/* 타이틀 */}
          <div className={HomeStyle['title-group']}>
            <h2 className={HomeStyle['main-title-blue']}>장기렌트,</h2>
            <h3 className={HomeStyle['main-title-black']}>일시불·할부보다 저렴합니다.</h3>
          </div>

          {/* 비교 텍스트 */}
          <div className={HomeStyle['comparison-group']}>
            <div className={HomeStyle['comparison-row']}>
              <span className={HomeStyle['comparison-label']}>보증금 100%, 일시불 비교시 장기렌트가 </span>
              <span className={HomeStyle['comparison-highlight']}>최대 1,100만원 이상 저렴 </span>
            </div>
            <div className={HomeStyle['comparison-row']}>
              <span className={HomeStyle['comparison-label']}>보증금 0%, 풀할부 비교시 장기렌트가 </span>
              <span className={HomeStyle['comparison-highlight']}>최대 2~300만원 이상 저렴</span>
            </div>
          </div>

          {/* 정보 박스 (오른쪽 상단) */}
          <div className={HomeStyle['info-box']}>
            <p className={HomeStyle['info-box-title']}>장기렌트 보증금 0%시 </p>
            <p className={HomeStyle['info-box-subtitle']}>(신형 팰리세이드 하이브리드 기준)</p>
          </div>

          {/* 설명 텍스트 */}
          <p className={HomeStyle['description-text']}>
            선납금은 장기렌트 렌탈료에서 단순히 1/N으로 나눈값! 
            보증금기준은 10%당 무려 연 6.6% 의 예금금리와 동일한값
          </p>

          {/* CTA 텍스트 */}
          <p className={HomeStyle['cta-text']}>이제 보증금 견적으로 해결하세요!</p>

          {/* 차량 이미지 (오른쪽 하단, absolute) */}
          <div className={HomeStyle['long-term-rent-image']}>
            <img 
              src="/home/자동차옆모습_고하질.svg" 
              alt="장기렌트 차량"
            />
          </div>
        </div>
      </section>

    </div>

    {/* 장기렌트 vs 할부/리스 비교 섹션 */}
    <ComparisonSection />

    {/* 제휴카드사 섹션 */}
    <section className={HomeStyle['partner-cards-section']}>
      <div className={HomeStyle['partner-cards-header']}>
        <h2 className={HomeStyle['partner-cards-title']}>제휴카드사</h2>
        <p className={HomeStyle['partner-cards-subtitle']}>
          국내 30여 개 제휴사 데이터를 비교 분석하여, 고객님께 딱 맞는 최저가 견적만을 제공합니다.
        </p>
      </div>

      <div className={HomeStyle['partner-cards-grid']}>
        {loopPartnerCards.map((card, index) => (
          <div
            // 같은 카드가 2번씩 반복되므로 index + name 조합으로 key 지정
            key={`${card.name}-${index}`}
            className={HomeStyle['partner-card']}
          >
            <div className={HomeStyle['partner-logo']}>
              <img
                src={card.image}
                alt={card.name}
                onError={(e) => {
                  // 이미지 로드 실패 시 placeholder 표시
                  e.target.src = `/placeholder/car.svg)}`;
                }}
              />
            </div>
            <span className={HomeStyle['partner-name']}>{card.name}</span>
          </div>
        ))}
      </div>
    </section>

    {/* 일시불보다 1000만원 섹션 */}
    <LumpSumSection />

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
    </>
  );
};

export default Home;
