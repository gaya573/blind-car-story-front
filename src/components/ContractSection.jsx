import React from 'react';

/**
 * PC/모바일 공통 계약 조건 선택 컴포넌트
 * - 스타일(css module)은 props.styles 로 주입
 * - 상태/유효성 검사는 부모에서 처리하고, 이 컴포넌트는 UI만 담당
 */
export default function ContractSection({
  styles,
  brandOrigin,
  availableMethods,
  contractMethod,
  contractPeriod,
  deposit,
  prepayment,
  mileage,
  carTax,
  insuranceAge,
  contractPeriodOptions,
  depositOptions,
  prepaymentOptions,
  mileageOptions,
  onChangeMethod,
  onChangePeriod,
  onChangeDeposit,
  onChangePrepayment,
  onChangeMileage,
  onChangeCarTax,
  onChangeInsuranceAge,
  useCompactMileageLabel = false,
  hideMethodLabel = false,
}) {
  const isFinanceMode = brandOrigin === '수입차' && contractMethod === '신차구입(할부)';
  const periodGridClass =
    styles['contract-options-grid-period'] || styles['contract-options-grid'];

  const mileageButtonClass = (base) => {
    if (!useCompactMileageLabel) return base;
    if (!styles['contract-btn-small']) return base;
    return `${base} ${styles['contract-btn-small']}`;
  };

  const renderMileageLabel = (option) => {
    if (!option) return option;
    const hasKm = typeof option === 'string' && option.toLowerCase().includes('km');
    if (!hasKm || !styles?.['contract-mileage-km']) return option;
    const numberPart = option.replace(/km/gi, '').trim();
    return (
      <span className={styles['contract-mileage-label'] || ''}>
        <span className={styles['contract-mileage-number'] || ''}>{numberPart}</span>
        <span className={styles['contract-mileage-km']}>km</span>
      </span>
    );
  };
    
  return (
    <>
      {/* 이용방법 */}
      <div className={styles['contract-row']}>
        {!hideMethodLabel && (
          <span className={styles['contract-label']}>이용방법</span>
        )}
        <div className={styles['contract-options']}>
          {availableMethods.map((method) => (
            <button
              key={method}
              type="button"
              className={`${styles['contract-btn']} ${
                contractMethod === method ? styles['contract-btn-active'] : ''
              }`}
              onClick={() => onChangeMethod?.(method)}
            >
              {method === '장기렌탈' ? '장기렌트' : method}
            </button>
          ))}
        </div>
      </div>

      {/* 계약기간 / 할부기간 */}
      <div className={styles['contract-row']}>
        <span className={styles['contract-label']}>{isFinanceMode ? '할부기간' : '계약기간'}</span>
        <div className={periodGridClass}>
          {contractPeriodOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`${styles['contract-btn']} ${
                contractPeriod === option ? styles['contract-btn-active'] : ''
              }`}
              onClick={() => onChangePeriod?.(option)}
            >
              {brandOrigin === '수입차' && option === '24개월' ? '일시불' : option}
            </button>
          ))}
        </div>
      </div>

      {/* 렌트/리스 전용: 보증금, 선납금, 연간 약정운행거리, 자동차세/보험 연령 */}
      {!isFinanceMode && (
        <>
          {/* 보증금 */}
          <div className={styles['contract-row']}>
            <span className={styles['contract-label']}>보증금</span>
            <div className={styles['contract-options-grid']}>
              {depositOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles['contract-btn']} ${
                    deposit === option ? styles['contract-btn-active'] : ''
                  }`}
                  onClick={() => onChangeDeposit?.(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 선납금 */}
          <div className={styles['contract-row']}>
            <span className={styles['contract-label']}>선납금</span>
            <div className={styles['contract-options-grid']}>
              {prepaymentOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles['contract-btn']} ${
                    prepayment === option ? styles['contract-btn-active'] : ''
                  }`}
                  onClick={() => onChangePrepayment?.(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 연간 약정운행거리 */}
          <div className={styles['contract-row']}>
            <span
              className={`${styles['contract-label']} ${
                useCompactMileageLabel && styles['contract-label-small']
                  ? styles['contract-label-small']
                  : ''
              }`}
            >
              연간 약정운행거리
            </span>
            <div className={styles['contract-options-grid']}>
              {mileageOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={mileageButtonClass(
                    `${styles['contract-btn']} ${
                      mileage === option ? styles['contract-btn-active'] : ''
                    }`,
                  )}
                  onClick={() => onChangeMileage?.(option)}
                >
              {renderMileageLabel(option)}
                </button>
              ))}
            </div>
          </div>

          {/* 자동차세: 리스에서만 노출 */}
          {contractMethod === '리스' && (
            <div className={styles['contract-row']}>
              <span className={styles['contract-label']}>자동차세</span>
              <div className={styles['contract-options']}>
                <button
                  type="button"
                  className={`${styles['contract-btn']} ${
                    carTax === '포함' ? styles['contract-btn-active'] : ''
                  }`}
                  onClick={() => onChangeCarTax?.('포함')}
                >
                  포함
                </button>
                <button
                  type="button"
                  className={`${styles['contract-btn']} ${
                    carTax === '미포함' ? styles['contract-btn-active'] : ''
                  }`}
                  onClick={() => onChangeCarTax?.('미포함')}
                >
                  미포함
                </button>
              </div>
            </div>
          )}

          {/* 보험 연령: 장기렌트(국산/수입) 공통 */}
          {contractMethod === '장기렌탈' && (
            <div className={styles['contract-row']}>
              <span className={styles['contract-label']}>보험 연령</span>
              <div className={styles['contract-options']}>
                <button
                  type="button"
                  className={`${styles['contract-btn']} ${
                    insuranceAge === '만 26세이상' ? styles['contract-btn-active'] : ''
                  }`}
                  onClick={() => onChangeInsuranceAge?.('만 26세이상')}
                >
                  만 26세이상
                </button>
                <button
                  type="button"
                  className={`${styles['contract-btn']} ${
                    insuranceAge === '만 21세이상' ? styles['contract-btn-active'] : ''
                  }`}
                  onClick={() => onChangeInsuranceAge?.('만 21세이상')}
                >
                  만 21세이상
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 금융상품(신차구입) 공통: 선납금 + 이자율 안내 */}
      {isFinanceMode && (
        <>
          <div className={styles['contract-row']}>
            <span className={styles['contract-label']}>선납금</span>
            <div className={styles['contract-options-grid']}>
              {prepaymentOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles['contract-btn']} ${
                    prepayment === option ? styles['contract-btn-active'] : ''
                  }`}
                  onClick={() => onChangePrepayment?.(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className={styles['contract-row']}>
            <span className={styles['contract-label']}>이자율</span>
            <p className={styles['contract-note']}>
              * 기준 이자율 4.9% 적용 (실제 이자율은 신용등급에 따라 변동 가능)
            </p>
          </div>
        </>
      )}
    </>
  );
}


