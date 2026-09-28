import React from 'react';
import { useBcsUi } from '../BcsUiContext';

/**
 * 퍼블리싱 .privacy-row. 개인정보 동의는 이용자가 직접 체크해야 하므로 기본값은 해제다.
 * (퍼블리싱 원본은 checked 로 되어 있었다.)
 */
export default function PrivacyRow({ id, label = '개인정보 이용 동의', className = 'privacy-row' }) {
  const { openPrivacy } = useBcsUi();
  return (
    <div className={className}>
      <input id={id} name="privacyAgree" type="checkbox" />
      <label htmlFor={id}>{label}</label>
      <a href="#privacy" onClick={openPrivacy}>
        [보기]
      </a>
    </div>
  );
}
