export const KAKAO_POPUP_BLOCKED_MESSAGE =
  '카카오톡 팝업이 차단되었습니다. 원활한 상담을 위해 연락처를 남겨주시면 담당자가 바로 연락드리겠습니다.';

/**
 * 공통 카카오톡 팝업 차단 처리
 * @param {Object} result submitConsult/sendToKakaoOnly 결과
 * @param {Object} options
 * @param {string} [options.message]
 * @param {(result: Object) => void} [options.onNeedContact] 연락처 입력 모달을 열어야 할 때 호출
 * @returns {boolean} true면 팝업 차단으로 이미 처리됨
 */
export function handleKakaoPopupBlocked(result, options = {}) {
  const popupBlocked =
    result?.meta?.popupBlocked || result?.reason === 'popup_blocked';
  if (!popupBlocked) return false;

  const phoneMissing =
    result?.meta?.phoneMissing ??
    !(result?.meta?.phoneSanitized && String(result.meta.phoneSanitized).trim());

  if (!phoneMissing) {
    return false;
  }

  const { message = KAKAO_POPUP_BLOCKED_MESSAGE, onNeedContact } = options;

  // eslint-disable-next-line no-alert
  alert(message);

  if (typeof onNeedContact === 'function') {
    onNeedContact(result);
  }

  return true;
}
