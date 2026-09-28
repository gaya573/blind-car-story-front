import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import './EstimateModal.css';
import RegionSelect from '../RegionSelect';
import { handleKakaoPopupBlocked } from '../../utils/kakaoPopup';

// 입력값 우선, 없으면 카카오 OAuth로 연락처 확보 (최대 30자)
async function ensurePhone(given = '') {
  const v = (given || '').trim();
  if (v) return v.length > 30 ? v.slice(0, 30) : v;
  try {
    const { loginWithKakao } = await import('../../utils/kakaoAuth');
    const user = await loginWithKakao({ scopes: ['phone_number', 'name'], fetchUserInfo: true });
    const phone = (user?.phone || '').trim();
    return phone.length > 30 ? phone.slice(0, 30) : phone;
  } catch {
    return '';
  }
}

const EstimateModal = ({ 
  open, 
  onClose, 
  carName = '', 
  trimName = '',
  selectedColor = '',
  selectedOptions = [],
  contractConditions = null,
}) => {
  const [customerType, setCustomerType] = useState('개인');
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [sido, setSido] = useState('');
  const [gungu, setGungu] = useState('');
  const [message, setMessage] = useState('');

  // 공용 RegionSelect 사용

  const CustomSelect = ({ value, onChange, options, placeholder = '', disabled = false }) => {
    const [openMenu, setOpenMenu] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const handler = (e) => {
        if (ref.current && !ref.current.contains(e.target)) setOpenMenu(false);
      };
      const esc = (e) => { if (e.key === 'Escape') setOpenMenu(false); };
      document.addEventListener('mousedown', handler);
      document.addEventListener('keydown', esc);
      return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc); };
    }, []);

    const currentLabel = value || '';
    return (
      <div className={`custom-select ${disabled ? 'disabled' : ''}`} ref={ref}>
        <button type="button" className="custom-select-trigger" onClick={() => !disabled && setOpenMenu((v) => !v)}>
          <span>{currentLabel || placeholder}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        {openMenu && !disabled && (
          <div className="custom-select-menu">
            {options.map((opt) => (
              <div key={opt} className={`custom-select-item ${opt === value ? 'selected' : ''}`} onClick={() => { onChange(opt); setOpenMenu(false); }}>
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, handleClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { submitConsult } = await import('../../services/consultHelper');
      const finalPhone = await ensurePhone(phone);
      
      // 계약 조건 구성
      const terms = [];
      if (contractConditions) {
        if (contractConditions.method) terms.push(contractConditions.method);
        if (contractConditions.period) terms.push(contractConditions.period);
        if (contractConditions.deposit && contractConditions.deposit !== '없음') {
          terms.push(`보증금 ${contractConditions.deposit}`);
        }
        if (contractConditions.prepayment && contractConditions.prepayment !== '없음') {
          terms.push(`선납금 ${contractConditions.prepayment}`);
        }
        if (contractConditions.mileage) terms.push(contractConditions.mileage);
      }
      
      // 옵션 구성
      const options = [];
      if (selectedColor) {
        options.push(`색상: ${selectedColor}`);
      }
      if (selectedOptions && Array.isArray(selectedOptions)) {
        options.push(...selectedOptions);
      }
      
      // 상담 데이터 구성
      const consultData = {
        name: name || '',
        phone: finalPhone || '',
        email: '',
        model: carName || '',
        brand: '',
        trim: trimName || '',
        color: selectedColor || '',
        options: options,
        terms: terms,
        consultType: '비대면견적',
        source: 'estimate-modal',
        entryLabel: '견적 모달',
        extra: {
          sido: sido || '',
          gungu: gungu || '',
          message: message || '',
          birth: birth || '',
          customerType: customerType || '개인',
        },
      };
      
      const result = await submitConsult(consultData);
      
      handleKakaoPopupBlocked(result);

      if (result.success) {
        alert(result.message || '비대면 견적 신청이 접수되었습니다.');
        handleClose();
      } else {
        alert(result.message || '상담 신청에 실패했습니다.');
      }
    } catch (error) {
      console.error('[EstimateModal] 상담 신청 실패', error);
      alert('상담 신청에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  if (!open) return null;

  return (
    <div className="estimate-modal" role="dialog" aria-modal="true" onClick={handleClose}>
      <div className="estimate-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="estimate-modal-header">
          <span className="estimate-modal-title">실시간 견적문의</span>
          <button className="estimate-modal-close" aria-label="닫기" onClick={handleClose}>×</button>
        </div>

        <div className="estimate-modal-hero">
          <div className="estimate-car-thumb" />
          <div className="estimate-car-meta">
            <div className="estimate-car-name">{carName}</div>
            {trimName && <div className="estimate-car-trim">{trimName}</div>}
          </div>
        </div>

        <div className="estimate-modal-tabs" role="tablist" aria-label="고객 유형">
          <button
            className={`estimate-tab ${customerType === '개인' ? 'active' : ''}`}
            role="tab"
            aria-selected={customerType === '개인'}
            onClick={() => setCustomerType('개인')}
          >
            개인
          </button>
          <button
            className={`estimate-tab ${customerType === '사업자' ? 'active' : ''}`}
            role="tab"
            aria-selected={customerType === '사업자'}
            onClick={() => setCustomerType('사업자')}
          >
            사업자
          </button>
        </div>

        <form className="estimate-modal-body" onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <input
              type="text"
              placeholder="생년월일 (선택) ex)19910101"
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>
          <div className="form-row">
            <input
              type="tel"
              placeholder="연락처"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <RegionSelect valueSido={sido} valueGungu={gungu} onChangeSido={setSido} onChangeGungu={setGungu} />
          <div className="form-row">
            <textarea
              placeholder="문의사항"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          <label className="privacy-row">
            <input type="checkbox" name="privacy" value="true" checked onChange={() => {}} className="locked-checkbox" />
            <span>개인정보 수집 · 이용 동의</span>
          </label>

          <button type="submit" className="submit-btn">실시간 무료견적 받기</button>
        </form>
      </div>
    </div>
  );
};

export default EstimateModal;


