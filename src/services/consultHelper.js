import { consultAPI } from './consultApi';
import { parseConsultShareUrl } from '../utils/shareableUrl';
import {
  PHONE_MIN_DIGITS,
  PHONE_MIN_DIGITS_MESSAGE,
  getPhoneDigits,
  setStoredUserPhone,
} from '../utils/phoneStorage';
import {
  getOrCreateDeviceId,
  getOrCreateSessionId,
  sendAnalyticsData,
} from '../utils/analyticsUtils';

/**
 * 상담 데이터 구조 타입
 * @typedef {Object} ConsultData
 * @property {string} [name] - 고객 이름
 * @property {string} [phone] - 전화번호
 * @property {string} [email] - 이메일
 * @property {string} [model] - 차량 모델명
 * @property {string} [brand] - 브랜드명
 * @property {string} [trim] - 트림명
 * @property {string} [color] - 색상명
 * @property {Array<string>} [options] - 선택한 옵션 목록
 * @property {Array<string>} [terms] - 계약 조건 목록
 * @property {string} [consultType] - 상담 유형
 * @property {string} [source] - 출처 페이지
 * @property {Object} [extra] - 추가 정보
 */

/**
 * 상담 메시지 빌더 - 선택한 정보를 바탕으로 메시지 생성
 * @param {ConsultData} data
 * @returns {string}
 */
const SOURCE_LABELS = {
  'inventory-page': '재고보유 페이지',
  'express-deals': '재고출고 특가',
  'search-page': '검색 결과 페이지',
  'car-detail': '차량 상세 페이지',
  'card-promotion-page': '카드 혜택 리스트',
  'card-promotion-detail': '카드 혜택 상세 페이지',
  'promotion-page': '브랜드 프로모션 페이지',
  'promotion-detail': '브랜드 프로모션 상세 페이지',
  'home-page': '메인 페이지',
  'mobile-main-page': '모바일 메인',
  'mobile-car-detail': '모바일 차량 상세',
  'estimate-modal': '견적 모달',
  'review-page': '리뷰 페이지',
  'quick-sidebar': '빠른 견적 문의',
};

export const KAKAO_OAUTH_CANCELLED_CODE = 'KAKAO_OAUTH_CANCELLED';
export const KAKAO_OAUTH_CANCELLED_MESSAGE =
  '카카오 인증이 취소되어 자동으로 연락처를 확인할 수 없습니다. 휴대폰 번호를 직접 입력해 주세요.';

const SOURCE_MESSAGES = {
  'home-page': '메인 페이지에서 상담 신청이 접수되었습니다.',
  'inventory-page': '빠른 견적문의 카드에서 상담을 남겨주셨습니다.',
  'express-deals': '재고출고 특가 페이지에서 상담을 남겨주셨습니다.',
  'search-page': '검색 결과 화면에서 상담을 남겨주셨습니다.',
  'car-detail': '차량 상세 페이지에서 상담을 남겨주셨습니다.',
  'card-promotion-page': '카드 혜택 리스트에서 상담을 남겨주셨습니다.',
  'card-promotion-detail': '카드 혜택 상세 페이지에서 상담을 남겨주셨습니다.',
  'promotion-page': '브랜드 프로모션 페이지에서 상담을 남겨주셨습니다.',
  'promotion-detail': '브랜드 프로모션 상세 페이지에서 상담을 남겨주셨습니다.',
  'review-page': '리뷰 페이지에서 상담 문의를 남겨주셨습니다.',
  'quick-sidebar': '빠른 견적문의 사이드바에서 상담을 남겨주셨습니다.',
};

function resolveSourceLabel(source) {
  if (!source) return '블라인드 카스토리';
  return SOURCE_LABELS[source] || source;
}

function detectSourceFromLocation() {
  if (typeof window === 'undefined' || !window?.location?.pathname) {
    return '';
  }

  const path = window.location.pathname;

  if (path.startsWith('/express-deals') || path.startsWith('/immediate')) return 'express-deals';
  if (path.startsWith('/car-detail')) return 'car-detail';
  if (path.startsWith('/promotion/brands')) return 'promotion-detail';
  if (path.startsWith('/promotion')) return 'promotion-page';
  if (path.startsWith('/card-promotion')) return 'card-promotion-page';
  if (path.startsWith('/reviews')) return 'review-page';
  if (path.startsWith('/search')) return 'search-page';
  if (path === '/' || path.startsWith('/home')) return 'home-page';

  return '';
}

function resolvePageUrl(data) {
  if (data?.pageUrl) return data.pageUrl;
  if (typeof window !== 'undefined' && window?.location?.href) {
    return window.location.href;
  }
  return '';
}

function resolveSourceMessage(data) {
  if (data?.extra?.entryLabel) {
    return `${data.extra.entryLabel}에서 상담 신청이 접수되었습니다.`;
  }
  if (data?.source && SOURCE_MESSAGES[data.source]) {
    return SOURCE_MESSAGES[data.source];
  }
  const label = resolveSourceLabel(data?.source);
  return `${label}에서 상담을 남겨주셨습니다.`;
}

function formatDetailLines(data, bullet = '-', options = {}) {
  const { includeSourceLine = false } = options;
  const lines = [];

  if (data.name) {
    lines.push(`${bullet} 이름: ${data.name}`);
  }

  if (data.phone) {
    lines.push(`${bullet} 연락처: ${data.phone}`);
  }

  if (data.brand || data.model) {
    const carInfo = [data.brand, data.model].filter(Boolean).join(' ');
    if (carInfo) {
      lines.push(`${bullet} 차량: ${carInfo}`);
    }
  }

  if (data.trim) {
    lines.push(`${bullet} 트림: ${data.trim}`);
  }

  if (data.color && data.color.trim()) {
    lines.push(`${bullet} 색상: ${data.color}`);
  }

  if (Array.isArray(data.options) && data.options.length > 0) {
    lines.push(`${bullet} 선택 옵션: ${data.options.join(', ')}`);
  }

  if (Array.isArray(data.terms) && data.terms.length > 0) {
    lines.push(`${bullet} 계약 조건: ${data.terms.join(', ')}`);
  }

  if (data.consultType) {
    lines.push(`${bullet} 상담 유형: ${data.consultType}`);
  }

  if (includeSourceLine && data.source) {
    lines.push(`${bullet} 상담 유입 경로: ${resolveSourceLabel(data.source)}`);
  }

  if (data.extra?.note) {
    lines.push(`${bullet} 비고: ${data.extra.note}`);
  }

  return lines;
}

function buildConsultMessage(data) {
  const parts = [];
  parts.push('Blind CarStory 상담원이 배정되었습니다.');
  parts.push('최대한 빠르게 연락드릴 예정입니다.\n');
  parts.push('📋 신청 정보');
  parts.push(resolveSourceMessage(data));
  parts.push(...formatDetailLines(data, '-', { includeSourceLine: true }));
  parts.push('\n추가 상담 내용은 담당 상담사가 도와드릴게요.');
  parts.push('카카오톡으로 이어서 대화하시려면 채팅방에 메시지를 남겨주세요.');
  return parts.join('\n');
}

/**
 * 카카오톡 메시지 빌더 - 카카오톡으로 보낼 간단한 메시지
 * @param {ConsultData} data
 * @returns {string}
 */
function buildKakaoMessage(data) {
  const parts = [];
  parts.push(resolveSourceMessage(data));
  const detailLines = formatDetailLines(data, '•');
  if (detailLines.length > 0) {
    parts.push(...detailLines);
  }
  parts.push('');
  parts.push('안녕하세요! 블라인드 카스토리 상담 매니저입니다.');
  parts.push('궁금하신 내용을 남겨주시면 바로 도와드릴게요 🙂');
  return parts.join('\n');
}

const sanitizePhoneNumber = (phone) => {
  if (phone === null || phone === undefined) return '';
  const str = typeof phone === 'string' ? phone : String(phone);
  
  // 숫자만 추출
  const digitsOnly = getPhoneDigits(str);
  
  // 최소 6자리 이상이어야 유효한 연락처로 간주
  if (digitsOnly.length < PHONE_MIN_DIGITS) {
    return '';
  }
  
  // 최대 30자까지만 허용
  return digitsOnly.length > 30 ? digitsOnly.slice(0, 30) : digitsOnly;
};

const isPhoneTooShort = (phone) => {
  const raw = phone === null || phone === undefined ? '' : String(phone).trim();
  if (!raw) return false;
  return getPhoneDigits(raw).length < PHONE_MIN_DIGITS;
};

const canUseKakaoOAuth = () => typeof window !== 'undefined';

export const isKakaoOAuthCancelled = (error) => {
  if (!error) return false;
  if (error.code === KAKAO_OAUTH_CANCELLED_CODE) return true;
  const message =
    typeof error === 'string'
      ? error
      : error?.message || error?.error_description || '';
  if (typeof message !== 'string') return false;

  // 카카오 SDK에서 내려주는 에러 메시지 기준으로 "사용자 취소/타임아웃" 모두 취소로 간주
  // 예시:
  //  - "카카오 로그인 시간이 초과되었습니다."
  //  - "사용자가 취소하였습니다."
  const lowered = message.toLowerCase();
  return (
    message.includes('취소') ||
    message.includes('시간이 초과되었습니다') ||
    lowered.includes('timeout')
  );
};

const attemptFetchKakaoContact = async () => {
  // 디버깅용: 카카오 OAuth로 연락처 확보 시작
  // eslint-disable-next-line no-console
  console.info('[consultHelper] attemptFetchKakaoContact: start');
  if (!canUseKakaoOAuth()) {
    const error = new Error('KAKAO_OAUTH_UNAVAILABLE');
    // eslint-disable-next-line no-console
    console.warn('[consultHelper] attemptFetchKakaoContact: browser env not detected', error);
    throw error;
  }

  const { loginWithKakao, initKakaoSDK, isKakaoLoggedIn } = await import('../utils/kakaoAuth');

  if (typeof initKakaoSDK === 'function') {
    try {
      initKakaoSDK();
    } catch (sdkError) {
      console.warn('[consultHelper] initKakaoSDK 실패 (무시)', sdkError);
    }
  }

  // 1) 이미 카카오에 로그인되어 있으면, 추가 팝업 없이 프로필에서 바로 전화번호 조회 시도
  if (typeof isKakaoLoggedIn === 'function' && isKakaoLoggedIn() && window?.Kakao?.API) {
    try {
      const profile = await new Promise((resolve, reject) => {
        window.Kakao.API.request({
          url: '/v2/user/me',
          data: {
            property_keys: [
              'kakao_account.name',
              'kakao_account.phone_number',
              'kakao_account.phone_number_needs_agreement',
              'kakao_account.email',
            ],
          },
          success: (res) => resolve(res),
          fail: (err) => reject(err),
        });
      });

      const kakaoAccount = profile?.kakao_account || {};
      const phoneNeedsAgreement = kakaoAccount.phone_number_needs_agreement;
      const rawPhone = !phoneNeedsAgreement ? kakaoAccount.phone_number || '' : '';
      const phone = sanitizePhoneNumber(rawPhone);
      const name = kakaoAccount.profile?.nickname || '';
      const email = kakaoAccount.email || '';

      if (phone) {
        // eslint-disable-next-line no-console
        console.info('[consultHelper] attemptFetchKakaoContact: got phone from existing Kakao session', {
          phone,
          hasName: Boolean(name),
          hasEmail: Boolean(email),
        });
        return {
          phone,
          name,
          email,
        };
      }

      console.warn(
        '[consultHelper] 기존 카카오 세션에서는 전화번호를 가져오지 못했습니다. 재로그인을 시도합니다.',
      );
    } catch (error) {
      console.warn(
        '[consultHelper] 기존 카카오 세션 기반 전화번호 조회 실패, 재로그인으로 대체합니다.',
        error,
      );
    }
  }

  // 2) 세션이 없거나, 기존 세션에서 정보를 얻지 못한 경우에만 카카오 로그인 팝업 실행
  const userInfo = await loginWithKakao({
    scopes: ['phone_number', 'name'],
    fetchUserInfo: true,
  });

  const contact = {
    phone: sanitizePhoneNumber(userInfo?.phone),
    name: userInfo?.name || '',
    email: userInfo?.email || '',
  };

  // eslint-disable-next-line no-console
  console.info('[consultHelper] attemptFetchKakaoContact: loginWithKakao result', {
    hasPhone: Boolean(contact.phone),
    phone: contact.phone,
    hasName: Boolean(contact.name),
    hasEmail: Boolean(contact.email),
  });

  return contact;
};

export async function ensureConsultContact(data = {}, options = {}, callbacks = {}) {
  // [변경] 카카오 로그인 프로세스 제거: 기본값을 false로 변경하여 카카오 로그인을 비활성화
  const { useKakao = false, requirePhone = false } = options;
  const { onKakaoStart, onKakaoSuccess, onKakaoFail } = callbacks || {};
  const result = {
    data: { ...data },
    originalPhone: data?.phone || '',
    phoneObtainedViaKakao: false,
    phoneSanitized: '',
    kakaoTried: false,
    kakaoError: null,
    kakaoCancelled: false,
    phoneMissing: false,
    error: null,
  };

  result.data.phone = sanitizePhoneNumber(result.data.phone);
  result.phoneSanitized = result.data.phone;

  // 디버깅용: 최초 입력값 상태
  // eslint-disable-next-line no-console
  console.info('[consultHelper] ensureConsultContact: initial', {
    useKakao,
    requirePhone,
    originalPhone: result.originalPhone,
    sanitizedPhone: result.phoneSanitized,
  });

  // [조건부 활성화] useKakao가 true일 때만 카카오 OAuth 실행 (카카오톡 버튼 전용)
  // 일반 상담 버튼은 useKakao=false로 호출되어 이 로직을 건너뜁니다.
  if (!result.data.phone && useKakao) {
    if (canUseKakaoOAuth()) {
      result.kakaoTried = true;
      try {
        onKakaoStart?.();
        const contact = await attemptFetchKakaoContact();
        onKakaoSuccess?.(contact);
        if (contact.phone) {
          result.data.phone = contact.phone;
          result.phoneSanitized = contact.phone;
          result.phoneObtainedViaKakao = true;
          // eslint-disable-next-line no-console
          console.info('[consultHelper] ensureConsultContact: phone obtained via Kakao OAuth', {
            phone: contact.phone,
          });
          // 카카오 로그인으로 확보한 연락처는 전역 스토리지에 항상 저장
          setStoredUserPhone(contact.phone);
        }
        if (!result.data.name && contact.name) {
          result.data.name = contact.name;
        }
        if (!result.data.email && contact.email) {
          result.data.email = contact.email;
        }
      } catch (kakaoError) {
        console.warn('[consultHelper] 카카오 OAuth로 연락처 확보 실패', kakaoError);
        result.kakaoError = kakaoError;
        result.kakaoCancelled = isKakaoOAuthCancelled(kakaoError);
        onKakaoFail?.(kakaoError);
      }
    }
  }

  result.phoneMissing = !result.data.phone;

  if (result.phoneMissing && requirePhone) {
    result.error = new Error('CONTACT_PHONE_MISSING');
  }

  // 디버깅용: 최종 결과 로그
  // eslint-disable-next-line no-console
  console.info('[consultHelper] ensureConsultContact: result summary', {
    kakaoTried: result.kakaoTried,
    phoneObtainedViaKakao: result.phoneObtainedViaKakao,
    phoneSanitized: result.phoneSanitized,
    phoneMissing: result.phoneMissing,
    kakaoCancelled: result.kakaoCancelled,
    hasError: Boolean(result.error),
  });

  return result;
}

/**
 * @deprecated 이 함수는 더 이상 사용되지 않습니다.
 * 카카오 OAuth로 연락처를 받는 플로우는 제거되었습니다.
 * 대신 모달을 통해 직접 연락처를 입력받도록 변경되었습니다.
 */
export async function acquireContactViaKakao(payload = {}, uiHandlers = {}, ensureOptions = {}) {
  // eslint-disable-next-line no-console
  console.warn('[consultHelper] acquireContactViaKakao is deprecated. Use modal input instead.');
  
  return {
    data: payload,
    originalPhone: '',
    phoneObtainedViaKakao: false,
    phoneSanitized: '',
    kakaoTried: false,
    kakaoError: null,
    kakaoCancelled: false,
    phoneMissing: true,
    error: null,
  };
}

export async function fetchPhoneWithKakaoFallback(given = '') {
  const trimmed = (given || '').trim();
  if (trimmed) {
    const sanitized = sanitizePhoneNumber(trimmed);
    const phoneInvalid = isPhoneTooShort(trimmed);
    // eslint-disable-next-line no-console
    console.info('[consultHelper] fetchPhoneWithKakaoFallback: using typed phone', {
      original: given,
      sanitized,
      phoneInvalid,
    });
    return {
      phone: sanitized,
      kakaoCancelled: false,
      kakaoError: null,
      phoneInvalid,
      validationMessage: phoneInvalid ? PHONE_MIN_DIGITS_MESSAGE : '',
    };
  }

  // [카카오 전용 함수] 카카오 로그인 기능 유지
  try {
    const contactInfo = await ensureConsultContact({}, { useKakao: true, requirePhone: false });
    const phone = sanitizePhoneNumber(contactInfo?.data?.phone || '');
    // eslint-disable-next-line no-console
    console.info('[consultHelper] fetchPhoneWithKakaoFallback: kakao result', {
      phone,
      phoneMissing: contactInfo?.phoneMissing,
      kakaoCancelled: contactInfo?.kakaoCancelled,
      hasError: Boolean(contactInfo?.kakaoError),
    });
    return {
      phone,
      kakaoCancelled: Boolean(contactInfo?.kakaoCancelled),
      kakaoError: contactInfo?.kakaoError || null,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[consultHelper] fetchPhoneWithKakaoFallback: unexpected error', error);
    return { phone: '', kakaoCancelled: isKakaoOAuthCancelled(error), kakaoError: error };
  }
}

// URL 프리셋을 이용해 상담 데이터 보강 (민감정보 제외)
function enrichWithUrlPreset(input) {
  const preset = parseConsultShareUrl();
  const pick = (k, fallback = '') =>
    (input?.[k] !== undefined && input[k] !== null && String(input[k]) !== '')
      ? input[k]
      : ((preset?.[k] !== undefined && preset[k] !== null && String(preset[k]) !== '')
          ? preset[k]
          : fallback);

  const merged = { ...input };
  merged.brand = pick('brand');
  merged.model = pick('model');
  merged.consultType = pick('consultType', '문의');
  merged.source = pick('source', input.source);
  merged.color = pick('color'); // URL 프리셋에서 color도 보강
  // 배열 필드 보강
  merged.terms = (Array.isArray(input.terms) && input.terms.length) ? input.terms : (preset.terms || []);
  merged.options = (Array.isArray(input.options) && input.options.length) ? input.options : (input.options || []);
  return merged;
}

/**
 * 공통 상담 제출 함수
 * - 연락처가 있으면: DB에 저장하고 알림톡 발송
 * - 연락처가 없으면: 카카오톡 링크만 열기
 * 
 * @param {ConsultData} data - 상담 데이터
 * @param {Object} options - 추가 옵션
 * @param {boolean} [options.openKakaoOnSuccess] - 성공 시 카카오톡 링크도 열지 여부
 * @returns {Promise<{ success: boolean, method: 'db' | 'kakao', message?: string }>}
 */
export async function submitConsult(data, options = {}) {
  const {
    openKakaoOnSuccess = false,
    kakaoOpenTarget = '_blank', // 더 이상 사용하지 않지만, 하위 호환을 위해 유지
    // [변경] 카카오 로그인 프로세스 제거: 기본값을 false로 변경하여 카카오 로그인을 비활성화
    useKakao = false,
  } = options;

  // 디버깅용: 초기 인자 상태
  // eslint-disable-next-line no-console
  console.info('[consultHelper] submitConsult: start', {
    data,
    options,
  });

  const resolvedSource = data.source || detectSourceFromLocation();

  // Analytics용 디바이스/세션 식별자 (페이지 로깅과 동일한 ID 사용)
  let deviceId = null;
  let sessionId = null;
  try {
    if (typeof window !== 'undefined') {
      deviceId = getOrCreateDeviceId();
      sessionId = getOrCreateSessionId(deviceId);
    }
  } catch {
    // 로컬 스토리지/브라우저 객체 접근 오류는 무시
  }
  // URL 프리셋으로 보강
  let enrichedData = enrichWithUrlPreset({ ...data, source: resolvedSource });

  // 0) 입력창에 전화번호가 이미 있으면 최우선 사용하고 OAuth는 완전히 스킵
  let contactInfo;
  const typedPhone = enrichedData.phone === null || enrichedData.phone === undefined
    ? ''
    : String(enrichedData.phone).trim();
  if (isPhoneTooShort(typedPhone)) {
    return {
      success: false,
      method: 'db',
      reason: 'phone_too_short',
      message: PHONE_MIN_DIGITS_MESSAGE,
      meta: {
        originalPhone: typedPhone,
        phoneSanitized: '',
        phoneMissing: true,
        phoneInvalid: true,
        popupBlocked: false,
      },
    };
  }
  if (typedPhone) {
    const phoneSanitized = sanitizePhoneNumber(typedPhone);
    enrichedData.phone = phoneSanitized;
    // 사용자가 입력한 연락처는 항상 로컬 스토리지에 보존
    setStoredUserPhone(phoneSanitized);
    contactInfo = {
      data: enrichedData,
      originalPhone: typedPhone,
      phoneObtainedViaKakao: false,
      phoneSanitized,
      kakaoTried: false,
      kakaoError: null,
      phoneMissing: !phoneSanitized,
      error: null,
    };
  } else {
    // [변경] 카카오 로그인 프로세스 제거: 연락처가 없으면 바로 phoneMissing으로 처리하여 모달이 뜨도록 함
    // eslint-disable-next-line no-console
    console.info('[consultHelper] submitConsult: no typed phone, skipping Kakao OAuth (disabled)', {
      useKakao,
    });
    // 카카오 OAuth 없이 바로 phoneMissing 상태로 설정
    contactInfo = {
      data: enrichedData,
      originalPhone: '',
      phoneObtainedViaKakao: false,
      phoneSanitized: '',
      kakaoTried: false,
      kakaoError: null,
      kakaoCancelled: false,
      phoneMissing: true,
      error: null,
    };
    enrichedData = contactInfo.data;
    // 기존 코드 (주석 처리):
    // contactInfo = await ensureConsultContact(enrichedData, { useKakao, requirePhone: false });
    // enrichedData = contactInfo.data;
  }

  // '카카오상담'은 백엔드 정책상 휴대폰연락과 동일 취급되도록 매핑
  if (enrichedData.consultType === '카카오상담') {
    enrichedData.consultType = '휴대폰연락';
  }
  const hasPhone = !contactInfo.phoneMissing;

  // eslint-disable-next-line no-console
  console.info('[consultHelper] submitConsult: after contact resolution', {
    hasPhone,
    phone: enrichedData.phone,
    viaKakaoOAuth: Boolean(contactInfo?.phoneObtainedViaKakao),
    phoneMissing: contactInfo.phoneMissing,
  });

  // 연락처가 없어도 이제는 DB에 그대로 남기되,
  // meta.phoneMissing 으로 프론트에서는 모달 등을 띄울 수 있게 유지한다.
  try {
    // 백엔드 API로 상담 정보 저장
    const payload = {
      name: enrichedData.name || '',
      phone: enrichedData.phone || '',
      email: enrichedData.email || '',
      model: enrichedData.model || '',
      brand: enrichedData.brand || '',
      trim: enrichedData.trim || '',
      color: enrichedData.color || '',
      options: enrichedData.options || [],
      terms: enrichedData.terms || [],
      consultType: enrichedData.consultType || '일반문의',
      source: resolvedSource,
      pageUrl: resolvePageUrl(enrichedData),
      message: buildConsultMessage(enrichedData),
      entryLabel: enrichedData.entryLabel || '',
      // 세션/디바이스 정보도 함께 전송 → 백엔드에서 상담과 세션 로그를 조인 가능
      deviceId: deviceId,
      sessionId: sessionId,
      ...enrichedData.extra,
    };

    // 상담 제출 시 Analytics 이벤트(consult_submit) 남기기
    try {
      sendAnalyticsData('consult_submit', {
        consultType: payload.consultType,
        consultSource: resolvedSource,
        hasPhone,
        viaKakaoOAuth: Boolean(contactInfo?.phoneObtainedViaKakao),
        entryLabel: payload.entryLabel || '',
      });
    } catch {
      // analytics 전송 실패는 상담 흐름에 영향 주지 않음
    }

    // consultAPI 사용 (실제 구현은 백엔드 엔드포인트에 따라 다를 수 있음)
    const backendResult = await consultAPI.sendQuickConsult(payload);
    const consultId = backendResult?.consultId;

    // eslint-disable-next-line no-console
    console.info('[consultHelper] submitConsult: backend sendQuickConsult result', backendResult);

    const metaResult = {
      ...(contactInfo || {}),
      popupBlocked: false,
      backendResult,
    };

    if (backendResult?.success === false) {
      return {
        success: false,
        method: 'db',
        message: backendResult?.message || '상담 신청에 실패했습니다. 잠시 후 다시 시도해주세요.',
        meta: metaResult,
      };
    }

    // eslint-disable-next-line no-console
    console.info('[consultHelper] submitConsult: success meta', metaResult);

    // 상담 성공 Analytics 이벤트
    try {
      sendAnalyticsData('consult_success', {
        consultType: enrichedData.consultType || '일반문의',
        consultSource: resolvedSource,
        hasPhone,
        viaKakaoOAuth: Boolean(contactInfo?.phoneObtainedViaKakao),
        entryLabel: enrichedData.entryLabel || '',
        consultId,
      });
    } catch {
      // ignore
    }

    return {
      success: true,
      method: 'db',
      message: '상담 신청이 접수되었습니다. 곧 연락드리겠습니다.',
      meta: metaResult,
    };
  } catch (error) {
    console.error('[consultHelper] 상담 저장 실패', error);
    // 상담 실패 Analytics 이벤트
    try {
      sendAnalyticsData('consult_fail', {
        consultType: enrichedData.consultType || '일반문의',
        consultSource: resolvedSource,
        hasPhone,
        viaKakaoOAuth: Boolean(contactInfo?.phoneObtainedViaKakao),
        entryLabel: enrichedData.entryLabel || '',
        errorMessage: error?.message || null,
      });
    } catch {
      // ignore
    }

    const meta = {
      ...(contactInfo || {}),
      popupBlocked: false,
    };

    // eslint-disable-next-line no-console
    console.info('[consultHelper] submitConsult: fail meta', meta);

    return {
      success: false,
      method: 'db',
      message: '상담 신청에 실패했습니다. 잠시 후 다시 시도해주세요.',
      meta,
    };
  }
}

/**
 * (리팩터링 버전)
 * 간단한 카카오톡 전송 헬퍼처럼 쓰이던 진입점을
 * 이제는 "무조건 백엔드로 상담 저장 + 로컬에 연락처 저장" 하는 래퍼로 사용한다.
 *
 * - 더 이상 window.open 으로 새 창을 열지 않는다.
 * - phone 이 없으면 바로 실패(reason: 'phone_missing')
 * - phone 이 있으면 submitConsult 로 위임한다.
 *
 * @param {ConsultData} data
 * @returns {Promise<{ success: boolean, method: 'db', message?: string, meta?: any, reason?: string }>}
 */
export async function sendToKakaoOnly(data) {
  try {
    const resolvedSource = data.source || detectSourceFromLocation();
    const pageUrl = resolvePageUrl({ ...data, source: resolvedSource });
    const rawPhone = data.phone || '';
    const phoneSanitized = sanitizePhoneNumber(rawPhone);
    const phoneInvalid = isPhoneTooShort(rawPhone);

    // eslint-disable-next-line no-console
    console.info('[consultHelper] sendToKakaoOnly: start', {
      data,
      resolvedSource,
      pageUrl,
      phoneSanitized,
      phoneInvalid,
    });

    if (phoneInvalid) {
      // eslint-disable-next-line no-console
      console.warn('[consultHelper] sendToKakaoOnly: phone too short, skipping submitConsult');
      return {
        success: false,
        method: 'db',
        reason: 'phone_too_short',
        message: PHONE_MIN_DIGITS_MESSAGE,
        meta: {
          phoneMissing: true,
          phoneInvalid: true,
        },
      };
    }

    if (!phoneSanitized) {
      // eslint-disable-next-line no-console
      console.warn('[consultHelper] sendToKakaoOnly: phone missing, skipping submitConsult');
      return { success: false, method: 'db', reason: 'phone_missing' };
    }

    // 항상 로컬 스토리지에 연락처 저장
    setStoredUserPhone(phoneSanitized);

    const payload = {
      ...data,
      phone: phoneSanitized,
      source: resolvedSource,
      pageUrl,
      consultType: data.consultType || '카카오상담',
    };

    const result = await submitConsult(payload, {
      openKakaoOnSuccess: false,
      useKakao: false,
    });

    // eslint-disable-next-line no-console
    console.info('[consultHelper] sendToKakaoOnly: delegated submitConsult result', result);

    return result;
  } catch (error) {
    console.error('[consultHelper] sendToKakaoOnly: unexpected error', error);
    return {
      success: false,
      method: 'db',
      reason: 'unknown_error',
      message: '상담 신청에 실패했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
}

/**
 * 카카오톡 채널 전용 상담 신청
 * - 카카오 OAuth로 연락처 받기 시도 (선택적)
 * - 무조건 카카오톡 채널 링크 팝업 열기
 * - 알림톡 발송 안 함 (카카오톡 채널로만 전달)
 * 
 * @param {Object} data - 상담 데이터
 * @param {Object} options - 옵션
 * @param {boolean} options.tryOAuth - 카카오 OAuth 시도 여부 (기본: true)
 * @param {string} options.channelId - 카카오톡 채널 ID (기본: '_TIYxaC')
 * @returns {Promise<{ success: boolean, method: 'kakao-channel', contactObtained?: boolean }>}
 */
export async function sendToKakaoChannelOnly(data, options = {}) {
  const {
    tryOAuth = true,
    channelId = '_TIYxaC',
  } = options;

  let contactInfo = {
    data: { ...data },
    phone: data.phone || '',
    name: data.name || '',
    phoneMissing: !data.phone,
  };

  // 1️⃣ 카카오 OAuth로 연락처 받기 시도 (선택적)
  if (tryOAuth && !contactInfo.phone) {
    try {
      // eslint-disable-next-line no-console
      console.info('[consultHelper] sendToKakaoChannelOnly: trying Kakao OAuth for contact');
      
      const result = await ensureConsultContact(data, { 
        useKakao: true, 
        requirePhone: false 
      });
      
      if (result && result.data) {
        contactInfo = result;
      }
      
      // eslint-disable-next-line no-console
      console.info('[consultHelper] sendToKakaoChannelOnly: OAuth result', {
        phoneMissing: result?.phoneMissing,
        phone: result?.data?.phone ? '***' : 'none',
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[consultHelper] sendToKakaoChannelOnly: OAuth failed, continuing anyway', error);
    }
  }

  // 2️⃣ 카카오톡 채널 링크 생성
  const channelData = {
    ...data,
    ...contactInfo.data,
    phone: contactInfo.data?.phone || data.phone || '',
    name: contactInfo.data?.name || data.name || '',
  };

  const kakaoChannelUrl = consultAPI.createChatLinkDirect(channelData, channelId);
  
  // eslint-disable-next-line no-console
  console.info('[consultHelper] sendToKakaoChannelOnly: opening Kakao Channel', {
    url: kakaoChannelUrl,
    hasPhone: Boolean(channelData.phone),
  });

  // 3️⃣ 카카오톡 채널 링크 팝업 열기 (무조건!)
  try {
    const popup = window.open(kakaoChannelUrl, '_blank', 'width=500,height=700');
    
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('[consultHelper] sendToKakaoChannelOnly: popup blocked');
      
      return {
        success: false,
        method: 'kakao-channel',
        reason: 'popup_blocked',
        contactObtained: !contactInfo.phoneMissing,
        kakaoChannelUrl, // 팝업 실패 시 사용자에게 URL 제공
      };
    }

    // 연락처를 받았으면 로컬스토리지에 저장
    if (channelData.phone) {
      setStoredUserPhone(channelData.phone);
    }
    if (channelData.name) {
      localStorage.setItem('wgl_user_name', channelData.name);
    }

    return {
      success: true,
      method: 'kakao-channel',
      contactObtained: !contactInfo.phoneMissing,
      kakaoChannelUrl,
    };
  } catch (error) {
    console.error('[consultHelper] sendToKakaoChannelOnly: error opening popup', error);
    
    return {
      success: false,
      method: 'kakao-channel',
      reason: 'popup_error',
      contactObtained: !contactInfo.phoneMissing,
      kakaoChannelUrl,
    };
  }
}

/**
 * 🆕 DB 저장 + 카카오톡 채널 팝업 (알림톡 없음) - 범용 함수
 * 
 * @param {Object} data - 상담 데이터 (phone, name, consultType 등)
 * @param {Object} options - 옵션
 * @param {boolean} options.tryOAuth - OAuth로 연락처 시도 여부 (기본: true)
 * @param {string} options.channelId - 카카오톡 채널 ID (기본: '_TIYxaC')
 * @param {boolean} options.saveToDb - DB 저장 여부 (기본: true)
 * @returns {Promise<Object>} - { success, dbSaved, kakaoOpened, kakaoChannelUrl, contactObtained }
 */
export async function sendToDBAndKakaoChannel(data, options = {}) {
  const {
    tryOAuth = true,
    channelId = '_TIYxaC',
    saveToDb = true,
  } = options;

  let dbResult = { success: false };
  let contactInfo = {
    data: { ...data },
    phone: data.phone || '',
    name: data.name || '',
    phoneMissing: !data.phone,
  };

  // 1️⃣ OAuth로 연락처 시도 (옵션)
  if (tryOAuth && !contactInfo.phone) {
    try {
      // eslint-disable-next-line no-console
      console.info('[consultHelper] sendToDBAndKakaoChannel: trying OAuth for contact');
      
      const oauthResult = await loginWithKakao();
      
      if (oauthResult.success && oauthResult.phoneNumber) {
        contactInfo.phone = oauthResult.phoneNumber;
        contactInfo.phoneMissing = false;
        contactInfo.data.phone = oauthResult.phoneNumber;
        
        if (oauthResult.name) {
          contactInfo.name = oauthResult.name;
          contactInfo.data.name = oauthResult.name;
        }
        
        // eslint-disable-next-line no-console
        console.info('[consultHelper] sendToDBAndKakaoChannel: OAuth success');
      } else {
        // eslint-disable-next-line no-console
        console.warn('[consultHelper] sendToDBAndKakaoChannel: OAuth failed or cancelled');
      }
    } catch (error) {
      console.error('[consultHelper] sendToDBAndKakaoChannel: OAuth error', error);
    }
  }

  const finalData = {
    ...data,
    phone: contactInfo.phone || data.phone || '',
    name: contactInfo.name || data.name || '',
  };  // 2️⃣ DB 저장 (옵션)
  if (saveToDb) {
    try {
      // eslint-disable-next-line no-console
      console.info('[consultHelper] sendToDBAndKakaoChannel: saving to DB', finalData);
      
      dbResult = await submitConsult(finalData, {
        useKakao: false, // 알림톡 발송 안 함
        openKakaoOnSuccess: false, // submitConsult에서 카카오톡 열지 않음 (여기서 직접 처리)
      });
      
      // eslint-disable-next-line no-console
      console.info('[consultHelper] sendToDBAndKakaoChannel: DB save result', dbResult);
    } catch (error) {
      console.error('[consultHelper] sendToDBAndKakaoChannel: DB save error', error);
    }
  }

  // 3️⃣ 카카오톡 채널 팝업 열기 (무조건!)
  const kakaoChannelUrl = consultAPI.createChatLinkDirect(finalData, channelId);
  
  // eslint-disable-next-line no-console
  console.info('[consultHelper] sendToDBAndKakaoChannel: opening Kakao Channel', {
    url: kakaoChannelUrl,
    hasPhone: Boolean(finalData.phone),
  });

  let kakaoOpened = false;
  
  try {
    const popup = window.open(kakaoChannelUrl, '_blank', 'width=400,height=600');
    
    if (popup && !popup.closed && typeof popup.closed !== 'undefined') {
      kakaoOpened = true;
      
      // 연락처를 받았으면 로컬스토리지에 저장
      if (finalData.phone) {
        setStoredUserPhone(finalData.phone);
      }
      if (finalData.name) {
        localStorage.setItem('wgl_user_name', finalData.name);
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn('[consultHelper] sendToDBAndKakaoChannel: popup blocked');
    }
  } catch (error) {
    console.error('[consultHelper] sendToDBAndKakaoChannel: error opening popup', error);
  }

  return {
    success: dbResult.success || kakaoOpened,
    dbSaved: dbResult.success,
    kakaoOpened,
    kakaoChannelUrl,
    contactObtained: !contactInfo.phoneMissing,
  };
}
