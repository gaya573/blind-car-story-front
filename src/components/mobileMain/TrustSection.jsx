import React from 'react';

/**
 * Trust Section Component - Pixso Design item-id=1:2806
 * 신용 걱정 NO! 섹션 - 신뢰성 강조 (인터뷰 후기 + 실시간 통계)
 */
const TrustSection = ({ styles }) => {
  return (
    <section className={styles.trustSection}>
      {/* 상단: 신용이 걱정돼도, 걱정 NO! */}
      <div className={styles.trustHeader}>
        <h2 className={styles.trustTitle}>
          <span className={styles.trustTitleWhite}>신용이 걱정돼도, 걱정 </span>
          <span className={styles.trustTitleYellow}>NO!</span>
        </h2>
      </div>

      {/* 3개 체크 항목 */}
      <div className={styles.trustCheckList}>
        <div className={styles.trustCheckItem}>
          <div className={styles.trustCheckIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className={styles.trustCheckText}>심사 승인율 독보적 1위</span>
        </div>
        <div className={styles.trustCheckItem}>
          <div className={styles.trustCheckIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className={styles.trustCheckText}>금융사고 0건</span>
        </div>
        <div className={styles.trustCheckItem}>
          <div className={styles.trustCheckIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className={styles.trustCheckText}>유튜브 구독자 7만 명</span>
        </div>
      </div>

      {/* 중간: 인터뷰 후기 카드 */}
      <div className={styles.trustInterviewCard}>
        <div className={styles.trustInterviewContent}>
          {/* 인터뷰 이미지 + 재생 버튼 */}
          <div className={styles.trustInterviewImageWrapper}>
            <img 
              src="/mobileMain/ss/인터뷰하는여성.svg" 
              alt="30대 직장인 인터뷰" 
              className={styles.trustInterviewImage}
              loading="lazy"
            />
            <div className={styles.trustPlayButton}>
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="22" cy="22" r="22" fill="rgba(0, 0, 0, 0.5)"/>
                <path d="M17 14L28 22L17 30V14Z" fill="white"/>
              </svg>
            </div>
          </div>
          
          {/* 후기 텍스트 */}
          <div className={styles.trustInterviewTextGroup}>
            <p className={styles.trustInterviewLabel}>30대 직장인 김OO 님 실제 견적 후기</p>
            <p className={styles.trustInterviewQuote}>"신용등급 때문에 망설였는데, 이곳은 먼저 승인부터 나더라고요."</p>
          </div>
        </div>

        {/* 차량 추천 카드 */}
        <div className={styles.trustCarRecommend}>
          <div className={styles.trustCarCard}>
            <div className={styles.trustPickBadge}>pick</div>
            <img 
              src="/mobileMain/ss/아반뗴.svg" 
              alt="아반떼" 
              className={styles.trustCarImage}
              loading="lazy"
            />
          </div>
          <div className={styles.trustCarInfo}>
            <span className={styles.trustCarName}>현대 아반떼 N</span>
            <span className={styles.trustCarPrice}>월 20만 원대부터 시작!</span>
          </div>
        </div>
      </div>

      {/* 하단: 실시간 신뢰 숫자 */}
      <div className={styles.trustStatsCard}>
        <div className={styles.trustStatsContent}>
          {/* 제목 */}
          <div className={styles.trustStatsHeader}>
            <h3 className={styles.trustStatsTitle}>실시간으로 쌓이는 신뢰의 숫자</h3>
          </div>

          {/* 2개 통계 박스 */}
          <div className={styles.trustStatsBoxes}>
            <div className={styles.trustStatBox}>
              <span className={styles.trustStatLabel}>누적 승인 완료 수</span>
              <span className={styles.trustStatValue}>328,512건</span>
            </div>
            <div className={styles.trustStatBox}>
              <span className={styles.trustStatLabel}>무사고 일수</span>
              <span className={styles.trustStatValue}>연속 2,436일</span>
            </div>
          </div>

          {/* 플랫폼 설명 + CTA 버튼 */}
          <div className={styles.trustStatsFooter}>
            <p className={styles.trustPlatformText}>대한민국 심사 승인률 1위 플랫폼</p>
            <button className={styles.trustCTAButton} type="button">
              <span>알아보기</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;

