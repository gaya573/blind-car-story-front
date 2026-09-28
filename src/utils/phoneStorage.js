const PHONE_KEY = 'wgl_user_phone';
const PHONE_TS_KEY = 'wgl_user_phone_ts';
const PHONE_EXPIRY_MS = 1000 * 60 * 60 * 24 * 30; // 30일
export const PHONE_MIN_DIGITS = 6;
export const PHONE_MIN_DIGITS_MESSAGE = '연락처는 최소 6자리여야 합니다';

export const getPhoneDigits = (value) => {
  if (!value) return '';
  return String(value).replace(/[^\d]/g, '');
};

export const getPhoneValidationMessage = (
  value,
  emptyMessage = '연락처를 입력해 주세요.',
) => {
  const digits = getPhoneDigits(value);
  if (!digits) return emptyMessage;
  if (digits.length < PHONE_MIN_DIGITS) return PHONE_MIN_DIGITS_MESSAGE;
  return '';
};

const sanitizePhone = (value) => {
  const sanitized = getPhoneDigits(value).slice(0, 30);
  
  // 최소 6자리 이상이어야 유효한 연락처로 간주
  if (sanitized.length < PHONE_MIN_DIGITS) {
    return '';
  }
  
  return sanitized;
};

// 페이지에서 재사용할 수 있도록 공개용 래퍼도 제공
export const sanitizePhoneForStorage = (value) => sanitizePhone(value);

export const setStoredUserPhone = (value) => {
  if (typeof window === 'undefined') return '';
  const phone = sanitizePhone(value || '');
  
  // sanitizePhone에서 6자리 미만은 빈 문자열을 반환하므로
  // 여기서도 빈 문자열이면 저장하지 않고 기존 데이터 삭제
  if (!phone) {
    // 유효하지 않은 연락처는 로컬스토리지에서 삭제
    localStorage.removeItem(PHONE_KEY);
    localStorage.removeItem(PHONE_TS_KEY);
    return '';
  }
  
  localStorage.setItem(PHONE_KEY, phone);
  localStorage.setItem(PHONE_TS_KEY, String(Date.now()));
  return phone;
};

export const getStoredUserPhone = () => {
  if (typeof window === 'undefined') return '';
  const phone = localStorage.getItem(PHONE_KEY) || '';
  if (!phone) return '';
  
  // 기존에 저장된 연락처도 6자리 미만이면 유효하지 않으므로 삭제
  const digitsOnly = getPhoneDigits(phone);
  if (digitsOnly.length < PHONE_MIN_DIGITS) {
    localStorage.removeItem(PHONE_KEY);
    localStorage.removeItem(PHONE_TS_KEY);
    return '';
  }
  
  const timestamp = Number(localStorage.getItem(PHONE_TS_KEY));
  if (!timestamp) return phone;
  if (Date.now() - timestamp > PHONE_EXPIRY_MS) {
    localStorage.removeItem(PHONE_KEY);
    localStorage.removeItem(PHONE_TS_KEY);
    return '';
  }
  return phone;
};

export const clearStoredUserPhone = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PHONE_KEY);
  localStorage.removeItem(PHONE_TS_KEY);
};

