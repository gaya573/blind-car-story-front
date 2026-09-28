import React from 'react';
import styles from './ComparisonSection.module.css';

const ComparisonSection = () => {
  return (
    <section className={styles['comparison-section']}>
      <div className={styles['comparison-container']}>
        {/* 상단 펭귄 캐릭터와 말풍선 */}
        <div className={styles['comparison-header']}>
          <div className={styles['penguin-with-question']}>
            <img 
              src="/home/고민중인펭귄.svg" 
              alt="블라인드 카스토리 펭귄" 
              className={styles['comparison-penguin']}
            />
          </div>
          <div className={styles['question-bubble']}>
            <p>"장기렌트, 할부, 오토리스…<br />뭐가 나한테 유리할까 고민되시죠?"</p>
          </div>
        </div>

        {/* 비교표 */}
        <div className={styles['comparison-table-wrapper']}>
          <h2 className={styles['comparison-table-title']}>장기렌트 vs 할부/리스 비교</h2>
          
          <div className={styles['comparison-table']}>
            {/* 헤더 */}
            <div className={styles['comparison-table-header']}>
              <div className={styles['comparison-header-cell']}>항목</div>
              <div className={styles['comparison-header-cell']}>장기렌트</div>
              <div className={styles['comparison-header-cell']}>할부 구매</div>
              <div className={styles['comparison-header-cell']}>오토리스</div>
            </div>

            {/* 초기비용 */}
            <div className={styles['comparison-table-row']}>
              <div className={styles['comparison-cell']}>초기비용</div>
              <div className={`${styles['comparison-cell']} ${styles['highlight-cell']}`}>0~100% 가능</div>
              <div className={styles['comparison-cell']}>차량가의 10~30%</div>
              <div className={styles['comparison-cell']}>10~30%</div>
            </div>

            {/* 보험포함 */}
            <div className={styles['comparison-table-row']}>
              <div className={styles['comparison-cell']}>보험포함</div>
              <div className={`${styles['comparison-cell']} ${styles['highlight-cell']}`}>
                <img src="/home/GREEN_CHECK.svg" alt="체크" className={styles['check-icon']} /> 포함
              </div>
              <div className={styles['comparison-cell']}>별도</div>
              <div className={styles['comparison-cell']}>별도</div>
            </div>

            {/* 등록세 */}
            <div className={styles['comparison-table-row']}>
              <div className={styles['comparison-cell']}>등록세</div>
              <div className={`${styles['comparison-cell']} ${styles['highlight-cell']}`}>
                <img src="/home/GREEN_CHECK.svg" alt="체크" className={styles['check-icon']} /> 없음
              </div>
              <div className={styles['comparison-cell']}>있음</div>
              <div className={styles['comparison-cell']}>있음</div>
            </div>

            {/* 소유권 */}
            <div className={styles['comparison-table-row']}>
              <div className={styles['comparison-cell']}>소유권</div>
              <div className={`${styles['comparison-cell']} ${styles['highlight-cell']}`}>렌트사</div>
              <div className={styles['comparison-cell']}>본인</div>
              <div className={styles['comparison-cell']}>리스사</div>
            </div>

            {/* 계약 종료 시 */}
            <div className={styles['comparison-table-row']}>
              <div className={styles['comparison-cell']}>계약 종료 시</div>
              <div className={`${styles['comparison-cell']} ${styles['highlight-cell']}`}>반납/인수 선택</div>
              <div className={styles['comparison-cell']}>본인 소유</div>
              <div className={styles['comparison-cell']}>반납/인수 선택</div>
            </div>
          </div>
        </div>

        {/* 하단 장점 설명 */}
        <div className={styles['comparison-benefits']}>
          <div className={styles['benefit-column']}>
            <h3 className={styles['benefit-title']}>
              <img src="/home/BLUE_CHECK.svg" alt="체크" className={styles['check-icon-large']} />
              장기렌트 – 사업자 경비처리 최대 100% 가능!
            </h3>
            <ul className={styles['benefit-list']}>
              <li>
                <img src="/home/BLUE_CHECK.svg" alt="체크" className={styles['check-icon-small']} />
                개인 - 일시불대비 총비용 최대 1,000~1,100만원 이상 저렴<br />
                <span className={styles['benefit-note']}>(팰리세이드 하이브리드기준)</span>
              </li>
              <li>
                <img src="/home/BLUE_CHECK.svg" alt="체크" className={styles['check-icon-small']} />
                개인사업자 - 경비처리 1,600만원 이상 추가 절세(7년 장기렌트시)
                <div className={styles['benefit-disclaimer']}>
                  *업종·차량 용도에 따라 경비 인정 범위가 달라질 수 있으므로, 세무사 상담을 통해 절세 가능 여부를 확인하세요.
                </div>
              </li>
            </ul>
          </div>

          <div className={styles['benefit-column']}>
            <h3 className={styles['benefit-title']}>
              <img src="/home/BLUE_CHECK.svg" alt="체크" className={styles['check-icon-large']} />
              할부 구매 – 개인이 수입차를 살 땐 이게 정답!
            </h3>
            <p className={styles['benefit-desc']}>
              국산차는 개인도, 장기렌트가 저렴하지만, 개인이 수입차 구매시 가장 유리.
            </p>
          </div>

          <div className={styles['benefit-column']}>
            <h3 className={styles['benefit-title']}>
              <img src="/home/BLUE_CHECK.svg" alt="체크" className={styles['check-icon-large']} />
              운용리스 – 사업자 수입차 리스 시 최강 혜택!
            </h3>
            <p className={styles['benefit-desc']}>
              법인/개인사업자에게 가장 유리. <strong>경비처리 무려 93% 가능</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
