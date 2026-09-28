import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { SaleCardMobileV2 } from '../SaleCardMobile.jsx';

/**
 * CarouselMobile
 * - slides: [{ id, src, alt, content? }]
 * - width: 343(px)
 * - peek: 다음 카드가 보이는 폭(px)
 * - gap: 카드 간 간격(px)
 * - auto: 자동 슬라이드 여부
 * - interval: 자동 슬라이드 간격(ms)
 * - onChange: 인덱스 변경 콜백
 */
export default function CarouselMobile({
  slides = [],
  width,
  peek = 47,
  gap = 12,
  auto = false,
  interval = 3500,
  onChange,
}) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [vw, setVw] = useState(() => (typeof width === 'number' ? width : 343));
  const [cardWidth, setCardWidth] = useState(() => ((typeof width === 'number' ? width : 343) - peek));

  // drag state
  const startX = useRef(0);
  const startY = useRef(0);
  const startTX = useRef(0);
  const tx = useRef(0);
  const lastTX = useRef(0);
  const dragging = useRef(false);
  const ticking = useRef(false);

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  // 무한 스크롤용: 원본(base)을 계속 뒤에 붙여 나간다
  const base = React.useMemo(() => (Array.isArray(slides) ? slides : []), [slides]);
  const idCounter = useRef(0);
  const makeCopy = useCallback((copyIdx) => base.map((s, idx) => ({ ...s, id: `${s.id ?? idx}-c${copyIdx}-${idCounter.current++}` })), [base]);
  const [items, setItems] = useState(() => {
    const init = [];
    const times = Math.max(3, Math.ceil(9 / Math.max(1, base.length))); // 최소 9개 이상으로 시작
    for (let i = 0; i < times; i++) init.push(...makeCopy(i));
    return init;
  });

  const maxTranslate = useCallback(() => {
    const total = items.length * (cardWidth + gap) - gap;
    return Math.min(0, vw - total);
  }, [items.length, cardWidth, gap, vw]);

  const goTo = useCallback((i) => {
    const next = clamp(i, 0, Math.max(0, items.length - 1));
    setIndex(next);
    const x = -(next * (cardWidth + gap));
    tx.current = x;
    if (trackRef.current) trackRef.current.style.transform = `translateX(${x}px)`;
    onChange?.(next);
  }, [items.length, cardWidth, gap, onChange]);

  useLayoutEffect(() => {
    setCardWidth((typeof width === 'number' ? width : vw) - peek);
  }, [width, vw, peek]);

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      const el = entries[0]?.target;
      if (!el) return;
      if (typeof width !== 'number') {
        const w = el.clientWidth || 343;
        setVw(w);
        setCardWidth(w - peek);
      }
      goTo(index);
    });
    if (viewportRef.current) ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, [goTo, index, width, peek]);

  useEffect(() => {
    if (!auto || items.length <= 1) return;
    const t = setInterval(() => goTo((index + 1) % items.length), interval);
    return () => clearInterval(t);
  }, [auto, interval, items.length, index, goTo]);

  const DRAG_THRESHOLD = 6; // px – 클릭/드래그 구분

  const applyTransform = () => {
    if (!trackRef.current) return;
    trackRef.current.style.transform = `translate3d(${lastTX.current}px,0,0)`;
    ticking.current = false;
  };

  const onStart = (pageX, pageY) => {
    dragging.current = false; // 아직 드래그 진입 전
    startX.current = pageX;
    startY.current = pageY;
    startTX.current = tx.current;

    // 문서 전체로 이벤트 캡처(뷰포트 밖으로 나가도 안전)
    window.addEventListener('mouseup', onWindowUp);
    window.addEventListener('mousemove', onWindowMove);
    window.addEventListener('touchend', onWindowUp);
    window.addEventListener('touchmove', onWindowTouchMove, { passive: false });
  };

  const doMove = (pageX) => {
    const delta = pageX - startX.current;
    // 무한 스크롤 슬랙: 좌우로 한 장 분량까지 허용
    const slack = cardWidth + gap;
    const minBound = maxTranslate() - slack;
    const maxBound = 0 + slack;
    const next = clamp(startTX.current + delta, minBound, maxBound);
    tx.current = next;
    lastTX.current = next;
    if (!ticking.current) {
      ticking.current = true;
      requestAnimationFrame(applyTransform);
    }
  };

  const onMove = (pageX, pageY, isTouch = false, e) => {
    if (!trackRef.current) return;
    // 드래그 진입 판정 (수평 우선, 수직이면 넘김)
    if (!dragging.current) {
      const dx = Math.abs(pageX - startX.current);
      const dy = Math.abs(pageY - startY.current);
      if (dy > dx) return; // 수직 스크롤 우선
      if (dx < DRAG_THRESHOLD) return; // 아직 작음
      dragging.current = true;
      if (viewportRef.current) viewportRef.current.style.cursor = 'grabbing';
    }
    // 모바일에서 텍스트 선택/스크롤 방지
    if (isTouch && e) e.preventDefault();
    doMove(pageX);
  };

  const finishDrag = () => {
    if (viewportRef.current) viewportRef.current.style.cursor = 'grab';
    window.removeEventListener('mouseup', onWindowUp);
    window.removeEventListener('mousemove', onWindowMove);
    window.removeEventListener('touchend', onWindowUp);
    window.removeEventListener('touchmove', onWindowTouchMove);
  };

  const onEnd = () => {
    if (!dragging.current) { finishDrag(); return; }
    dragging.current = false;
    const moved = startTX.current - tx.current;
    const threshold = (cardWidth + gap) / 4;
    let target = index;
    if (moved > threshold) target = index + 1; // 다음
    else if (moved < -threshold) target = index - 1; // 이전
    // 끝에 가까워지면 base를 뒤에 추가하여 무한 확장
    const nearEnd = target > items.length - Math.max(3, base.length);
    if (nearEnd && base.length > 0) {
      setItems((prev) => {
        const copyIdx = Math.floor(prev.length / Math.max(1, base.length)) + 1;
        return [...prev, ...makeCopy(copyIdx)];
      });
    }
    // 뒤로 무한 요구는 없으므로 음수 방지
    target = Math.max(0, target);
    goTo(target);
    finishDrag();
  };

  // window 바운딩 이벤트 핸들러
  const onWindowMove = (e) => onMove(e.pageX, e.pageY, false, e);
  const onWindowTouchMove = (e) => onMove(e.touches[0].pageX, e.touches[0].pageY, true, e);
  const onWindowUp = () => onEnd();

  useEffect(() => { goTo(0); }, [cardWidth, gap, vw, goTo]);

  if (items.length === 0) return null;

  return (
    <div
      ref={viewportRef}
      style={{ width:'9999px', margin: '0 auto', overflow: 'hidden', position: 'relative', userSelect: 'none',
         WebkitUserSelect: 'none', msUserSelect: 'none', touchAction: 'pan-y' }}
      onMouseDown={(e) => onStart(e.pageX, e.pageY)}
      onTouchStart={(e) => onStart(e.touches[0].pageX, e.touches[0].pageY)}
      // 이동/해제는 window 이벤트로 처리하여 호버 시 반응하지 않음
    >
      <div
        ref={trackRef}
        style={{ display: 'flex', gap: `${gap}px`, willChange: 'transform', cursor: 'grab' }}
        onDragStart={(e) => e.preventDefault()}
      >
        {items.map((s) => (
          <div
            key={s.id}
            style={{
              width: cardWidth,
              userSelect: 'none',
              flex: '0 0 auto'
            }}
          >
            <SaleCardMobileV2
              rightLabel={s.rightLabel || s.brand}
              logo={s.logo}
              thumbnailImage={s.thumbnailImage || s.image || s.src}
              title={s.title || s.name}
              subtitle={s.subtitle || s.desc}
              buttonText={s.buttonText}
              onClick={s.onClick}
              onConsult={s.onConsult}
              detailPayload={s.detailPayload}
            />
          </div>
        ))}
      </div>
      {/* 도트 제거(무한 스크롤) */}
     
    </div>
  );
}


