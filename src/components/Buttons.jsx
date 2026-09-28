import React from 'react';
import styles from './Buttons.module.css';

/**
 * 견적받기 버튼 (모바일)
 * 크기: 90px × 34px
 */
export const EstimateButtonMobile = ({ children = '실시간 무료견적 받기', onClick, ...props }) => {
  return (
    <button 
      className={styles['estimate-button-mobile']} 
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * 빠른 상담받기 버튼 (모바일)
 * 크기: 146px × 34px
 */
export const QuickConsultButtonMobile = ({ children = '실시간 무료견적 받기', onClick, ...props }) => {
  return (
    <button 
      className={styles['quick-consult-button-mobile']} 
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * 세부모델 드롭다운 (모바일)
 * 크기: 82px × 34px
 */
export const DetailedModelSelectMobile = ({ children, value, onChange, options = [], ...props }) => {
  const opts = Array.isArray(options) ? options : [];
  
  return (
    <select 
      className={styles['detailed-model-select-mobile']} 
      value={value}
      onChange={onChange}
      {...props}
    >
      <option value="">세부모델</option>
      {opts.map((option, index) => (
        <option key={index} value={typeof option === 'object' ? option.value : option}>
          {typeof option === 'object' ? option.label : option}
        </option>
      ))}
      {children}
    </select>
  );
};

/**
 * 제조사 선택 버튼 (모바일)
 * 크기: 76px × 76px
 */
export const ManufacturerSelectButtonMobile = ({ 
  logo, 
  brandName, 
  onClick, 
  isSelected = false,
  ...props 
}) => {
  return (
    <button 
      className={`${styles['manufacturer-select-button-mobile']} ${isSelected ? styles['selected-mobile'] : ''}`}
      onClick={onClick}
      {...props}
    >
      {logo && <div className={styles['logo-mobile']}>{logo}</div>}
      <div className={styles['brand-name-mobile']}>{brandName}</div>
    </button>
  );
};


/* ---------------------- 카드_중소 ---------------------- */
export const CardSmall = ({ children, onClick, ...props }) => {
  return (
    <div className={styles['card-small']} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

/* ---------------------- 버튼_중 ---------------------- */
export const ButtonMedium = ({
  children,
  type = 'primary', // primary | secondary
  onClick,
  ...props
}) => {
  return (
    <button
      className={`${styles['button-medium']} ${styles[`button-medium-${type}`]}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

/* ---------------------- 버튼_중중 ---------------------- */
export const ButtonMediumLarge = ({
  children,
  variant = 'yellow', // yellow | blue | gray
  onClick,
  ...props
}) => {
  return (
    <button
      className={`${styles['button-mediumlarge']} ${styles[`button-mediumlarge-${variant}`]}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

/* ---------------------- 버튼_대 ---------------------- */
export const ButtonLarge = ({
  children,
  state = 'active', // active | disabled | highlight | active-gray
  icon,
  onClick,
  ...props
}) => {
  return (
    <button
      className={`${styles['button-large']} ${styles[`button-large-${state}`]}`}
      onClick={onClick}
      {...props}
    >
      {icon && <span className={styles['button-large-icon']}>{icon}</span>}
      <span className={styles['button-large-text']}>{children}</span>
    </button>
  );
};

export default {
  CardSmall,
  ButtonMedium,
  ButtonMediumLarge,
  ButtonLarge,
  EstimateButtonMobile,
  QuickConsultButtonMobile,
  DetailedModelSelectMobile,
  ManufacturerSelectButtonMobile
};

