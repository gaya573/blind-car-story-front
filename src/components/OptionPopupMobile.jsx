import React, { useEffect, useRef, useState } from "react";
import OptionSelectorMobile from "./OptionSelectorMobile";
import styles from "./OptionPopupMobile.module.css";

const OptionPopupMobile = ({
  size = "large",
  title = "세부모델을 선택해주세요",
  sortOptions = [],
  modelOptions = [],
  dropdownTitle = "가솔린 1.0 벤",
  modelGroupTitle = "가솔린 1.0",
  variantOptions = [],
  variantGroups = [],
  onVariantSelect = () => {},
  onConfirm,
  onConsult,
  onSortSelect,
  selectedSort,
  onClose,
  disableOverlayClose = false,
  shapeOnly = false,
  // 계약 조건 단계형 UX: true 이면 한 그룹 선택 시 다음 그룹으로 자동 스크롤/포커스
  autoFocusSequential = false,
}) => {
  const [phase, setPhase] = useState("enter"); // enter | exit
  const popupRef = useRef(null);
  const groupsRef = useRef([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // 스와이프-다운을 위한 상태
  const startYRef = useRef(0);
  const [dragY, setDragY] = useState(0);
  const draggingRef = useRef(false);
  const longPressTimerRef = useRef(null);
  const isLongPressRef = useRef(false);

  useEffect(() => {
    setPhase("enter");
  }, []);

  const requestClose = () => {
    setPhase("exit");
  };

  const handleAnimationEnd = (e) => {
    if (e.target !== popupRef.current) return;
    if (phase === "exit" && typeof onClose === "function") onClose();
  };

  const handleOverlayClick = () => {
    if (disableOverlayClose) return;
    requestClose();
  };
  const stopPropagation = (e) => e.stopPropagation();

  const onTouchStart = (e) => {
    draggingRef.current = true;
    startYRef.current = e.touches[0].clientY;
    setDragY(0);
    isLongPressRef.current = false;
    
    // 길게 누르기 감지 (300ms)
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
    }, 300);
  };

  const onTouchMove = (e) => {
    if (!draggingRef.current) return;
    
    // 타이머 취소 (움직이면 길게 누르기가 아님)
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    const delta = e.touches[0].clientY - startYRef.current;
    
    // 아래로 드래그만 허용 (위로는 스크롤)
    if (delta > 0) {
      setDragY(Math.max(0, delta));
    }
  };

  const onTouchEnd = () => {
    if (!draggingRef.current) return;
    
    // 타이머 취소
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    draggingRef.current = false;
    const threshold = 80;
    
    // 길게 누르고 아래로 드래그했으면 닫기
    if (isLongPressRef.current && dragY > threshold) {
      requestClose();
    } else {
      setDragY(0);
    }
    
    isLongPressRef.current = false;
  };

  // 마우스 드래그(데스크톱): 핸들에서만 동작
  const mouseDraggingRef = useRef(false);
  const dragYRef = useRef(0);
  useEffect(() => { dragYRef.current = dragY; }, [dragY]);

  const onMouseDown = (e) => {
    mouseDraggingRef.current = true;
    startYRef.current = e.clientY;
    setDragY(0);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!mouseDraggingRef.current) return;
    const delta = e.clientY - startYRef.current;
    setDragY(Math.max(0, delta));
  };
  const onMouseUp = () => {
    if (!mouseDraggingRef.current) return;
    mouseDraggingRef.current = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    const threshold = 80;
    if (dragYRef.current > threshold) {
      requestClose();
    } else {
      setDragY(0);
    }
  };

  const effectiveVariantGroups = (Array.isArray(variantGroups) && variantGroups.length > 0)
    ? variantGroups
    : ((Array.isArray(variantOptions) && variantOptions.length > 0)
        ? [{ title: dropdownTitle, options: variantOptions }]
        : []);

  const scrollToGroup = (index) => {
    if (!autoFocusSequential) return;
    const target = groupsRef.current[index];
    if (target && target.scrollIntoView) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    if (autoFocusSequential && effectiveVariantGroups.length > 0) {
      // 처음 열릴 때는 첫 번째 그룹(이용방법)에 포커스
      setFocusedIndex(0);
      scrollToGroup(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocusSequential, effectiveVariantGroups.length]);

  return (
    <div
      className={`${styles.overlay} ${
        phase === "enter" ? styles.overlayEnter : styles.overlayExit
      }`}
      onClick={handleOverlayClick}
    >
      <div
        ref={popupRef}
        className={`${styles.popup} ${styles[size]} ${
          phase === "enter" ? styles.sheetEnter : styles.sheetExit
        }`}
        onAnimationEnd={handleAnimationEnd}
        onClick={stopPropagation}
        style={{
          transform:
            dragY > 0 && phase !== "exit" ? `translateY(${dragY}px)` : undefined,
        }}
      >
        <div
          className={styles.handle}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        />
        <div
          className={styles.header}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        >
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeBtn} onClick={requestClose}>
            ✕
          </button>
        </div>

        <div
          className={styles.body}
        >
          {!shapeOnly && size === "small" && (
            <div className={styles.sortSection}>
              <ul className={styles.sortList}>
                {sortOptions.map((opt, i) => {
                  const value = opt.value ?? opt.name;
                  const handleClick = () => {
                    if (typeof onSortSelect === "function") {
                      onSortSelect(value, opt);
                    }
                    requestClose();
                  };
                  const isSelected = selectedSort === value;
                  return (
                    <li
                      key={i}
                      className={`${styles.sortItem} ${
                        isSelected ? styles.selectedItem : ""
                      }`}
                      role="button"
                      tabIndex={0}
                      aria-selected={isSelected}
                      onClick={handleClick}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleClick();
                        }
                      }}
                    >
                      {opt.name}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {!shapeOnly && size === "large" && (
            <>
              {effectiveVariantGroups.length > 0 && (
                <div 
                  className={styles.selectGroups}
                >
                  {(() => {
                    const anyGroupHasSelection = effectiveVariantGroups.some(
                      (group) =>
                        Array.isArray(group.options) &&
                        group.options.some((o) => o.selected),
                    );

                    return effectiveVariantGroups.map((group, index) => {
                      const selectedOptions = Array.isArray(group.options)
                        ? group.options.filter((o) => o.selected)
                        : [];
                      const selectedKey = selectedOptions[0]
                        ? (selectedOptions[0].value ?? selectedOptions[0].name)
                        : undefined;
                      const selectedValues = selectedOptions.map(
                        (opt) => opt.value ?? opt.name,
                      );

                      const initialOpen = autoFocusSequential
                        ? true
                        : selectedOptions.length > 0 ||
                          (!anyGroupHasSelection && index === 0);

                      return (
                        <div
                          key={index}
                          ref={(el) => {
                            groupsRef.current[index] = el;
                          }}
                          className={`${styles.selectSection} ${
                            autoFocusSequential && focusedIndex === index
                              ? styles.selectSectionFocused
                              : ''
                          }`}
                        >
                          <OptionSelectorMobile
                            title={group.title}
                            options={group.options || []}
                            collapsible={true}
                            multiple={Boolean(group.multiple)}
                            onSelect={(opt) => {
                              // onVariantSelect 이 false 를 명시적으로 반환하면
                              // (예: 보증금+선납금 40% 초과 등 유효성 실패) 다음 그룹으로 스킵하지 않음
                              const handled = onVariantSelect(group.title, opt, group);
                              if (autoFocusSequential && handled !== false) {
                                const nextIndex = Math.min(
                                  index + 1,
                                  effectiveVariantGroups.length - 1,
                                );
                                setFocusedIndex(nextIndex);
                                scrollToGroup(nextIndex);
                              }
                            }}
                            selectedValue={!group.multiple ? selectedKey : undefined}
                            selectedValues={group.multiple ? selectedValues : undefined}
                            initialOpen={initialOpen}
                          />
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              <ul className={styles.modelList}>
                {modelOptions.map((opt, i) => (
                  <li key={i} className={styles.modelItem}>
                    <span className={styles.modelName}>{opt.name}</span>
                    <span className={styles.modelPrice}>{opt.price}</span>
                  </li>
                ))}
              </ul>

              <div className={styles.bottomButtons}>
                {typeof onConfirm === 'function' && (
                  <button
                    className={`${styles.btn} ${styles.primary}`}
                    onClick={() => {
                      onConfirm();
                    }}
                  >
                    선택하기
                  </button>
                )}
                {typeof onConsult === 'function' && (
                  <button
                    className={`${styles.btn} ${styles.secondary}`}
                    onClick={() => {
                      onConsult();
                    }}
                  >
                    선택없이 바로 상담하기
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className={styles.homeIndicator} />
      </div>
    </div>
  );
};

export default OptionPopupMobile;
