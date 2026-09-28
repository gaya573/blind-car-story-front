const CAR_TYPE_KEYWORDS = {
  SUV: ['suv'],
  세단: ['세단', 'sedan'],
  소형: ['소형', 'compact', '소형차'],
  중형: ['중형', 'midsize', 'mid-size'],
  대형: ['대형', 'full-size', '풀사이즈'],
  전기: ['전기', 'ev', 'electric'],
  하이브리드: ['하이브리드', 'hybrid'],
  승합: ['승합', 'van', 'mpv'],
  쿠페: ['쿠페', 'coupe'],
  해치백: ['해치백', 'hatchback'],
};

const TEXT_FIELDS = ['title', 'subtitle', 'description', 'extraInfo', 'category', 'carType', 'brandName'];

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');

const sanitizeBrand = (value) => {
  const normalized = normalize(value);
  if (!normalized) return '';

  // 1차: 구분자 기준으로 앞부분만 사용 (예: "현대|기아" → "현대")
  let token = normalized.split(/[|·,/]/)[0].trim();

  // 2차: 브랜드명 뒤에 붙는 "자동차", "모터스" 등 접미어 제거
  // 예: "현대자동차" → "현대", "기아자동차" → "기아"
  if (token.endsWith('자동차')) {
    token = token.slice(0, -3).trim();
  }
  if (token.endsWith('모터스')) {
    token = token.slice(0, -3).trim();
  }

  // 3차: 일부 약어/표기 보정
  if (token === '현대자동차') token = '현대';
  if (token === '기아자동차') token = '기아';
  if (token === '르노코리아자동차') token = '르노코리아';

  return token;
};

export const getBrandName = (item) => {
  const candidates = [
    item.brandName,
    item.brand,
    item.manufacturer,
    item.extraInfo,
    // subtitle은 브랜드가 아니라 차량 부제목이므로 제외
  ];
  for (const candidate of candidates) {
    const brand = sanitizeBrand(candidate);
    if (brand) {
      return brand;
    }
  }
  return '';
};

export const collectManufacturers = (items) => {
  const names = new Set();
  items.forEach((item) => {
    const brand = getBrandName(item);
    if (brand) {
      names.add(brand);
    }
  });
  return [
    { id: 'all', name: '전체' },
    ...Array.from(names)
      .sort()
      .map((name, index) => ({ id: `brand-${index}`, name })),
  ];
};

const buildText = (item) => {
  return TEXT_FIELDS.map((field) => normalize(item?.[field])).join(' ').toLowerCase();
};

export const collectCarTypes = (items) => {
  const set = new Set();
  items.forEach((item) => {
    const text = buildText(item);
    Object.entries(CAR_TYPE_KEYWORDS).forEach(([label, keywords]) => {
      if (keywords.some((keyword) => text.includes(keyword))) {
        set.add(label);
      }
    });
  });
  return ['전체', ...Array.from(set)];
};

export const matchesManufacturer = (item, selected) => {
  if (!selected || selected === '전체') return true;
  if (typeof selected !== 'string') {
    // 예상치 못한 타입(객체 등)이 들어오면 필터를 적용하지 않고 전체로 취급
    return true;
  }
  const brand = getBrandName(item);
  if (!brand) return false;

  const normSelected = selected.trim().toLowerCase();
  const normBrand = brand.trim().toLowerCase();

  // 1차: 완전 일치
  if (normBrand === normSelected) return true;

  // 2차: 포함 관계 허용 (예: "현대자동차" 안에 "현대" 포함)
  if (normBrand.includes(normSelected) || normSelected.includes(normBrand)) {
    return true;
  }

  return false;
};

export const matchesCarType = (item, selected) => {
  if (selected === '전체') return true;
  const keywords = CAR_TYPE_KEYWORDS[selected];
  if (!keywords || keywords.length === 0) return true;
  const text = buildText(item);
  return keywords.some((keyword) => text.includes(keyword));
};

