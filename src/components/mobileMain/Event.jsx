import React, { useState } from 'react';

/**
 * 이벤트/상담 섹션 컴포넌트
 * Home.jsx의 "당일 견적 확인"과 유사한 입력/제출 흐름을 제공합니다.
 */
const Event = ({
  styles,
  onSubmitEvent,
  isSubmitting,
  variant = 'yellow', // 'yellow' | 'blue'
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [carModel, setCarModel] = useState('');
  const [agree, setAgree] = useState(true);

  const isBlue = variant === 'blue';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agree) {
      alert('개인정보 이용 동의에 체크해 주세요.');
      return;
    }
    await onSubmitEvent?.({ name, phone, carModel });
  };

  return (
    <section
      className={`${styles.finalConsultSection} ${
        isBlue ? styles.finalConsultSectionBlue : styles.finalConsultSectionYellow
      }`}
    >
      <div className={styles.consultPenguinWrapper}>
        <img
          src="/mobileMain/상담하는 펭귄 1.svg"
          alt="상담하는 펭귄"
          className={styles.consultPenguinImg}
          loading="lazy"
        />
      </div>

      <div className={styles.consultFormCard}>
        <form className={styles.consultInputs} onSubmit={handleSubmit}>
          <div className={styles.consultInputField}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex) 홍길동"
              className={styles.consultTextInput}
              aria-label="이름"
            />
          </div>
          <div className={styles.consultInputField}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="ex) 01012345678"
              className={styles.consultTextInput}
              aria-label="연락처"
            />
          </div>
          <div className={styles.consultInputField}>
            <input
              type="text"
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
              placeholder="ex) 5시리즈"
              className={styles.consultTextInput}
              aria-label="차종"
            />
          </div>

          <div className={styles.consultPrivacyWrapper}>
            <div className={styles.consultCheckboxFrame}>
              <div className={styles.consultCheckboxGroup}>
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className={styles.consultCheckboxRect}
                  aria-label="개인정보 이용 동의"
                />
              </div>
            </div>
            <span className={styles.consultPrivacyText}>
              <span className={styles.consultPrivacySpan1}>[필수] 개인정보 이용 동의 </span>
              <span className={styles.consultPrivacySpan2}>[보기]</span>
            </span>
          </div>

          <button
            type="submit"
            className={`${styles.consultSubmitBtn} ${isBlue ? styles.consultSubmitBtnBlue : ''}`}
            disabled={isSubmitting}
          >
            <span className={styles.consultSubmitText}>{isSubmitting ? '전송 중...' : '실시간 무료견적 받기'}</span>
          </button>
        </form>
      </div>

      <div className={styles.consultRibbonBadge}>
        <img
          src="/mobileMain/ri.svg"
          alt="급시작확보"
          className={styles.consultRibbonImg}
          loading="lazy"
        />
      </div>

      <div className={styles.consultHandWrapper}>
        <img
          src="/mobileMain/노란색손.svg"
          alt="노란색손"
          className={styles.consultHandImg}
          loading="lazy"
        />
      </div>

      <div className={styles.consultSpeechBubble}>
        <img src="/mobileMain/말풍선.svg" alt="speech bubble" className={styles.consultSpeechBg} />
      </div>
      <span className={styles.consultSpeechText}>
        <span className={styles.consultSpeechSpan1}>최대 30곳의 비교 견적을 통해<br /></span>
        <span className={styles.consultSpeechSpan2}>최.저.가</span>
        <span className={styles.consultSpeechSpan3}> </span>
        <span className={styles.consultSpeechSpan4}>견적을 보내드립니다.</span>
      </span>

      <div className={styles.consultRedBadge}>
        <div className={styles.consultCartIcon}>
          <img
            src="/mobileMain/del.svg"
            alt="쇼핑카트"
            className={styles.consultCartIconImg}
            loading="lazy"
          />
        </div>
        <span className={styles.consultBadgeText}>블라인드 카스토리 단독 물량 확보</span>
      </div>
    </section>
  );
};

export default Event;

