import React, { useState } from 'react';
import styles from './layout/QuickConsult.module.css';
import PrivacyPolicyModal from '../pages/auth/PrivacyPolicyModal.jsx';

/**
 * 개인정보 수집·이용 동의 체크박스 공용 컴포넌트
 *
 * - label / 스타일은 빠른 견적문의(QuickConsult)와 동일하게 유지
 * - checked / onChange 로 제어 가능한 controlled 컴포넌트
 * - [보기] 클릭 시 항상 개인정보 처리방침 모달을 오픈
 * - align: 'left' | 'right' - 정렬 방향 (기본값: 'left')
 */
const PrivacyConsentCheckbox = ({
  id = 'privacy-consent',
  checked,
  onChange,
  align = 'left',
}) => {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const alignStyle = align === 'right' ? { 
    marginLeft: 'auto', 
    marginRight: 0,
    maxWidth: 'none',
    width: 'auto'
  } : {};
  
  return (
    <>
      <div 
        className={styles['privacy-checkbox']} 
        style={alignStyle}
        data-align={align}
      >
        <label htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => {
              if (onChange) {
                onChange(e.target.checked);
              }
            }}
          />
          <span>
            [필수] 개인정보 이용 동의{' '}
            <span
              className={styles['view-link']}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsPrivacyOpen(true);
              }}
            >
              [보기]
            </span>
          </span>
        </label>
      </div>

      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </>
  );
};

export default PrivacyConsentCheckbox;


