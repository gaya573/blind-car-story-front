import { useCallback, useState } from 'react';
import { submitConsult } from '../../services/consultHelper';
import { getStoredUserPhone } from '../../utils/phoneStorage';
import { useBcsUi } from '../../bcs/BcsUiContext';
import { digitsOnly, validatePhone } from '../../bcs/format';
import { CONSULT_FAIL_MESSAGE, CONSULT_SUCCESS_MESSAGE } from '../../bcs/site';

const PRIVACY_REQUIRED_MESSAGE = '개인정보 이용 동의에 체크해 주세요.';

/**
 * 차량 상세 "내 차 견적서" 접수 흐름 (기존 상세 페이지 흐름 유지).
 *  1) 개인정보 동의 확인
 *  2) 이전에 남긴 연락처가 있으면 바로 접수
 *  3) 없으면 연락처 입력 모달을 띄우고, 모달에서 받은 이름·연락처로 접수
 * buildPayload(phone) 는 선택한 트림·색상·옵션·계약조건을 담은 상담 데이터를 돌려준다.
 */
export function useCarDetailConsult(buildPayload) {
  const { showToast } = useBcsUi();
  const [estimateError, setEstimateError] = useState('');
  const [contactError, setContactError] = useState('');
  const [contactOpen, setContactOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const send = useCallback(
    async (payload, options) => {
      setSubmitting(true);
      try {
        const result = await submitConsult(payload, options);
        if (result?.success) {
          showToast(CONSULT_SUCCESS_MESSAGE);
          return { ok: true };
        }
        const message = result?.message || CONSULT_FAIL_MESSAGE;
        showToast(message);
        return { ok: false, message };
      } catch {
        showToast(CONSULT_FAIL_MESSAGE);
        return { ok: false, message: CONSULT_FAIL_MESSAGE };
      } finally {
        setSubmitting(false);
      }
    },
    [showToast],
  );

  const handleEstimateSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (submitting) return;
      const privacy = event.currentTarget.elements.namedItem('privacyAgree');
      if (privacy && !privacy.checked) {
        setEstimateError(PRIVACY_REQUIRED_MESSAGE);
        showToast(PRIVACY_REQUIRED_MESSAGE);
        return;
      }
      setEstimateError('');

      const storedPhone = getStoredUserPhone();
      if (!storedPhone) {
        setContactError('');
        setContactOpen(true);
        return;
      }
      const { ok, message } = await send(buildPayload(storedPhone), { openKakaoOnSuccess: false, useKakao: false });
      if (!ok) setEstimateError(message);
    },
    [buildPayload, send, showToast, submitting],
  );

  const handleContactSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (submitting) return;
      const form = event.currentTarget;
      const formData = new FormData(form);
      const phone = String(formData.get('phone') ?? '').trim();
      const phoneError = validatePhone(phone);
      if (phoneError) {
        setContactError(phoneError);
        showToast(phoneError);
        return;
      }
      setContactError('');
      const payload = { ...buildPayload(digitsOnly(phone)), name: String(formData.get('name') ?? '').trim() };
      const { ok, message } = await send(payload, { kakaoOpenTarget: '_blank', openKakaoOnSuccess: true, useKakao: false });
      if (ok) {
        form.reset();
        setContactOpen(false);
      } else {
        setContactError(message);
      }
    },
    [buildPayload, send, showToast, submitting],
  );

  const closeContact = useCallback(() => setContactOpen(false), []);

  return {
    handleEstimateSubmit,
    handleContactSubmit,
    estimateError,
    contactError,
    contactOpen,
    closeContact,
    submitting,
  };
}
