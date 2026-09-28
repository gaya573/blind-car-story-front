import { v4 as uuidv4 } from 'uuid';
import { API_BASE_URL } from '../config/apiConfig';
import { COALITION_BASE_PATH } from '../config/coalitionConfig';

const DEVICE_ID_KEY = 'wgl_device_id';
const SESSION_ID_KEY = 'wgl_session_id';
const LAST_ACTIVITY_KEY = 'wgl_last_activity';
const SESSION_SOURCE_KEY = 'wgl_session_source';
const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1시간

// 1. 고유 식별자 (Device ID) - 영구 유지
export const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

// 2. 세션 ID 관리 (30분 만료 로직)
export const getOrCreateSessionId = (deviceId) => {
    const now = Date.now();
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);

    // 세션 만료 체크
    if (!sessionId || !lastActivity || (now - parseInt(lastActivity) > SESSION_TIMEOUT_MS)) {
        // Keep an active stored session for compatibility; only new sessions use UUIDs.
        // All backend session_id columns are VARCHAR(64), so retain the full UUID and
        // cap only the optional device prefix.
        const sessionPrefix = String(deviceId || 'wgl').slice(0, 27);
        sessionId = `${sessionPrefix}_${uuidv4()}`;
        localStorage.setItem(SESSION_ID_KEY, sessionId);
    }

    localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    return sessionId;
};

// 3. 유입 경로 분석 (확장)
export const analyzeReferrer = () => {
  const currentUrl = new URL(window.location.href);
  const searchParams = currentUrl.searchParams;
  const referrer = document.referrer;

  // UTM 파라미터가 있으면 최우선으로 덮어쓰기
  if (searchParams.has('utm_source')) {
      const sessionData = {
        source: searchParams.get('utm_source'),
        medium: searchParams.get('utm_medium') || 'unknown',
        campaign: searchParams.get('utm_campaign') || 'unknown',
        term: searchParams.get('utm_term') || '',       // 추가됨
        content: searchParams.get('utm_content') || '', // 추가됨
        landingPage: window.location.pathname,
        referrerUrl: referrer || 'direct'
      };
      sessionStorage.setItem(SESSION_SOURCE_KEY, JSON.stringify(sessionData));
      return sessionData;
  }

  // 기존 저장된 정보가 있으면 반환
  const savedSource = sessionStorage.getItem(SESSION_SOURCE_KEY);
  if (savedSource) {
      try {
          return JSON.parse(savedSource);
      } catch (e) {}
  }

  // 저장된 게 없고 UTM도 없으면 Referrer 분석
  let source = 'direct';
  let medium = 'none';
  let campaign = 'none';

  if (referrer) {
    if (referrer.includes('naver.com')) {
      source = 'naver';
      medium = 'search';
    } else if (referrer.includes('youtube.com') || referrer.includes('youtu.be')) {
      source = 'youtube';
      medium = 'video';
    } else if (referrer.includes('google.com')) {
      source = 'google';
      medium = 'search';
    } else if (referrer.includes('facebook.com') || referrer.includes('instagram.com')) {
      source = 'social';
      medium = 'social';
    } else {
      try {
        const refUrl = new URL(referrer);
        source = refUrl.hostname;
        medium = 'referral';
      } catch (e) {
        source = referrer;
      }
    }
  }

  const sessionData = {
    source,
    medium,
    campaign,
    term: '',
    content: '',
    landingPage: window.location.pathname,
    referrerUrl: referrer || 'direct'
  };

  sessionStorage.setItem(SESSION_SOURCE_KEY, JSON.stringify(sessionData));
  return sessionData;
};

// 4. 봇 감지
export const detectBot = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isHeadless = /headless/i.test(userAgent);
  const isWebDriver = navigator.webdriver; 
  const isBotUserAgent = /bot|crawler|spider|crawling|slurp|googlebot|bingbot|baiduspider|yandexbot/i.test(userAgent);
  const isSmallScreen = (window.screen.width * window.screen.height) === 0;

  return {
    isBot: isHeadless || isWebDriver || isBotUserAgent || isSmallScreen,
    botType: isBotUserAgent ? 'search_engine' : (isWebDriver ? 'automation_tool' : (isSmallScreen ? 'abnormal_screen' : null))
  };
};

// 5. 데이터 전송
export const sendAnalyticsData = (eventType, data) => {
  const deviceId = getOrCreateDeviceId();
  const sessionId = getOrCreateSessionId(deviceId); // 세션 ID (30분 유지)
  const sessionData = analyzeReferrer();
  const botInfo = detectBot();

  // 로그인 유저 ID 확인 (로컬스토리지 'user' 키 가정)
  let userId = null;
  try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
          const user = JSON.parse(userStr);
          userId = user.id || null; // user.id가 있다고 가정
      }
  } catch (e) {}

  // 이벤트 발생 시각과 체류시간은 서버 시계를 단일 기준으로 사용한다.
  // 이전 호출부가 값을 넘겨도 analytics payload에는 포함하지 않는다.
  const eventData = { ...(data || {}) };
  delete eventData.timestamp;
  delete eventData.duration;

  const payload = {
    deviceId,
    sessionId,
    userId, // 회원 ID 전송
    eventType,
    url: window.location.href,
    path: window.location.pathname,
    
    // 유입 정보 (utmTerm, utmContent 포함)
    ...sessionData,
    utmTerm: sessionData.term,
    utmContent: sessionData.content,
    
    // 봇 정보
    isBot: botInfo.isBot,
    botType: botInfo.botType,

    // 디바이스 정보
    userAgent: navigator.userAgent,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,

    // 이벤트별 상세 데이터 병합
    ...eventData
  };

  // 개발 모드 로그
  if (import.meta.env.DEV) {
    console.groupCollapsed(`📊 Analytics: ${eventType}`);
    console.log(payload);
    console.groupEnd();
  }

  // 제휴사 전용 경로로 보내야 어드민 "제휴사 관리 > 분석"에 이 사이트 지표가 잡힌다.
  // 개발 서버에서는 API_BASE_URL이 '/'라, 그대로 이으면 '//api/...'가 되어
  // 브라우저가 'api'라는 호스트로 요청을 보낸다. 끝 슬래시를 떼고 붙인다.
  const apiUrl = `${String(API_BASE_URL).replace(/\/+$/, '')}${COALITION_BASE_PATH}/analytics/log`;

  try {
    // sendBeacon: 페이지 이탈 시에도 전송 보장
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const sent = navigator.sendBeacon(apiUrl, blob);
    
    if (!sent) {
        fetch(apiUrl, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true 
        }).catch(() => {});
    }
  } catch (e) {
    fetch(apiUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true 
    }).catch(() => {});
  }
};

// 6. 버튼/행동 단위 커스텀 로깅 헬퍼
// - eventType을 'button_click'으로 고정하고, 어떤 버튼인지 구분 가능한 ID를 함께 남긴다.
// - 필요시 extraData에 페이지/위치 정보 등을 자유롭게 추가.
export const logButtonClick = (buttonId, extraData = {}) => {
  if (!buttonId) return;
  sendAnalyticsData('button_click', {
    buttonId,
    ...extraData,
  });
};

// 7. 연락처 모달(카카오/브라우저) 흐름 로깅
// - 사용자가 "연락처 남기기" 모달을 열고 닫고 제출하는 과정을 추적하기 위한 용도
// - action: 'open' | 'submit' | 'cancel'
export const logContactModalEvent = (action, extraData = {}) => {
  if (!action) return;
  sendAnalyticsData('contact_modal', {
    action,
    ...extraData,
  });
};
