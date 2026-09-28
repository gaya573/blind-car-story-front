// 퍼블리싱 common.js의 금액·배지 표기를 그대로 옮긴 함수들.

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const formatWon = (value) => {
  const number = toNumber(value);
  return number === null ? '-' : `${number.toLocaleString('ko-KR')}원`;
};

export const formatWonTilde = (value) => {
  const number = toNumber(value);
  return number === null ? '-' : `${number.toLocaleString('ko-KR')}원~`;
};

export const formatMonthly = (value) => {
  const number = toNumber(value);
  return number === null ? '-' : number.toLocaleString('ko-KR');
};

/** 마감일까지 남은 일수. 마감일이 없거나 잘못되면 null. */
export const remainingDaysUntil = (deadline, now = Date.now()) => {
  if (!deadline) return null;
  const time = new Date(deadline).getTime();
  if (Number.isNaN(time)) return null;
  return Math.ceil((time - now) / 86400000);
};

export const deadlineBadgeText = (remainingDays) => {
  if (typeof remainingDays !== 'number') return '';
  if (remainingDays <= 0) return '오늘 마감';
  return `D-${remainingDays}`;
};

export const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

/** 퍼블리싱 validatePhone과 같은 규칙: 숫자 10~11자리. 문제 없으면 빈 문자열. */
export const validatePhone = (value) => {
  const digits = digitsOnly(value);
  if (!digits) return '연락처를 입력해 주세요.';
  if (digits.length < 10 || digits.length > 11) return '연락처 형식을 확인해 주세요.';
  return '';
};
