import React, { useRef } from 'react';
import desktopStyles from './SearchBar.module.css';
import mobileStyles from './SearchBarMobile.module.css';

/**
 * 공통 핸들러 생성 함수
 * value, onChange, onClear를 기반으로 이벤트 핸들러를 제공합니다.
 */
export function SearchBarCommon({ value, onChange, onClear }) {
  const handleChange = (event) => {
    onChange?.(event);
  };

  const handleClear = () => {
    onChange?.({ target: { value: '' } });
    onClear?.();
  };

  return { value, handleChange, handleClear };
}

/**
 * 데스크톱(웹) 전용 검색창: 사각형, small/long variant 지원
 */
export const SearchBarDesktop = ({
  value,
  onChange,
  placeholder = '검색어를 입력해 주세요',
  className = '',
  variant = 'small',
  onSubmit,
  onClick,
}) => {
  const { handleChange } = SearchBarCommon({ value, onChange });
  const inputRef = useRef(null);

  const containerClass = [
    desktopStyles.container,
    desktopStyles[variant] || '',
    className
  ].filter(Boolean).join(' ');

  const inputClass = [
    desktopStyles.input,
    desktopStyles[`input-${variant}`] || ''
  ].filter(Boolean).join(' ');

  const iconClass = [
    desktopStyles.icon,
    desktopStyles[`icon-${variant}`] || ''
  ].filter(Boolean).join(' ');

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      const currentValue = inputRef.current?.value || value;
      onSubmit?.(currentValue);
    }
  };

  const handleSearchIconClick = (event) => {
    // 돋보기 아이콘 클릭 시에만 검색 실행 (또는 onSubmit이 없으면 onClick으로 위임)
    // input의 현재 값을 직접 읽어서 사용
    event.stopPropagation();
    const currentValue = inputRef.current?.value || value;

    if (onSubmit) {
      onSubmit(currentValue);
    } else if (onClick) {
      onClick(event);
    }
  };

  return (
    <div
      className={containerClass}
      role="search"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >

      {variant === 'long' && (
        <button
          type="button"
          className={iconClass}
          onClick={handleSearchIconClick}
          aria-label="검색"
        >
            <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        </button>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={inputClass}
        style={{ cursor: 'text' }}
      />
      
      {(variant === 'small' || variant === 'mobileRect' || variant === 'compact') && (
        <button
          type="button"
          className={iconClass}
          onClick={handleSearchIconClick}
          aria-label="검색"
        >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
      )}
    </div>
  );
};

/**
 * 모바일 전용 검색창: 둥근 pill 형태, 뒤로가기/클리어 버튼 포함
 */
export const SearchBarMobile = ({
  value,
  onChange,
  placeholder = '검색어를 입력해 주세요',
  className = '',
  showClear = true,
  onClear,
  onBack
}) => {
  const { handleChange, handleClear } = SearchBarCommon({ value, onChange, onClear });

  return (
    <div className={`${mobileStyles['search-bar']} ${mobileStyles['mobile']} ${className}`}>
      <button
        type="button"
        className={mobileStyles['back-btn']}
        aria-label="뒤로가기"
        onClick={onBack}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className={mobileStyles['input-wrap']}>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className={mobileStyles['search-bar-input']}
        />

        {showClear && !!value && (
          <button
            type="button"
            className={mobileStyles['clear-btn']}
            aria-label="입력 지우기"
            onClick={handleClear}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * 기본 SearchBar: rounded 여부에 따라 모바일/데스크톱 컴포넌트 반환
 * 기존 API와의 호환성을 위해 유지
 */
const SearchBar = ({ rounded = false, ...rest }) => {
  if (rounded) {
    return <SearchBarMobile {...rest} />;
  }
  return <SearchBarDesktop {...rest} />;
};

export default SearchBar;

