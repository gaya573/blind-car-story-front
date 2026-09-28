import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './QuickConsult.module.css';
import talkIcon from '../../assets/icon/talk.png';
import naverIcon from '../../assets/icon/naver.png';
import {
  submitConsult,
  KAKAO_OAUTH_CANCELLED_MESSAGE,
  acquireContactViaKakao,
  ensureConsultContact,
} from '../../services/consultHelper';
import { initKakaoSDK, loginWithKakao } from '../../utils/kakaoAuth';
import PrivacyConsentCheckbox from '../PrivacyConsentCheckbox.jsx';
import BrowserContactModal from '../BrowserContactModal.jsx';
import Toast from '../Toast.jsx';
import ConsultSuccessModal from '../ConsultSuccessModal.jsx';
import { handleKakaoPopupBlocked, KAKAO_POPUP_BLOCKED_MESSAGE } from '../../utils/kakaoPopup';
import { logButtonClick, getOrCreateDeviceId, getOrCreateSessionId } from '../../utils/analyticsUtils';
import {
  getPhoneValidationMessage,
  sanitizePhoneForStorage,
} from '../../utils/phoneStorage';

const CONTACT_PROMPT_DEFAULT = '연락처를 남겨주시면 담당 매니저가 바로 도와드릴게요.';

/**
 * 본문은 1280px 고정폭이고 이 사이드바는 화면 오른쪽 끝에 260px로 붙는다.
 * 좌우 여백이 260px보다 좁으면 본문(메인 히어로의 실시간 견적문의 카드 등)을 덮어버리므로,
 * 그보다 좁은 화면에서는 접힌 상태로 시작한다. 접혀도 "상담창 펼치기" 버튼은 남는다.
 */
const FLOATING_MIN_WIDTH = 1280 + 260 * 2;

const canFloatWithoutOverlap = () =>
  typeof window === 'undefined' ? true : window.innerWidth >= FLOATING_MIN_WIDTH;

const QuickConsult = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(canFloatWithoutOverlap);
  const [isLoading, setIsLoading] = useState(false);
  const [kakaoUserInfo, setKakaoUserInfo] = useState(null);
  const [phoneValue, setPhoneValue] = useState(''); // 연락처 입력값 추적
  const [autoFilledPhone, setAutoFilledPhone] = useState(false);
  const [isPrivacyAgreed, setIsPrivacyAgreed] = useState(true);
  const [supportMessage, setSupportMessage] = useState('');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactModalMessage, setContactModalMessage] = useState('');
  const [contactModalInitialPhone, setContactModalInitialPhone] = useState('');
  const [contactModalPayload, setContactModalPayload] = useState(null);
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const showToast = useCallback((message) => {
    setToastMessage(message);
    setIsToastVisible(true);
  }, []);

  const carModelRef = useRef(null);
  const phoneRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);

  const sanitizePhone = (phone) => sanitizePhoneForStorage(phone);

  const fillFormWithKakaoData = (userInfo) => {
    if (!userInfo) return '';

    const sanitizedPhone = sanitizePhone(userInfo.phone);

    if (nameRef.current && userInfo.name) {
      nameRef.current.value = userInfo.name;
    }

    if (emailRef.current && userInfo.email) {
      emailRef.current.value = userInfo.email;
    }

    if (phoneRef.current && sanitizedPhone) {
      phoneRef.current.value = sanitizedPhone;
      setPhoneValue(sanitizedPhone);
      setAutoFilledPhone(true);
    }

    setKakaoUserInfo(userInfo);
    return sanitizedPhone;
  };

  const openContactModal = useCallback((
    message = CONTACT_PROMPT_DEFAULT,
    payload = null,
    initialPhone = '',
  ) => {
    setContactModalMessage(message || CONTACT_PROMPT_DEFAULT);
    setContactModalPayload(payload);
    setContactModalInitialPhone(initialPhone || '');
    setIsContactModalOpen(true);
  }, []);

  const closeContactModal = useCallback(() => {
    if (isContactSubmitting) return;
    setIsContactModalOpen(false);
    setContactModalPayload(null);
    setContactModalInitialPhone('');
  }, [isContactSubmitting]);

  const handleContactModalSubmit = async (phoneInput, nameInput) => {
    if (!contactModalPayload) {
      // eslint-disable-next-line no-console
      console.warn('[QuickConsult] handleContactModalSubmit: missing contactModalPayload');
      return;
    }
    const phoneValidationMessage = getPhoneValidationMessage(phoneInput);
    if (phoneValidationMessage) {
      setSupportMessage(phoneValidationMessage);
      showToast(phoneValidationMessage);
      return;
    }
    const phone = sanitizePhone(phoneInput);
    setIsContactSubmitting(true);
    try {
      const payload = {
        ...contactModalPayload,
        phone,
        name: (nameInput || contactModalPayload.name || '').trim(),
      };
      // eslint-disable-next-line no-console
      console.info('[QuickConsult] handleContactModalSubmit: submitting payload', payload);
      const result = await submitConsult(payload, {
        useKakao: false,
        openKakaoOnSuccess: true,
        kakaoOpenTarget: '_blank',
      });

      // eslint-disable-next-line no-console
      console.info('[QuickConsult] handleContactModalSubmit: submitConsult result', result);

      if (result?.success) {
        setSupportMessage('연락처가 등록되었습니다. 곧 연락드릴게요.');
        if (phoneRef.current) {
          phoneRef.current.value = phone;
        }
        setPhoneValue(phone);
        setIsContactModalOpen(false);
        setContactModalPayload(null);
        setContactModalInitialPhone('');
        
        // API 호출 성공 시 무조건 성공 모달 표시
        setIsSuccessModalOpen(true);
      } else {
        setSupportMessage(result?.message || '연락처 등록에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('[QuickConsult] contact modal submit 실패', error);
      setSupportMessage('연락처 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsContactSubmitting(false);
    }
  };

  // 빠른 견적문의 전용 카카오 연락처 확보:
  // - 별도 모달을 열지 않는다
  // - 타임아웃/취소 등으로 번호를 못 가져와도 사용자에게 경고를 띄우지 않는다
  const startKakaoContactFlow = useCallback(
    async (payload) => {
      try {
        // eslint-disable-next-line no-console
        console.info('[QuickConsult] startKakaoContactFlow: start', { payload });
        const contactInfo = await acquireContactViaKakao(
          payload,
          {
            openModal: () => {},
            updateModal: () => {},
            closeModal: () => {},
          },
          { requirePhone: false },
        );

        if (contactInfo?.phoneMissing) {
          // eslint-disable-next-line no-console
          console.warn('[QuickConsult] 카카오로 연락처를 확보하지 못했습니다(phoneMissing).', {
            contactInfo,
          });
          return null;
        }

        // eslint-disable-next-line no-console
        console.info('[QuickConsult] startKakaoContactFlow: success', {
          phone: contactInfo?.data?.phone,
          viaKakaoOAuth: contactInfo?.phoneObtainedViaKakao,
        });

        return contactInfo;
      } catch (error) {
        const msg = error?.message || '';
        if (msg.includes('카카오 로그인 시간이 초과되었습니다')) {
          // eslint-disable-next-line no-console
          console.warn('[QuickConsult] 카카오 로그인 타임아웃 – 경고 메시지/모달 없이 무시합니다.', error);
          return null;
        }
        // 그 외 에러만 일반 상담 실패로 처리
        // eslint-disable-next-line no-console
        console.error('[QuickConsult] 카카오 연락처 확보 실패:', error);
        setSupportMessage('카카오 상담 연결에 실패했습니다. 다시 시도해주세요.');
        return null;
      }
    },
    [],
  );

  const fetchKakaoUserInfo = async () => {
    const userInfo = await loginWithKakao({
      scopes: ['phone_number', 'name'],
      fetchUserInfo: true,
    });
    return {
      ...userInfo,
      phone: sanitizePhone(userInfo?.phone),
    };
  };

  // 카카오 SDK 초기화
  useEffect(() => {
    if (window.Kakao) {
      initKakaoSDK();
    } else {
      // SDK 로드 대기
      const checkKakaoSDK = setInterval(() => {
        if (window.Kakao) {
          initKakaoSDK();
          clearInterval(checkKakaoSDK);
        }
      }, 100);
      
      return () => clearInterval(checkKakaoSDK);
    }
  }, []);

  // 특정 페이지(차량 상세 3종)에서 뷰포트가 줄어들면 빠른견적 사이드바를 숨기기 위한 상태
  const [isNarrowForCarDetail, setIsNarrowForCarDetail] = useState(false);

  useEffect(() => {
    const updateNarrowState = () => {
      if (typeof window === 'undefined') return;

      const width = window.innerWidth || document.documentElement.clientWidth;
      // 데스크톱 레이아웃에서 오른쪽 간편상담 카드와 겹치지 않도록
      // 차량 상세 페이지 3종은 1400px 이하부터 사이드바를 숨김
      const isCarDetailPath =
        location.pathname.startsWith('/car-detail/car/') ||
        location.pathname.startsWith('/car-detail/trim/') ||
        location.pathname === '/car-detail' ||
        location.pathname.startsWith('/car-detail/');

      setIsNarrowForCarDetail(isCarDetailPath && width <= 1400);
    };

    updateNarrowState();
    window.addEventListener('resize', updateNarrowState);
    return () => window.removeEventListener('resize', updateNarrowState);
  }, [location.pathname]);

  // 카카오 로그인으로 정보 가져오기
  const handleKakaoLogin = async () => {
    try {
      setIsLoading(true);
      const userInfo = await fetchKakaoUserInfo();
      fillFormWithKakaoData(userInfo);
      setSupportMessage('카카오 로그인 정보가 자동으로 입력되었습니다.');
      return userInfo;
    } catch (error) {
      console.error('카카오 로그인 실패:', error);
      const errorMessage = error.message || '카카오 로그인에 실패했습니다.';
      if (errorMessage.includes('SDK')) {
        setSupportMessage('카카오 SDK 로드에 실패했습니다. 새로고침 후 다시 시도해 주세요.');
      } else {
        setSupportMessage(`카카오 로그인에 실패했습니다. (${errorMessage})`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    if (!isPrivacyAgreed) {
      setSupportMessage('개인정보 수집·이용에 동의해 주세요.');
      return;
    }
    
    // 버튼 단위 로깅: 휴대폰 연락 상담 버튼 클릭
    try {
      logButtonClick('quick_sidebar_phone_consult_submit', {
        source: 'quick-sidebar',
        entryLabel: '빠른 견적문의 > 휴대폰 상담',
      });
    } catch {
      // analytics 에러는 상담 흐름에 영향 주지 않도록 무시
    }
    
    try {
      setIsLoading(true);
      setSupportMessage('');
      
      // 폼에서 정보 가져오기
      const nameInput = nameRef.current || document.querySelector('input[placeholder="성함"]');
      const phoneInput = phoneRef.current || document.querySelector('input[placeholder="연락처"]');
      const carModelInput = carModelRef.current || document.querySelector('input[placeholder="차종"]');
      const emailInput = emailRef.current || document.querySelector('input[placeholder="이메일"]');
      
      const rawPhone = phoneRef.current?.value || phoneInput?.value || '';
      const phoneValidationMessage = getPhoneValidationMessage(rawPhone, '');
      if (phoneValidationMessage) {
        setSupportMessage(phoneValidationMessage);
        showToast(phoneValidationMessage);
        setIsLoading(false);
        return;
      }
      const sanitizedPhone = sanitizePhone(rawPhone);
      const _deviceId = getOrCreateDeviceId();
      const _sessionId = getOrCreateSessionId(_deviceId);
      const consultData = {
        name: nameInput?.value || '',
        phone: sanitizedPhone,
        email: emailInput?.value || '',
        model: carModelInput?.value || '',
        brand: '',
        trim: null,
        terms: [],
        options: [],
        consultType: '휴대폰연락',
        source: 'quick-sidebar',
        entryLabel: '빠른 견적문의 > 휴대폰 상담',
        deviceId: _deviceId,
        sessionId: _sessionId,
      };

      let finalData = { ...consultData };

      // eslint-disable-next-line no-console
      console.info('[QuickConsult] handleSubmit: initial consultData', consultData);

      // [변경] 카카오 로그인 프로세스 제거: 연락처가 없으면 바로 모달을 열도록 수정
      if (!sanitizedPhone) {
        // 카카오 로그인 없이 바로 연락처 입력 모달 열기
        setIsContactModalOpen(true);
        setContactModalPayload(consultData);
        setContactModalInitialPhone('');
        setIsLoading(false);
        return;
        // 기존 코드 (주석 처리):
        // const contactInfo = await startKakaoContactFlow(consultData);
        // if (!contactInfo) {
        //   // eslint-disable-next-line no-console
        //   console.warn('[QuickConsult] handleSubmit: Kakao flow ended without contactInfo');
        //   return;
        // }
        // finalData = contactInfo.data;
      }

      // eslint-disable-next-line no-console
      console.info('[QuickConsult] handleSubmit: calling submitConsult with', finalData);

      const result = await submitConsult(finalData, {
        useKakao: Boolean(finalData.phone),
        openKakaoOnSuccess: true,
        kakaoOpenTarget: '_blank',
      });

      // API 호출이 성공하면 무조건 성공 모달 표시
      if (result.success) {
        // eslint-disable-next-line no-console
        console.info('[QuickConsult] handleSubmit: submitConsult success', {
          meta: result.meta,
        });
        if (result.meta?.phoneObtainedViaKakao && result.meta?.phoneSanitized) {
          setPhoneValue(result.meta.phoneSanitized);
        }
        setSupportMessage('');
        
        // 성공 모달 표시
        setIsSuccessModalOpen(true);
        
        // 폼 초기화
        if (nameInput) nameInput.value = '';
        if (phoneInput) phoneInput.value = '';
        if (carModelInput) carModelInput.value = '';
        if (emailInput) emailInput.value = '';
        setKakaoUserInfo(null);
        setAutoFilledPhone(false);
        setPhoneValue('');
        
        // 팝업 차단 처리 (모달 표시 이후에 처리)
        handleKakaoPopupBlocked(result, {
          onNeedContact: () => {
            console.warn('[QuickConsult] handleSubmit: Kakao popup blocked', {
              result,
              finalData,
            });
          },
        });
      } else {
        // eslint-disable-next-line no-console
        console.warn('[QuickConsult] handleSubmit: submitConsult failed', result);
        setSupportMessage(result.message || '상담 신청에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('[QuickConsult] handleSubmit: 상담 신청 실패', error);
      setSupportMessage('상담 신청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoConsult = async (e) => {
    e.preventDefault();
    
    if (isLoading) {
      return;
    }
    
    if (!isPrivacyAgreed) {
      setSupportMessage('개인정보 수집·이용에 동의해 주세요.');
      return;
    }
    let shouldClearPhone = autoFilledPhone;
    
    // 버튼 단위 로깅: 카톡 간편 상담 버튼 클릭
    try {
      logButtonClick('quick_sidebar_kakao_consult_click', {
        source: 'quick-sidebar',
        entryLabel: '빠른 견적문의 > 카톡 간편 상담',
      });
    } catch {
      // analytics 에러는 상담 흐름에 영향 주지 않도록 무시
    }
    
    try {
      setIsLoading(true);
      setSupportMessage('');
      
      const carModelInput = carModelRef.current || document.querySelector('input[placeholder="차종"]');
      const phoneInput = phoneRef.current || document.querySelector('input[placeholder="연락처"]');
      const emailInput = emailRef.current || document.querySelector('input[placeholder="이메일"]');
      const nameInput = nameRef.current || document.querySelector('input[placeholder="성함"]');
      const rawPhone = phoneInput?.value || phoneValue;
      const phoneValidationMessage = getPhoneValidationMessage(rawPhone, '');
      if (phoneValidationMessage) {
        setSupportMessage(phoneValidationMessage);
        showToast(phoneValidationMessage);
        setIsLoading(false);
        return;
      }
      const finalPhone = sanitizePhone(rawPhone);
      const _deviceId = getOrCreateDeviceId();
      const _sessionId = getOrCreateSessionId(_deviceId);
      const consultData = {
        name: nameRef.current?.value || nameInput?.value || '',
        phone: finalPhone,
        email: emailRef.current?.value || emailInput?.value || '',
        model: carModelInput?.value || '',
        brand: '',
        trim: null,
        terms: [],
        options: [],
        consultType: '카카오상담',
        source: 'quick-sidebar',
        entryLabel: '빠른 견적문의 > 카톡 간편 상담',
        deviceId: _deviceId,
        sessionId: _sessionId,
      };

      let finalData = { ...consultData };

      // eslint-disable-next-line no-console
      console.info('[QuickConsult] handleKakaoConsult: initial consultData', consultData);

      // [카카오톡 상담 버튼 전용] 카카오 OAuth 로그인 활성화
      if (!finalPhone) {
        const contactInfo = await ensureConsultContact(consultData, {
          useKakao: true,
          requirePhone: false,
        });
        
        if (!contactInfo?.phoneMissing && contactInfo?.data?.phone) {
          finalData = contactInfo.data;
        } else {
          // 카카오 OAuth 실패 시 모달 열기
          // eslint-disable-next-line no-console
          console.warn('[QuickConsult] handleKakaoConsult: 카카오 로그인 실패 또는 취소, 모달로 전환');
          openContactModal(
            KAKAO_OAUTH_CANCELLED_MESSAGE,
            consultData,
            ''
          );
          setIsLoading(false);
          return;
        }
      }

      // eslint-disable-next-line no-console
      console.info('[QuickConsult] handleKakaoConsult: calling submitConsult with', finalData);

      const result = await submitConsult(finalData, {
        useKakao: Boolean(finalData.phone),
        openKakaoOnSuccess: true,
        kakaoOpenTarget: '_blank',
      });

      // API 호출이 성공하면 무조건 성공 모달 표시
      if (result.success) {
        // eslint-disable-next-line no-console
        console.info('[QuickConsult] handleKakaoConsult: submitConsult success', {
          meta: result.meta,
        });
        setSupportMessage('');
        if (result.meta?.phoneObtainedViaKakao && result.meta?.phoneSanitized) {
          shouldClearPhone = true;
        }
        
        // 성공 모달 표시
        setIsSuccessModalOpen(true);
        
        // 팝업 차단 처리 (모달 표시 이후에 처리)
        handleKakaoPopupBlocked(result, {
          onNeedContact: () => {
            console.warn('[QuickConsult] handleKakaoConsult: Kakao popup blocked', {
              result,
              finalData,
            });
          },
        });
      } else {
        // eslint-disable-next-line no-console
        console.warn('[QuickConsult] handleKakaoConsult: submitConsult failed', result);
        setSupportMessage(result.message || '카카오 상담 연결에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      const msg = error?.message || '';
      if (msg.includes('카카오 로그인 시간이 초과되었습니다')) {
        // eslint-disable-next-line no-console
        console.warn(
          '[QuickConsult] 카카오 로그인 타임아웃 – 사용자 경고 없이 quietly 무시합니다.',
          error,
        );
        // 카카오 타임아웃은 별도 경고/모달 없이 종료
      } else {
        // eslint-disable-next-line no-console
        console.error('[handleKakaoConsult] 에러 발생:', error);
        setSupportMessage('카카오 상담 연결에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
      if (shouldClearPhone) {
        if (phoneRef.current) {
          phoneRef.current.value = '';
        }
        setPhoneValue('');
      }
      setAutoFilledPhone(false);
      setKakaoUserInfo(null);
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // 차량 상세 페이지(CarDetail / CarTrimDetail / CarLineDetail)에서
  // 화면이 줄어든 경우에는 빠른 견적문의 사이드바를 숨긴다
  if (isNarrowForCarDetail) {
    return null;
  }

  return (
    <>
    <div className={`${styles['quick-consult-sidebar']} ${isOpen ? styles.open : styles.closed}`}>
      <div className={styles['quick-consult-container']}>
        {/* 흰색 폼 카드 (제목 포함) */}
        <div className={styles['quick-consult-card']}>
          {/* 카드 내부 제목 */}
          <div className={styles['consult-title']}>
            <h3>실시간 견적문의</h3>
          </div>
          
          <form className={styles['consult-form']} onSubmit={handleSubmit}>
            <div className={styles['input-row']}>
              <label className={styles['input-label']}>
                성함
              </label>
              <input 
                ref={nameRef}
                className={styles['consult-input']} 
                type="text" 
                placeholder="ex) 홍길동" 
              />
            </div>
            
            <div className={styles['input-row']}>
              <label className={styles['input-label']}>
                연락처<span className={styles['required']}>*</span>
              </label>
              <input 
                ref={phoneRef}
                className={styles['consult-input']} 
                type="tel" 
                placeholder="ex) 01012345678" 
                value={phoneValue}
                onChange={(e) => {
                  setPhoneValue(e.target.value);
                  if (e.target.value) {
                    setKakaoUserInfo(null);
                    setAutoFilledPhone(false);
                  }
                }}
              />
            </div>
        
            <div className={styles['input-row']}>
              <label className={styles['input-label']}>차종</label>
              <input 
                ref={carModelRef}
                className={styles['consult-input']} 
                type="text" 
                placeholder="ex) 쏘렌토" 
              />
            </div>
            
            <PrivacyConsentCheckbox
              checked={isPrivacyAgreed}
              onChange={setIsPrivacyAgreed}
              align="right"
            />
            {supportMessage && (
              <p className={styles['support-message']}>{supportMessage}</p>
            )}
            
            <button type="submit" className={styles['consult-submit-btn']}>실시간 무료견적 받기</button>
          </form>
        </div>

        {/* 파란색 상담 박스들 */}
        <div className={styles['consult-methods']}>
          {/* 전화 상담 (위) */}
          <button 
            type="button"
            className={styles['phone-method-btn']}
            onClick={() => window.open('tel:1577-8319')}
          >
            <div className={styles['phone-icon-wrapper']}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles['method-text']}>
              <span className={styles['method-subtitle']}>전문상담원과 간편 전화상담</span>
              <span className={styles['method-title']}>1577-8319</span>
            </div>
          </button>

          {/* 카카오톡 상담 (아래) */}
          <button 
            type="button"
            className={styles['kakao-method-btn']}
            onClick={handleKakaoConsult}
            disabled={isLoading}
          >
            <div className={styles['kakao-icon-wrapper']}>
              <div className={styles['kakao-icon-circle']}></div>
            </div>
            <div className={styles['method-text']}>
              <span className={styles['method-subtitle']}>1분만에 스으윽~~~</span>
              <span className={styles['method-title']}>카톡 간편 상담 신청</span>
            </div>
          </button>
        </div>

        {/* 하단 원형 버튼들 */}
        {isOpen && (
          <div className={styles['bottom-actions']}>
            <button 
              type="button"
              className={styles['fold-btn']}
              onClick={toggleSidebar}
            >
              <span>상담창<br/>접어두기</span>
            </button>
            
            <button 
              type="button"
              className={styles['top-btn']}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M12 5L5 12M12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>TOP</span>
            </button>
          </div>
        )}
        
      </div>
    </div>
    
    {/* 접혔을 때 펼치기 버튼 + TOP (오른쪽 위 고정) */}
    {!isOpen && (
      <div className={styles['unfold-container']}>
        <button 
          type="button"
          className={styles['unfold-btn']}
          onClick={toggleSidebar}
        >
          <span>상담창<br/>펼치기</span>
        </button>
        
        <button 
          type="button"
          className={styles['top-btn']}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M12 5L5 12M12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>TOP</span>
        </button>
      </div>
    )}
    <BrowserContactModal
      open={isContactModalOpen}
      onClose={closeContactModal}
      onSubmit={handleContactModalSubmit}
      isSubmitting={isContactSubmitting}
      description={contactModalMessage || undefined}
      initialPhone={contactModalInitialPhone}
    />
    <Toast
      message={toastMessage}
      visible={isToastVisible}
      duration={1000}
      onClose={() => setIsToastVisible(false)}
      position="bottom"
    />
    <ConsultSuccessModal
      isOpen={isSuccessModalOpen}
      onClose={() => setIsSuccessModalOpen(false)}
    />
    </>
  );
};

export default QuickConsult;

