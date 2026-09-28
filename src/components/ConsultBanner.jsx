import React from 'react';

/**
 * 재사용 가능한 상담 배너 컴포넌트
 * props:
 *  - styles: CSS Module 객체 (Home.module.css)
 *  - onSubmit: 폼 submit 핸들러 (이벤트 인자 그대로 전달)
 */
const ConsultBanner = ({ styles, onSubmit }) => {
  if (!styles || typeof onSubmit !== 'function') return null;

  return (
    <section className={styles['consult-banner']}>
      <div className={styles['consult-banner-left']}>
        <img src="/home/모바일.svg" alt="모바일 앱" className={styles['consult-phone-img']} />
        <div className={styles['consult-text-group']}>
          <div className={styles['consult-text-title']}>심사승인율 독보적 1위 블라인드 카스토리</div>
          <div className={styles['consult-number']}>1577 - 8319</div>
          <div className={styles['consult-subtext']}>*언제든지 무료상담/문의 가능합니다.</div>
        </div>
      </div>

      <div className={styles['consult-banner-right']}>
        <div className={styles['consult-form-title']}>1분만에 카카오로 스으윽~~~</div>
        <form className={styles['consult-form-container']} onSubmit={onSubmit}>
          <div className={styles['consult-inputs']}>
            <div className={styles['consult-input-row']}>
              <label className={styles['consult-label']}>이름</label>
              <input type="text" name="name" className={styles['consult-input']} placeholder="ex) 홍길동 " required />
            </div>
            <div className={styles['consult-input-row']}>
              <label className={styles['consult-label']}>연락처</label>
              <input type="tel" name="phone" className={styles['consult-input']} placeholder="ex) 01012345678" required />
            </div>
            <div className={styles['consult-input-row']}>
              <label className={styles['consult-label']}>차종</label>
              <input type="text" name="carModel" className={styles['consult-input']} placeholder="ex) 쏘렌토" />
            </div>
          </div>
          <button type="submit" className={styles['consult-submit-btn']}>
            실시간 무료견적 받기
            <img src="/home/손모양.png" alt="" className={styles['consult-hand-img']} />
          </button>
        </form>
      </div>
    </section>
  );
};

export default ConsultBanner;
