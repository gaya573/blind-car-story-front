import React, { useState } from "react";
import styles from "./OptionSelectorMobile.module.css";

/**
 * OptionSelectorMobile Component
 * @param {string} title - 섹션 제목
 * @param {Array<{ name: string, price?: string, value?: string }>} options - 선택 옵션 리스트
 * @param {boolean} collapsible - 펼침/접힘 가능 여부
 * @param {Function} onSelect - 옵션 선택 시 호출되는 콜백
 * @param {string} selectedValue - 선택된 값(옵션의 name 또는 value)
 * @param {string} className - 외부에서 전달받는 추가 클래스
 */
const OptionSelectorMobile = ({
  title,
  options = [],
  collapsible = false,
  onSelect,
  selectedValue,
  selectedValues,
  multiple = false,
  className = "",
  initialOpen = false,
}) => {
  const [open, setOpen] = useState(initialOpen || !collapsible);

  const toggleOpen = () => {
    if (collapsible) setOpen((prev) => !prev);
  };

  const hasOptions = options && options.length > 0;

  const compareValue = (option) => {
    const value = option.value ?? option.name;

    if (multiple) {
      if (Array.isArray(selectedValues)) {
        return selectedValues.includes(value);
      }
      if (selectedValue !== undefined && selectedValue !== null) {
        return selectedValue === value;
      }
      return Boolean(option.selected);
    }

    if (selectedValue !== undefined && selectedValue !== null) {
    return value === selectedValue;
    }

    if (Array.isArray(selectedValues)) {
      return selectedValues.includes(value);
    }

    return Boolean(option.selected);
  };

  const handleSelect = (option, e) => {
    // 모바일에서 한 번만 탭해도 즉시 선택되도록 단순화
    if (e) {
      e.stopPropagation();
    }
    if (typeof onSelect === "function") {
      onSelect(option);
    }
  };

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div className={styles.header} onClick={toggleOpen}>
        <h3 className={styles.title}>{title}</h3>
        {collapsible && (
          <span className={`${styles.arrow} ${open ? styles.open : ""}`}>
            ▼
          </span>
        )}
      </div>

      {!hasOptions && <></>}

      {hasOptions && open && (
        <ul className={styles.list}>
          {options.map((opt, idx) => {
            const active = compareValue(opt);
            return (
              <li
                key={idx}
                className={`${styles.item} ${active ? styles.active : ""}`}
                onClick={(e) => handleSelect(opt, e)}
              >
                <span className={styles.name}>{opt.name}</span>
                {opt.price && <span className={styles.price}>{opt.price}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default OptionSelectorMobile;
