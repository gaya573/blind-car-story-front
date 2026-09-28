// Home 페이지 전용 데이터 가공 유틸 모음


export function buildSpecialOffers(rawHotDeals) {
  const source = rawHotDeals ?? [];
  if (!Array.isArray(source) || source.length === 0) return [];

  const now = new Date();

  return source.map((item) => {
    const deadline = item.deadline
      ? new Date(item.deadline)
      : item.endDate
        ? new Date(item.endDate)
        : null;

    let remainingDays = null;
    if (deadline instanceof Date && !Number.isNaN(deadline.getTime())) {
      const diffMs = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      remainingDays = diffDays;
    }

    // trim 객체 생성 (PromotionCard가 기대하는 형식)
    const trim = item.trim || {
      lowestPrepayment30MonthlyFee: item.lowestPrepayment30MonthlyFee ?? item.lowest_prepayment_30_monthly_fee ?? null,
      lowestDeposit30MonthlyFee: item.lowestDeposit30MonthlyFee ?? item.lowest_deposit_30_monthly_fee ?? null,
      lowestNoDepositMonthlyFee: item.lowestNoDepositMonthlyFee ?? item.lowest_no_deposit_monthly_fee ?? null,
    };

    return {
      ...item,
      remainingDays,
      trimId: item.trimId ?? item.trim_id ?? item.trim?.id ?? null,
      trim,
    };
  });
}

export function buildTopCarsList(rawTopCars) {
  const listSource = rawTopCars ?? [];
  if (!Array.isArray(listSource) || listSource.length === 0) return [];

  const normalizeMetaText = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  };

  const tokenizePipeText = (value) =>
    normalizeMetaText(value)
      .split(/[\|｜│]/) // 기본 | + 유니코드 파이프 문자도 처리
      .map((token) => token.trim())
      .filter(Boolean);

  const dedupeTokens = (tokens) => {
    const unique = [];
    tokens.forEach((token) => {
      const normalized = token.replace(/\s+/g, '').toLowerCase();
      if (!normalized) return;
      if (!unique.some((entry) => entry.normalized === normalized)) {
        unique.push({ raw: token, normalized });
      }
    });
    return unique;
  };

  const buildBrandLabel = (rawValue) => {
    const unique = dedupeTokens(tokenizePipeText(rawValue));
    if (!unique.length) return '';
    if (unique.length === 1) return unique[0].raw;
    return unique.map((entry) => entry.raw).join(' | ');
  };

  const buildMetaFields = (subtitleValue, extraInfoValue) => {
    const ordered = dedupeTokens([
      ...tokenizePipeText(subtitleValue),
      ...tokenizePipeText(extraInfoValue),
    ]);

    if (!ordered.length) {
      return { primary: '', secondary: '' };
    }

    if (ordered.length === 1) {
      return { primary: '', secondary: ordered[0].raw };
    }

    return {
      primary: ordered[0].raw,
      secondary: ordered.slice(1).map((entry) => entry.raw).join(' | '),
    };
  };

  return listSource.map((item, index) => {
    const subtitleText = normalizeMetaText(item.subtitle);
    const extraInfoText = normalizeMetaText(item.extraInfo);
    const { primary, secondary } = buildMetaFields(subtitleText, extraInfoText);

    return {
      id: item.id ?? `top-car-${index}`,
      rank: item.rank ?? index + 1,
      name: item.title ?? item.name ?? '미정',
      brand: buildBrandLabel(item.brand ?? item.extraInfo ?? item.subtitle ?? ''),
      year: primary,
      mileage: secondary,
      description: item.description ?? '',
      image: item.imageUrl ?? '',
      trimId: item.trimId ?? item.trim_id ?? null,
      fuel: item.fuel ?? '',
      basePrice: item.originalPrice ?? item.original_price ?? item.basePrice ?? item.price ?? 0,
      discountedPrice: item.discountedPrice ?? item.finalPrice ?? 0,
      discountPercent: item.discountPercent ?? 0,
    };
  });
}

export function buildClosingSoonCards(rawClosingSoon) {
  const closingSoonData = rawClosingSoon ?? [];
  if (!Array.isArray(closingSoonData) || closingSoonData.length === 0) return [];

  return closingSoonData.slice(0, 4).map((item) => {
    const deadline = item.deadline
      ? new Date(item.deadline)
      : item.endDate
        ? new Date(item.endDate)
        : null;

    // trim 객체 생성 (PromotionCard가 기대하는 형식)
    const trim = item.trim || {
      lowestPrepayment30MonthlyFee: item.lowestPrepayment30MonthlyFee ?? item.lowest_prepayment_30_monthly_fee ?? null,
      lowestDeposit30MonthlyFee: item.lowestDeposit30MonthlyFee ?? item.lowest_deposit_30_monthly_fee ?? null,
      lowestNoDepositMonthlyFee: item.lowestNoDepositMonthlyFee ?? item.lowest_no_deposit_monthly_fee ?? null,
    };

    return {
      id: item.id ?? item.trimId,
      name: item.title ?? item.name ?? '미정',
      desc: item.subtitle ?? item.description ?? '',
      img: item.imageUrl ?? '',
      brand: item.extraInfo ?? '',
      trimId: item.trimId ?? item.trim_id ?? item.id,
      deadline,
      trim,
    };
  });
}

export function findShortestDeadline(closingSoonCards) {
  if (!Array.isArray(closingSoonCards) || closingSoonCards.length === 0) return null;

  const deadlines = closingSoonCards
    .map((car) => car.deadline)
    .filter((d) => d !== null && d !== undefined);

  if (deadlines.length === 0) return null;

  return deadlines.reduce((min, current) => (current < min ? current : min), deadlines[0]);
}

export function buildPromoSourceItems(closingSoonCards, limitedSpecialOffers) {
  const left = Array.isArray(closingSoonCards) ? closingSoonCards : [];
  const right = Array.isArray(limitedSpecialOffers) ? limitedSpecialOffers : [];
  return [...left, ...right];
}

export function pickHomeSeoImage({ heroBanners, closingSoonCards, topCarsList }) {
  const firstBanner = heroBanners?.[0];
  if (firstBanner?.imageUrl) return firstBanner.imageUrl;

  const firstClosing = closingSoonCards?.[0];
  if (firstClosing?.img) return firstClosing.img;

  const firstTopCar = topCarsList?.[0];
  if (firstTopCar?.image) return firstTopCar.image;

  return undefined;
}


