import { useCallback, useState } from 'react';
import { submitConsult } from '../services/consultHelper';
import { useBcsUi } from './BcsUiContext';
import { digitsOnly, validatePhone } from './format';
import { CONSULT_FAIL_MESSAGE, CONSULT_SUCCESS_MESSAGE } from './site';

const PRIVACY_REQUIRED_MESSAGE = '개인정보 이용 동의에 체크해 주세요.';

const readField = (formData, name) => String(formData.get(name) ?? '').trim();

/**
 * 퍼블리싱 상담 폼(data-consult-form)을 실제 상담 API에 연결한다.
 *
 * 폼 마크업은 퍼블리싱 그대로 두고 onSubmit만 연결하면 된다. 읽는 필드 이름도 퍼블리싱과 같다.
 *   name, phone, brand, model | carModel, period(개월 숫자), carType(장기렌트|리스), privacyAgree
 *
 * source 는 퍼블리싱의 data-source 값을 그대로 쓴다(예: home-page, quick-sidebar).
 * 어드민 상담 목록의 "유입" 칸에서 어느 폼으로 들어왔는지 구분하는 데 쓰인다.
 */
export function useConsultForm({ source, entryLabel = '', defaults = {}, onSuccess } = {}) {
  const { showToast } = useBcsUi();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (submitting) return;
      const form = event.currentTarget;
      const formData = new FormData(form);

      const privacy = form.elements.namedItem('privacyAgree');
      if (privacy && !privacy.checked) {
        setError(PRIVACY_REQUIRED_MESSAGE);
        showToast(PRIVACY_REQUIRED_MESSAGE);
        return;
      }

      const phone = readField(formData, 'phone');
      const phoneError = validatePhone(phone);
      if (phoneError) {
        setError(phoneError);
        showToast(phoneError);
        return;
      }

      const model = readField(formData, 'model') || readField(formData, 'carModel') || defaults.model || '';
      const brand = readField(formData, 'brand') || defaults.brand || '';
      const period = readField(formData, 'period');
      const product = readField(formData, 'carType');
      const label = [entryLabel, product].filter(Boolean).join(' · ');

      setError('');
      setSubmitting(true);
      try {
        const result = await submitConsult(
          {
            name: readField(formData, 'name'),
            phone: digitsOnly(phone),
            brand,
            model,
            trim: defaults.trim || '',
            terms: period ? [`${period}개월`] : defaults.terms || [],
            consultType: model ? '차량견적요청' : '문의',
            source,
            entryLabel: label,
          },
          { useKakao: false },
        );

        if (!result?.success) {
          const message = result?.message || CONSULT_FAIL_MESSAGE;
          setError(message);
          showToast(message);
          return;
        }

        form.reset();
        showToast(CONSULT_SUCCESS_MESSAGE);
        onSuccess?.(result);
      } catch {
        setError(CONSULT_FAIL_MESSAGE);
        showToast(CONSULT_FAIL_MESSAGE);
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, showToast, source, entryLabel, defaults.model, defaults.brand, defaults.trim, defaults.terms, onSuccess],
  );

  return { handleSubmit, error, submitting };
}
