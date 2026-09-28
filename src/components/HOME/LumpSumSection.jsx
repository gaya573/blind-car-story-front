import React from 'react';
import styles from './LumpSumSection.module.css';

const LumpSumSection = () => {
  return (
    <section className={styles['lump-sum-section']}>
      <div className={styles['lump-sum-absolute-container']}>
        
        {/* 상단 히어로 (top: 90px) */}
        <div className={styles['lump-sum-hero-group']}>
          <div className={styles['lump-sum-hero-text']}>
            <h1 className={styles['lump-sum-hero-title']}>
              일시불보다 1,000만원 저렴하게<br />
              구입할 수 있는 장기렌트!
            </h1>
            <p className={styles['lump-sum-hero-subtitle']}>
              디 올 뉴 팰리세이드 2025년형 가솔린 터보 2.5 하이브리드 (7인승) 익스클루시브 2WD A/T<br />
              - 현대 스마트센스, 컴포트
            </p>
          </div>
          <div className={styles['lump-sum-hero-car']}>
            <img src="/mobileMain/쏘렌토.png" alt="팰리세이드" />
          </div>
          <div className={styles['lump-sum-hero-price-group']}>
            <span className={styles['lump-sum-hero-price-text']}>54,260,000원</span>
            <div className={styles['lump-sum-hero-price-underline']} />
          </div>
        </div>

        {/* 개인 장기렌트 비교 (top: 728px) */}
<div className={styles['lump-sum-personal-group']}>
          {/* 펭귄 (왼쪽 상단) */}
          <div className={styles['lump-sum-personal-penguin']}>
            <img src="/일시불보다 1000/머리긁는펭귄/고민하는 펭귄.png" alt="펭귄" />
          </div>
          {/* 말풍선 이미지 */}
          <div className={styles['lump-sum-personal-speech']}>
            <img src="/일시불보다 1000/머리긁는펭귄/개인이 장기렌트가 유리한 이유는.png" alt="개인이 장기렌트가 유리한 이유는?" />
          </div>

          {/* 중앙 컨텐츠 (테이블 + 실제 견적) */}
          <div className={styles['lump-sum-personal-center']}>
            {/* 비교표 */}
            <div className={styles['lump-sum-personal-table']}>
              <table className={styles['lump-sum-table-personal']}>
                <thead>
                  <tr>
                    <th>항목</th>
                    <th>개인 일시불</th>
                    <th className={styles['th-highlight']}>개인 장기렌트카</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>월 납입금</td>
                    <td>월 0원</td>
                    <td className={styles['td-highlight']}>월 556,820원<br/>총 46,772,880원</td>
                  </tr>
                  <tr>
                    <td>취등록세(선납)</td>
                    <td>총 66,683,347원</td>
                    <td className={styles['td-highlight']}>0원</td>
                  </tr>
                  <tr>
                    <td>보험료</td>
                    <td>년 1,000,000원<br/>총 7,000,000원 (견적에 포함)</td>
                    <td className={styles['td-highlight']}>0원</td>
                  </tr>
                  <tr>
                    <td>자동차세</td>
                    <td>년 649,220원<br/>총 350만원 (견적에 포함)</td>
                    <td className={styles['td-highlight']}>0원</td>
                  </tr>
                  <tr>
                    <td>잔존가치</td>
                    <td>0원</td>
                    <td className={styles['td-highlight']}>9,701,000원</td>
                  </tr>
                  <tr className={styles['tr-total']}>
                    <td>합계</td>
                    <td>총 66,683,349원</td>
                    <td className={styles['td-highlight']}>총 56,473,880원</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 실제 견적 기준 박스 (오른쪽) */}
            <div className={styles['lump-sum-personal-estimate-box']}>
              <div className={styles['estimate-box-bg']} />
              <div className={styles['estimate-box-label']}>
                <span>실제 견적 기준</span>
              </div>
              <div className={styles['estimate-box-carousel']}>
                <button className={styles['estimate-carousel-btn']} aria-label="이전">‹</button>
                <img src="/일시불보다 1000/계약서.png" alt="실제 계약서" />
                <button className={styles['estimate-carousel-btn']} aria-label="다음">›</button>
              </div>
            </div>
          </div>

          {/* 차종 표시 */}
          <span className={styles['lump-sum-personal-subtitle']}>차종 : 펠리세이드 하이브리드</span>
        </div>

        {/* 사업자 장기렌트 비교 (top: 1497px) */}
        <div className={styles['lump-sum-business-group']}>
          {/* 말풍선 (오른쪽 상단) */}
          <div className={styles['lump-sum-business-speech']}>
            <img src="/일시불보다 1000/좋아하는펭귄/사업자도 장기렌트 유리한 이유는.png" alt="사업자도 장기렌트가 유리한 이유는?" />
          </div>

          {/* 펭귄 (오른쪽 상단) */}
          <div className={styles['lump-sum-business-penguin']}>
            <img src="/일시불보다 1000/좋아하는펭귄/좋아하는펭귄.png" alt="펭귄" />
          </div>

          {/* 비교표 */}
          <div className={styles['lump-sum-business-table']}>
            <table className={styles['lump-sum-table-business']}>
              <thead>
                <tr>
                  <th>항목</th>
                  <th>사업자 미구입시</th>
                  <th className={styles['th-highlight']}>사업자 장기렌트 (7년 기준)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>차량 총비용</td>
                  <td>해당 없음</td>
                  <td className={styles['td-highlight']}>56,473,880원 (월 556,820원 x 84개월)</td>
                </tr>
                <tr>
                  <td>연간 렌트비</td>
                  <td>해당 없음</td>
                  <td className={styles['td-highlight']}>6,681,840원 (556,820 x 12개월)</td>
                </tr>
                <tr>
                  <td>연간 경비처리 가능액</td>
                  <td>해당 없음</td>
                  <td className={styles['td-highlight']}>6,681,840원 (100% 비용처리)</td>
                </tr>
                <tr>
                  <td>과세표준</td>
                  <td>100,000,000원</td>
                  <td className={styles['td-highlight']}>93,318,160원 (소득 - 비용)</td>
                </tr>
                <tr>
                  <td>연간 세금</td>
                  <td>19,560,000원</td>
                  <td className={styles['td-highlight']}>17,221,356원</td>
                </tr>
                <tr>
                  <td>연간 절세효과</td>
                  <td>해당 없음</td>
                  <td className={styles['td-highlight']}>2,338,644원</td>
                </tr>
                <tr className={styles['tr-total']}>
                  <td>7년간 절세 총액</td>
                  <td>-</td>
                  <td className={styles['td-highlight']}>16,370,508원</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* YouTube 댓글 섹션 (top: 2348px) */}
        <div className={styles['lump-sum-youtube-section']}>
          <div className={styles['youtube-carousel-group']}>
            <button className={styles['youtube-carousel-btn']} aria-label="이전">‹</button>
            <button className={styles['youtube-carousel-btn']} aria-label="다음">›</button>
          </div>
          <div className={styles['youtube-comment-image']}>
            <img src="/일시불보다 1000/유튜브댓글_pc.png" alt="유튜브 댓글" />
          </div>
          <span className={styles['youtube-section-title']}>Youtube 채널 실제댓글</span>
        </div>
      </div>
    </section>
  );
};

export default LumpSumSection;

