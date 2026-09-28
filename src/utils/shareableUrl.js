import React from 'react';

// 민감정보(name/phone/email)는 절대 포함 금지

export function buildConsultShareUrl(path, params, { compact = false } = {}) {
  const url = new URL(
    path,
    typeof window !== 'undefined' ? window.location.origin : 'https://example.com'
  );

  const safe = {
    brand: params.brand || '',
    model: params.model || '',
    vehicleLineId: params.vehicleLineId || '',
    trimId: params.trimId || '',
    colorId: params.colorId || '',
    optionIds: Array.isArray(params.optionIds) ? params.optionIds : [],
    terms: Array.isArray(params.terms) ? params.terms : [],
    consultType: params.consultType || '',
    source: params.source || '',
  };

  if (compact) {
    const json = JSON.stringify(safe);
    const utf8 = new TextEncoder().encode(json);
    const base64 = btoa(String.fromCharCode(...utf8))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    url.searchParams.set('cfg', base64);
  } else {
    const kv = {
      brand: safe.brand,
      model: safe.model,
      vehicleLineId: String(safe.vehicleLineId || ''),
      trimId: String(safe.trimId || ''),
      colorId: String(safe.colorId || ''),
      optionIds: safe.optionIds.join(','),
      terms: safe.terms.join(','),
      consultType: safe.consultType,
      source: safe.source,
    };
    Object.entries(kv).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }

  return url.toString();
}

export function parseConsultShareUrl(
  search = typeof window !== 'undefined' ? window.location.search : ''
) {
  const sp = new URLSearchParams(search);
  if (sp.get('cfg')) {
    try {
      const raw = sp.get('cfg').replace(/-/g, '+').replace(/_/g, '/');
      const bin = atob(raw);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      const text = new TextDecoder().decode(bytes);
      return JSON.parse(text);
    } catch (_) {
      // ignore decode errors
    }
  }
  return {
    brand: sp.get('brand') || '',
    model: sp.get('model') || '',
    vehicleLineId: sp.get('vehicleLineId') || '',
    trimId: sp.get('trimId') || '',
    colorId: sp.get('colorId') || '',
    optionIds: (sp.get('optionIds') || '').split(',').filter(Boolean),
    terms: (sp.get('terms') || '').split(',').filter(Boolean),
    consultType: sp.get('consultType') || '',
    source: sp.get('source') || '',
  };
}

// 모든 디테일 페이지에서 동일 패턴으로 쓰기 위한 훅
// - getParams: 페이지의 현재 상태 -> URL 파라미터 객체로 변환
// - setFromPreset: URL 파싱 결과 -> 페이지 상태로 주입
export function useShareableConsultUrl(getParams, setFromPreset, deps = []) {
  React.useEffect(() => {
    const preset = parseConsultShareUrl();
    if (preset) setFromPreset?.(preset);
    // 처음 1회만 복원
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const params = getParams?.();
    if (!params) return;

    let shareUrl = buildConsultShareUrl(window.location.pathname, params);
    if (shareUrl.length > 1800) {
      shareUrl = buildConsultShareUrl(window.location.pathname, params, { compact: true });
    }
    window.history.replaceState(null, '', shareUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}


