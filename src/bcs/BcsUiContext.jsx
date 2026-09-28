import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import QuoteModal from './components/QuoteModal';

/**
 * 퍼블리싱 공용 UI(토스트, 개인정보 동의 모달, 실시간 견적 모달)를 한 곳에서 띄운다.
 * 퍼블리싱에서는 페이지마다 같은 마크업을 복사해 두었지만, SPA에서는 한 벌만 둔다.
 */
const BcsUiContext = createContext(null);

const TOAST_DURATION_MS = 2400;

export function BcsUiProvider({ children }) {
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [quote, setQuote] = useState({ open: false, carName: '', source: '', details: null });

  const showToast = useCallback((message) => {
    if (!message) return;
    setToastMessage(message);
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const openPrivacy = useCallback((event) => {
    event?.preventDefault?.();
    setPrivacyOpen(true);
  }, []);
  const closePrivacy = useCallback(() => setPrivacyOpen(false), []);

  /**
   * details: 상세 화면에서 고른 조건을 상담에 함께 싣는다.
   * { brand, trim, color, options[], terms[], consultType, entryLabel, extra }
   */
  const openQuote = useCallback((carName = '', source = 'quote-modal', details = null) => {
    setQuote({ open: true, carName: carName || '', source, details });
  }, []);
  const closeQuote = useCallback(() => setQuote((prev) => ({ ...prev, open: false })), []);

  useEffect(() => {
    if (!privacyOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') closePrivacy();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [privacyOpen, closePrivacy]);

  const value = useMemo(
    () => ({ showToast, openPrivacy, closePrivacy, openQuote, closeQuote }),
    [showToast, openPrivacy, closePrivacy, openQuote, closeQuote],
  );

  return (
    <BcsUiContext.Provider value={value}>
      {children}
      <QuoteModal open={quote.open} carName={quote.carName} source={quote.source} details={quote.details} onClose={closeQuote} />
      <div
        className={`modal-overlay${privacyOpen ? ' is-open' : ''}`}
        aria-hidden={privacyOpen ? 'false' : 'true'}
        onClick={(event) => {
          if (event.target === event.currentTarget) closePrivacy();
        }}
      >
        <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="bcs-privacy-title">
          <h2 id="bcs-privacy-title">개인정보 수집·이용 동의</h2>
          <p>수집 항목 : 성함, 연락처, 관심 차종</p>
          <p>이용 목적 : 신차 장기렌트·리스 견적 상담 및 결과 안내</p>
          <p>보유 기간 : 상담 종료 후 3개월 이내 파기하며, 동의를 거부하실 수 있습니다.</p>
          <button className="btn btn-primary" type="button" onClick={closePrivacy}>
            확인
          </button>
        </div>
      </div>
      <div className={`toast${toastVisible ? ' is-visible' : ''}`} role="status" aria-live="polite">
        {toastMessage}
      </div>
    </BcsUiContext.Provider>
  );
}

const noop = () => {};
const FALLBACK = {
  showToast: noop,
  openPrivacy: (event) => event?.preventDefault?.(),
  closePrivacy: noop,
  openQuote: noop,
  closeQuote: noop,
};

/** Provider 밖(단위 테스트 등)에서도 깨지지 않도록 빈 동작을 돌려준다. */
// Provider 와 훅을 한 파일에 두는 관례를 따른다(이 파일 수정 시 전체 새로고침될 뿐 동작 문제는 없다).
// eslint-disable-next-line react-refresh/only-export-components
export const useBcsUi = () => useContext(BcsUiContext) ?? FALLBACK;
