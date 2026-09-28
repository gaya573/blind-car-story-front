import React from 'react';
import styles from './MobileFilters.module.css';

/**
 * 태그 필터 (모바일)
 * 크기: 79px × 28px
 */
export const TagFilterMobile = ({ 
  label = '선택 태그', 
  onClose, 
  onClick,
  showCloseAlways = false,
  ...props 
}) => {
  const canClose = typeof onClose === 'function';

  return (
    <button 
      className={styles['tag-filter-mobile']} 
      onClick={onClick}
      type="button"
      {...props}
    >
      <span className={styles['tag-text']}>{label}</span>
      <button 
        type="button"
        className={`${styles['close-icon']} ${showCloseAlways ? styles['close-icon-always'] : ''} ${!canClose ? styles['close-icon-disabled'] : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (canClose) {
            onClose();
          }
        }}
        aria-label="태그 삭제"
        tabIndex={canClose ? 0 : -1}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </button>
  );
};

/**
 * 드롭다운 필터 (모바일)
 * 크기: 80px × 30px
 */
export const DropdownFilterMobile = ({ 
  value, 
  onChange, 
  placeholder = '선택',
  options = [],
  onOpen,
  ...props 
}) => {
  const opts = Array.isArray(options) ? options : [];

  // 표시용 라벨 계산
  const getLabelFromValue = (val) => {
    if (!val) return placeholder;
    const found = opts.find((opt) => (typeof opt === 'object' ? opt.value : opt) === val);
    if (!found) return placeholder;
    return typeof found === 'object' ? found.label : found;
  };

  // onOpen이 전달되면 버튼 형태로 렌더링하여 클릭 시 팝업을 열 수 있게 함
  if (typeof onOpen === 'function') {
    return (
      <div className={styles['dropdown-filter-mobile-container']}>
        <button
          type="button"
          className={styles['dropdown-filter-mobile']}
          onClick={onOpen}
          {...props}
        >
          {getLabelFromValue(value)}
        </button>
      </div>
    );
  }

  // 기본 동작: select 엘리먼트 사용
  return (
    <div className={styles['dropdown-filter-mobile-container']}>
      <select 
        className={styles['dropdown-filter-mobile']} 
        value={value}
        onChange={onChange}
        {...props}
      >
        <option value="">{placeholder}</option>
        {opts.map((option, index) => (
          <option key={index} value={typeof option === 'object' ? option.value : option}>
            {typeof option === 'object' ? option.label : option}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * 판매 카테고리 버튼 (모바일)
 * 크기: 46px × 20px
 */
export const SellingCategoryButtonMobile = ({ 
  label = '신차구매',
  onClick,
  ...props 
}) => {
  return (
    <button 
      className={styles['selling-category-button-mobile']} 
      type="button"
      onClick={onClick}
      {...props}
    >
      {label}
    </button>
  );
};

export default {
  TagFilterMobile,
  DropdownFilterMobile,
  SellingCategoryButtonMobile
};

