import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styles from './MobleCarFilter.module.css';

const FUELS = ['가솔린', '디젤(경유)', 'LPG', '하이브리드', '전기·수소'];

export default function MobleCarFilter() {
  const navigate = useNavigate();
  const [carOrigin, setCarOrigin] = useState(new Set()); // 국산차/수입차 선택
  const [fuels, setFuels] = useState(new Set());
  const [searchParams, setSearchParams] = useSearchParams();


  const updateCarOriginInUrl = (originSet) => {
    const params = new URLSearchParams(searchParams);
    if (originSet.size > 0) {
      params.set('carOrigin', Array.from(originSet).join(','));
    } else {
      params.delete('carOrigin');
    }
    setSearchParams(params, { replace: true });
  };

  const toggleSet = (prevSet, value) => {
    const next = new Set(prevSet);
    if (next.has(value)) next.delete(value); else next.add(value);
    return next;
  };

  // URL에서 초기 carOrigin 동기화
  useEffect(() => {
    const originParam = searchParams.get('carOrigin') || '';
    if (originParam) {
      const origins = originParam.split(',').map(o => o.trim()).filter(Boolean);
      setCarOrigin(new Set(origins));
    } else {
      setCarOrigin(new Set());
    }
  }, [searchParams]);

  // 제출 가능 여부: 국산차/수입차 또는 연료 중 하나라도 선택해야 활성화
  const canSubmit = carOrigin.size > 0 || fuels.size > 0;

  return (
    <div className={styles.page}>
      <div className={styles.navBar}>
        <button className={styles.iconBtn} aria-label="back" onClick={() => navigate(-1)}>‹</button>
        <div className={styles.navTitle}>차량검색</div>
        {/* 필터 화면 우측 돋보기도 상세 검색(/m/search/find)로 이동 */}
        <button className={styles.iconBtn} aria-label="search" onClick={() => navigate('/m/search/find')}>⌕</button>
      </div>

      <section className={styles.section}>
        <h3 className={styles.title}>제조사</h3>
        <div className={styles.grid3}>
          <button
            className={`${styles.chip} ${carOrigin.has('domestic') ? styles.on : ''}`}
            onClick={() => {
              const next = toggleSet(carOrigin, 'domestic');
              setCarOrigin(next);
              updateCarOriginInUrl(next);
            }}
          >국산차</button>
          <button
            className={`${styles.chip} ${carOrigin.has('import') ? styles.on : ''}`}
            onClick={() => {
              const next = toggleSet(carOrigin, 'import');
              setCarOrigin(next);
              updateCarOriginInUrl(next);
            }}
          >수입차</button>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.title40}>연료</h3>
        <div className={styles.grid3}>
          <button
            className={`${styles.chip} ${fuels.size === 0 ? styles.on : ''}`}
            onClick={() => setFuels(new Set())}
          >전체</button>
          {FUELS.map((f) => (
            <button key={f} className={`${styles.chip} ${fuels.has(f) ? styles.on : ''}`}
              onClick={() => setFuels(prev => toggleSet(prev, f))}>{f}</button>
          ))}
        </div>
      </section>

      <div className={styles.footer}>
        <button
          className={`${styles.cta} ${canSubmit ? styles.ctaOn : styles.ctaOff}`}
          disabled={!canSubmit}
          onClick={() => {
            const params = new URLSearchParams(searchParams);
            if (carOrigin.size > 0) {
              params.set('carOrigin', Array.from(carOrigin).join(','));
            } else {
              params.delete('carOrigin');
            }
            if (fuels.size) params.set('fuels', Array.from(fuels).join(',')); else params.delete('fuels');
            navigate(`/m/search/results?${params.toString()}`);
          }}
        >
          설정 조건으로 보기
        </button>
      </div>
    </div>
  );
}


