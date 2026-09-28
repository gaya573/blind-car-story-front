import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';
import { COALITION_BASE_PATH } from '../config/coalitionConfig';

export const consultHttp = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const consultAPI = {
  /**
   * 카카오톡 상담 링크 생성 (백엔드에서 DB 저장 + URL 생성)
   * @param {Object} data - 상담 신청 데이터
   * @param {string} data.phone - 고객 휴대폰 (선택사항)
   * @param {string} data.model - 차량 모델명 (예: "아반떼N")
   * @param {string} data.trim - 트림 (예: "프리미엄")
   * @param {string[]} data.terms - 약정 조건 배열 (예: ["2년", "3년"])
   * @param {string[]} data.options - 옵션 배열 (예: ["선루프"])
   * @param {string} data.consultType - 상담 종류: "문의" 또는 "차량견적요청"
   * @returns {Promise<{url: string}>} 카카오톡 채널 채팅 URL
   */
  createChatLink: async (data) => {
    try {
      console.log('[consultAPI.createChatLink] 시작, 데이터:', data);
      const requestData = {
        phone: data.phone || '',
        email: data.email || null,
        name: data.name || '',
        brand: data.brand || null,
        model: data.model || '문의',
        trim: data.trim || null,
        color: data.color || null,
        terms: data.terms || ['2년'],
        options: data.options || [],
        consultType: data.consultType || '문의',
        source: data.source || null,
        pageUrl: data.pageUrl || null,
        message: data.message || null,
        entryLabel: data.entryLabel || null,
      };
      console.log('[consultAPI.createChatLink] 요청 데이터:', requestData);
      console.log('[consultAPI.createChatLink] API 호출 시작');
      // 제휴사 전용 경로로 보내야 coalition_consult 테이블에 제휴사가 붙어 저장되고
      // 어드민 "제휴사 관리 > 상담 목록"에 이 사이트 상담만 모인다.
      const response = await consultHttp.post(`${COALITION_BASE_PATH}/consult/chat-link`, requestData);
      console.log('[consultAPI.createChatLink] API 호출 완료, 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('[consultAPI.createChatLink] 에러 발생:', error);
      console.error('[consultAPI.createChatLink] 에러 응답:', error.response?.data);
      console.error('[consultAPI.createChatLink] 에러 스택:', error.stack);
      throw error;
    }
  },

  /**
   * 프론트엔드에서 직접 카카오톡 채팅 URL 생성 (DB 저장 없이)
   * @param {Object} data - 상담 신청 데이터
   * @param {string} data.model - 차량 모델명
   * @param {string} data.trim - 트림
   * @param {string[]} data.terms - 약정 조건 배열
   * @param {string[]} data.options - 옵션 배열
   * @param {string} data.consultType - 상담 종류
   * @param {string} channelPublicId - 카카오톡 채널 Public ID (예: "_TIYxaC")
   * @returns {string} 카카오톡 채널 채팅 URL
   */
  createChatLinkDirect: (data, channelPublicId = '_TIYxaC') => {
    const extra = {
      name: data.name || '',
      phone: data.phone || '',
      brand: data.brand || '',
      model: data.model || '',
      trim: data.trim || '',
      color: data.color || '',
      terms: data.terms || [''],
      options: data.options || [],
      consultType: data.consultType || '',
      source: data.source || '',
      message: data.message || '',
      entryLabel: data.extra?.entryLabel || '',
      pageUrl: data.pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
      meta: data.extra || {},
    };
    
    // Base64 URL-safe 인코딩 (한글 지원)
    const json = JSON.stringify(extra);
    // UTF-8을 Base64로 인코딩 (한글 처리)
    const utf8Bytes = new TextEncoder().encode(json);
    const base64 = btoa(String.fromCharCode(...utf8Bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    return `https://pf.kakao.com/${channelPublicId}/chat?chat_event=car_consult&chat_extra=${base64}`;
  },

  /**
   * 퀵 상담 신청 (알림톡 발송 포함)
   * @param {Object} data - 상담 신청 데이터
   * @param {string} data.name - 고객 이름
   * @param {string} data.phone - 고객 휴대폰 (필수)
   * @param {string} data.model - 차량 모델명 (예: "아반떼N")
   * @param {string} data.trim - 트림 (예: "프리미엄")
   * @param {string[]} data.terms - 약정 조건 배열 (예: ["2년", "3년"])
   * @param {string[]} data.options - 옵션 배열 (예: ["선루프"])
   * @param {string} data.consultType - 상담 종류: "문의" 또는 "차량견적요청"
   * @returns {Promise<{success: boolean, message: string}>}
   */
  sendQuickConsult: async (data) => {
    try {
      console.log('[consultAPI.sendQuickConsult] 시작, 데이터:', data);
      const requestData = {
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || null,
        model: data.model || '문의',
        brand: data.brand || null,
        trim: data.trim || null,
        color: data.color || null,
        terms: data.terms || ['2년'],
        options: data.options || [],
        consultType: data.consultType || '문의',
        source: data.source || null,
        pageUrl: data.pageUrl || null,
        message: data.message || null,
        entryLabel: data.entryLabel || null,
        // 세션/디바이스 정보 전달 (있을 경우)
        deviceId: data.deviceId || null,
        sessionId: data.sessionId || null,
      };
      console.log('[consultAPI.sendQuickConsult] 요청 데이터:', requestData);
      console.log('[consultAPI.sendQuickConsult] API 호출 시작');
      const response = await consultHttp.post(`${COALITION_BASE_PATH}/consult/quick-consult`, requestData);
      console.log('[consultAPI.sendQuickConsult] API 호출 완료, 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('[consultAPI.sendQuickConsult] 에러 발생:', error);
      console.error('[consultAPI.sendQuickConsult] 에러 응답:', error.response?.data);
      console.error('[consultAPI.sendQuickConsult] 에러 스택:', error.stack);
      throw error;
    }
  }
};

export default consultAPI;

