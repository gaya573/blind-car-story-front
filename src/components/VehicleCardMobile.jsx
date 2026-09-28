import React from 'react';
import styles from './VehicleCardMobile.module.css';

const extractNumericValue = (value) => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value !== 'string') return null;
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return null;
  const parsed = Number(digits);
  return Number.isNaN(parsed) ? null : parsed;
};

const formatDiscountAmount = (value) => {
  if (typeof value !== 'number' || value <= 0) return '';
  return `${value.toLocaleString()}원`;
};

const VehicleCardMobile = ({
  badgeText = '',
  discountPercent = 0,
  name = '모닝',
  subtitle = '',
  monthlyLabel = '월 렌트료',
  monthlyOriginal = '',
  monthlyValue = '',
  monthlyUnit = '원',
  priceLabel = '차량가격',
  priceValue = '',
  priceOriginal = '',
  priceDiscountLabel = '',
  priceVariant = 'default',
  showMonthlyRow = true,
  note = '',
  image,
  onClick,
  hideMoreButton = false,
  trim,
}) => {
  const hasDiscount = Boolean(monthlyOriginal);
  const SUBTITLE_MAX_LENGTH = 25;
  const rawSubtitle = subtitle?.trim();
  const subtitleText = rawSubtitle
    ? rawSubtitle.length > SUBTITLE_MAX_LENGTH
      ? `${rawSubtitle.slice(0, SUBTITLE_MAX_LENGTH)}…`
      : rawSubtitle
    : '';
  const handleClick = onClick || undefined;
  const hasMonthlyValue = monthlyValue && monthlyValue !== '가격 문의';
  const unitToRender = hasMonthlyValue ? monthlyUnit : '';
  const isImportedVariant = priceVariant === 'imported';
  const shouldShowMonthlyRow = showMonthlyRow && Boolean(monthlyValue);
  const monthlyOriginalNumeric = shouldShowMonthlyRow
    ? extractNumericValue(monthlyOriginal)
    : null;
  const monthlyValueNumeric =
    shouldShowMonthlyRow && hasMonthlyValue
      ? extractNumericValue(monthlyValue)
      : null;
  const hasMonthlyOriginalNumber =
    typeof monthlyOriginalNumeric === 'number' &&
    !Number.isNaN(monthlyOriginalNumeric) &&
    monthlyOriginalNumeric > 0;
  const hasMonthlyValueNumber =
    typeof monthlyValueNumeric === 'number' &&
    !Number.isNaN(monthlyValueNumeric) &&
    monthlyValueNumeric > 0;
  const shouldShowImportedMonthlyEquation =
    isImportedVariant &&
    hasMonthlyOriginalNumber &&
    hasMonthlyValueNumber &&
    monthlyOriginalNumeric > monthlyValueNumeric;
  const monthlyDiscountAmount = shouldShowImportedMonthlyEquation
    ? monthlyOriginalNumeric - monthlyValueNumeric
    : null;
  const monthlyDiscountText = monthlyDiscountAmount
    ? formatDiscountAmount(monthlyDiscountAmount)
    : '';
  const basePriceNumeric = isImportedVariant ? extractNumericValue(priceOriginal) : null;
  const finalPriceNumeric = isImportedVariant ? extractNumericValue(priceValue) : null;
  const hasBasePrice = typeof basePriceNumeric === 'number' && !Number.isNaN(basePriceNumeric);
  const hasFinalPrice = typeof finalPriceNumeric === 'number' && !Number.isNaN(finalPriceNumeric);
  const derivedDiscountAmount =
    isImportedVariant &&
    hasBasePrice &&
    hasFinalPrice &&
    basePriceNumeric > finalPriceNumeric
      ? basePriceNumeric - finalPriceNumeric
      : null;
  const derivedDiscountPercent =
    derivedDiscountAmount && hasBasePrice && basePriceNumeric > 0
      ? Math.round((derivedDiscountAmount * 100) / basePriceNumeric)
      : null;
  const importedDiscountText = derivedDiscountAmount
    ? formatDiscountAmount(derivedDiscountAmount)
    : priceDiscountLabel;
  const normalizedDiscountPercent =
    isImportedVariant && typeof derivedDiscountPercent === 'number'
      ? derivedDiscountPercent
      : discountPercent;
  const hasPositiveDiscount =
    typeof normalizedDiscountPercent === 'number' && normalizedDiscountPercent > 0;
  const showMetaRow = subtitleText || (hasPositiveDiscount && !badgeText);
  const badgeLabel =
    badgeText || (hasPositiveDiscount ? `${normalizedDiscountPercent}% 할인` : '');
  const showBadge = Boolean(badgeLabel);
  const hasImportDiscountInfo = Boolean(derivedDiscountAmount) || Boolean(priceDiscountLabel);
  const shouldShowImportedBreakdown =
    isImportedVariant &&
    hasBasePrice &&
    hasFinalPrice &&
    Boolean(priceOriginal) &&
    Boolean(priceValue) &&
    hasImportDiscountInfo;
  const showFallbackDiscountNote = isImportedVariant && !hasPositiveDiscount;

  const handleKeyDown = (event) => {
    if (!handleClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event);
    }
  };

  return (
    <div
      className={styles.card}
      role={handleClick ? 'button' : undefined}
      tabIndex={handleClick ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.left}>
        <div>
          <div className={styles.header}>
            <p className={styles.name} title={name}>
              {name}
            </p>
            {showBadge && <span className={styles.badge}>{badgeLabel}</span>}
          </div>
          {showMetaRow && (
            <div className={styles.metaRow}>
            {hasPositiveDiscount && !badgeText && (
                <span className={styles.discountPercent}>
                  {`${normalizedDiscountPercent}% 할인`}
                </span>
              )}
              {subtitleText && <span className={styles.subtitle}>{subtitleText}</span>}
            </div>
          )}
        </div>

        <div className={styles.priceGroup}>
          {shouldShowMonthlyRow && (
          <div className={styles.monthlyRow}>
            <div className={styles.monthlyValues}>
                {shouldShowImportedMonthlyEquation ? (
                  <div className={styles.monthlyEquation}>
                    <div className={styles.monthlyEquationItem}>
                      <span className={styles.monthlyEquationLabel}>기존가격</span>
                      <span className={styles.monthlyEquationValue}>{monthlyOriginal}</span>
                    </div>
                    <span className={styles.monthlyOperator} aria-hidden="true">
                      -
                    </span>
                    <div className={styles.monthlyEquationItem}>
                      <span className={styles.monthlyEquationLabel}>할인가격</span>
                      <span className={styles.monthlyDiscountValue}>{monthlyDiscountText}</span>
                    </div>
                    <span className={styles.monthlyOperator} aria-hidden="true">
                      =
                    </span>
                    <div className={styles.monthlyEquationItem}>
                      <span className={styles.monthlyEquationLabel}>최종가격</span>
                      <span className={styles.monthlyFinalValue}>
                        {monthlyValue}
                        {unitToRender && <span className={styles.monthlyFinalUnit}>{unitToRender}</span>}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
              {hasDiscount && (
                <span className={styles.priceOriginal}>{monthlyOriginal}</span>
              )}
              <div className={styles.monthlyCurrent}>
              <span className={styles.monthlyLabel}>{monthlyLabel}</span>   
              <div>
              <span className={styles.priceValueHighlight}>{monthlyValue} </span>
                        {unitToRender && <span className={styles.priceUnit}>{unitToRender}</span>}
                      </div>
            </div>
                  </>
                )}
              </div>
            </div>
          )}
          <div
            className={`${styles.priceLine} ${
              shouldShowImportedBreakdown || showFallbackDiscountNote ? styles.priceLineImported : ''
            }`}
          >
            {shouldShowImportedBreakdown ? (
              <div className={styles.importedPriceStack}>
                <div className={styles.importedRow}>
                  <span className={styles.importedRowLabel}>기존가격</span>
                  <span className={styles.importedBase}>{priceOriginal}</span>
                </div>
                {importedDiscountText && (
                  <div className={styles.importedRow}>
                    <span className={styles.importedRowLabel}>할인가격</span>
                    <span className={styles.importedDiscount}>
                      {showFallbackDiscountNote ? '상담후 최저가 안내' : importedDiscountText}
                    </span>
                  </div>
                )}

                <div className={styles.importedRow}>
                  <span className={styles.importedRowLabel}>최종가격</span>
                  <span className={styles.importedFinal}>{priceValue}</span>
                </div>
              </div>
            ) : showFallbackDiscountNote ? (
              <div className={`${styles.importedPriceStack} ${styles.priceLineImported}`}>
                 <div className={styles.importedRow}>
                  <span className={styles.importedRowLabel}>할인가격</span>
                  <span className={styles.fallbackDiscountValue}>상담후 최저가 안내</span>
                </div>
                <div className={styles.importedRow}>
                  <span className={styles.importedRowLabel}>{priceLabel}</span>
                  <span className={styles.importedFinal}>{priceValue}</span>
                </div>
               
              </div>
            ) : (
              <>
                <span className={styles.priceLabel}>{priceLabel}</span>
                <span className={styles.priceValue}>{priceValue}</span>
              </>
            )}
          </div>
        </div>

        {note && <p className={styles.note}>{note}</p>}

      
      </div>

      <div className={styles.right}>
        {image && <img src={image} alt={name} loading="lazy" />}

        {!hideMoreButton && (
          <button
            className={styles.more}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClick && handleClick(e);
            }}
          >
            더보기 <span aria-hidden>›</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default VehicleCardMobile;
