import React, { useEffect, useMemo, useState } from 'react';
import Breadcrumb from '../Breadcrumb';
import EstimateModal from '../modals/EstimateModal';
import QuickConsultCard from '../QuickConsultCard';
import styles from '../../pages/ExpressDeals/ExpressDealDetail.module.css';

const FALLBACK_IMAGE = '/placeholder/car.svg';

const DEFAULT_COLORS = [
  { id: 'default-color-1', name: '클래식 화이트', code: '#F5F5F5' },
  { id: 'default-color-2', name: '모던 블랙', code: '#1A1A1A' },
  { id: 'default-color-3', name: '루프 실버', code: '#9E9E9E' },
  { id: 'default-color-4', name: '샌드 베이지', code: '#C5BFB6' },
];

const DEFAULT_TRIM_GROUPS = [
  {
    id: 'default-trim-group',
    title: '기본 혜택 라인업',
    items: [
      { id: 'default-trim-1', name: '스탠다드', price: 0 },
      { id: 'default-trim-2', name: '프리미엄', price: 2500000 },
      { id: 'default-trim-3', name: '시그니처', price: 4500000 },
    ],
  },
];

const DEFAULT_OPTIONS = [
  { id: 'default-option-1', name: '프리미엄 패키지', price: 1500000 },
  { id: 'default-option-2', name: '고급 안전 사양', price: 900000 },
  { id: 'default-option-3', name: '커넥티드 서비스', price: 450000 },
];

const DEFAULT_CONTRACT_OPTIONS = {
  methods: ['장기렌탈', '리스'],
  periods: ['48개월', '24개월', '36개월', '72개월'],
  deposits: ['없음', '10%', '20%', '30%', '40%'],
  prepayments: ['30%', '없음', '10%', '20%', '40%'],
  mileage: ['20,000km', '10,000km', '30,000km', '40,000km', '50,000km'],
  carTax: ['포함', '미포함'],
  insurance: ['만 26세(이상)', '만 21세(이상)'],
};

const parsePriceValue = (value) => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const numeric = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isNaN(numeric) ? 0 : numeric;
  }
  return 0;
};

const normalizeOptions = (options = []) =>
  options
    .map((option, index) => ({
      id: option?.id ?? `option-${index}`,
      name: option?.name ?? `옵션 ${index + 1}`,
      price: parsePriceValue(option?.price ?? option?.amount ?? option?.value),
    }))
    .filter((option) => Boolean(option?.name));

const normalizeTrimGroups = (trimGroups = []) => {
  const normalized = trimGroups
    .map((group, groupIndex) => {
      const items = (group?.items ?? []).map((item, itemIndex) => ({
        id: item?.id ?? `${group?.id ?? `trim-group-${groupIndex}`}-item-${itemIndex}`,
        name: item?.name ?? `트림 ${itemIndex + 1}`,
        price: parsePriceValue(item?.price ?? item?.amount ?? item?.value),
      }));

      return {
        id: group?.id ?? `trim-group-${groupIndex}`,
        title: group?.title ?? `트림 그룹 ${groupIndex + 1}`,
        items: items.length > 0 ? items : DEFAULT_TRIM_GROUPS[0].items,
      };
    })
    .filter((group) => Array.isArray(group.items) && group.items.length > 0);

  if (normalized.length === 0) {
    return DEFAULT_TRIM_GROUPS;
  }

  return normalized;
};

const normalizeColors = (colors = []) => {
  const normalized = colors
    .map((color, index) => ({
      id: color?.id ?? `color-${index}`,
      name: color?.name ?? `색상 ${index + 1}`,
      code: color?.code ?? color?.hex ?? '#D9D9D9',
      price: parsePriceValue(color?.price ?? color?.additionalPrice ?? 0),
    }))
    .filter((color) => Boolean(color?.name));

  if (normalized.length === 0) {
    return DEFAULT_COLORS;
  }

  return normalized;
};

const buildOptionState = (options = []) =>
  options.reduce((acc, option) => {
    if (option?.id) {
      acc[option.id] = false;
    }
    return acc;
  }, {});

const defaultHistoryBack = () => {
  if (typeof window !== 'undefined' && window.history) {
    window.history.back();
  }
};

const PromotionDetailTemplate = ({
  breadcrumbItems = [],
  isLoading = false,
  loadingMessage = '정보를 불러오는 중입니다...',
  isError = false,
  errorMessage = '정보를 불러올 수 없습니다.',
  errorBackLabel = '목록으로 돌아가기',
  onErrorBack = defaultHistoryBack,
  data,
  contractOptions = {},
  pricing = {},
  showContractSection = true,
  showOptionsSection = true,
  showDiscountBadge = false,
  enableEstimateModal = true,
  leftExtras = null,
  rightExtras = null,
  fallbackHeroImage = FALLBACK_IMAGE,
}) => {
  const mergedContractOptions = useMemo(
    () => ({
      methods: contractOptions?.methods ?? DEFAULT_CONTRACT_OPTIONS.methods,
      periods: contractOptions?.periods ?? DEFAULT_CONTRACT_OPTIONS.periods,
      deposits: contractOptions?.deposits ?? DEFAULT_CONTRACT_OPTIONS.deposits,
      prepayments: contractOptions?.prepayments ?? DEFAULT_CONTRACT_OPTIONS.prepayments,
      mileage: contractOptions?.mileage ?? DEFAULT_CONTRACT_OPTIONS.mileage,
      carTax: contractOptions?.carTax ?? DEFAULT_CONTRACT_OPTIONS.carTax,
      insurance: contractOptions?.insurance ?? DEFAULT_CONTRACT_OPTIONS.insurance,
    }),
    [contractOptions],
  );

  const normalizedData = useMemo(() => {
    if (!data) {
      return {
        name: '상세 정보',
        brand: '블라인드 카스토리',
        heroImage: fallbackHeroImage,
        description: '',
        colors: DEFAULT_COLORS,
        trimGroups: DEFAULT_TRIM_GROUPS,
        options: DEFAULT_OPTIONS,
      };
    }

    return {
      name: data.name ?? '상세 정보',
      brand: data.brand ?? data.extraInfo ?? '블라인드 카스토리',
      heroImage: data.heroImage ?? data.imageUrl ?? fallbackHeroImage,
      description: data.description ?? '',
      colors: normalizeColors(data.colors),
      trimGroups: normalizeTrimGroups(data.trimGroups),
      options: normalizeOptions(data.options),
    };
  }, [data, fallbackHeroImage]);

  const optionsKey = useMemo(
    () => normalizedData.options.map((option) => option.id).join('|'),
    [normalizedData.options],
  );

  const trimGroupsKey = useMemo(
    () =>
      normalizedData.trimGroups
        .map((group) => `${group.id}:${group.items.map((item) => item.id).join(',')}`)
        .join('|'),
    [normalizedData.trimGroups],
  );

  const colorsKey = useMemo(
    () => normalizedData.colors.map((color) => color.id).join('|'),
    [normalizedData.colors],
  );

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedTrimIndex, setSelectedTrimIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState(() => buildOptionState(normalizedData.options));
  const [expandedSections, setExpandedSections] = useState({
    trim: true,
    options: showOptionsSection,
    contract: showContractSection,
  });
  const [expandedTrimGroups, setExpandedTrimGroups] = useState(
    normalizedData.trimGroups.map(() => true),
  );

  const [contractMethod, setContractMethod] = useState(mergedContractOptions.methods[0]);
  const [contractPeriod, setContractPeriod] = useState(mergedContractOptions.periods[0]);
  const [deposit, setDeposit] = useState(mergedContractOptions.deposits[0]);
  const [prepayment, setPrepayment] = useState(mergedContractOptions.prepayments[0]);
  const [mileage, setMileage] = useState(mergedContractOptions.mileage[0]);
  const [carTax, setCarTax] = useState(mergedContractOptions.carTax[0]);
  const [insuranceAge, setInsuranceAge] = useState(mergedContractOptions.insurance[0]);
  const [isEstimateOpen, setIsEstimateOpen] = useState(false);

  useEffect(() => {
    setSelectedColorIndex(0);
  }, [colorsKey]);

  useEffect(() => {
    setSelectedTrimIndex(0);
    setExpandedTrimGroups(normalizedData.trimGroups.map(() => true));
  }, [trimGroupsKey, normalizedData.trimGroups]);

  useEffect(() => {
    setSelectedOptions(buildOptionState(normalizedData.options));
  }, [optionsKey, normalizedData.options]);

  useEffect(() => {
    setExpandedSections({
      trim: true,
      options: showOptionsSection,
      contract: showContractSection,
    });
  }, [showContractSection, showOptionsSection]);

  useEffect(() => {
    setContractMethod(mergedContractOptions.methods[0] ?? '');
    setContractPeriod(mergedContractOptions.periods[0] ?? '');
    setDeposit(mergedContractOptions.deposits[0] ?? '');
    setPrepayment(mergedContractOptions.prepayments[0] ?? '');
    setMileage(mergedContractOptions.mileage[0] ?? '');
    setCarTax(mergedContractOptions.carTax[0] ?? '');
    setInsuranceAge(mergedContractOptions.insurance[0] ?? '');
  }, [mergedContractOptions]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleTrimGroup = (index) => {
    setExpandedTrimGroups((prev) =>
      prev.map((isExpanded, idx) => (idx === index ? !isExpanded : isExpanded)),
    );
  };

  const handleOptionToggle = (optionId) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: !prev[optionId],
    }));
  };

  const colors = normalizedData.colors;
  const trimGroups = normalizedData.trimGroups;
  const options = normalizedData.options;

  const allTrims = useMemo(
    () => trimGroups.flatMap((group) => group.items ?? []),
    [trimGroups],
  );

  const currentTrim = allTrims[selectedTrimIndex] ?? allTrims[0] ?? { name: '기본형', price: 0 };

  const selectedColor = colors[selectedColorIndex] ?? { name: '기본색상', price: 0 };

  const selectedOptionList = useMemo(
    () => options.filter((option) => selectedOptions[option.id]),
    [options, selectedOptions],
  );

  const optionsTotal = useMemo(
    () => selectedOptionList.reduce((sum, option) => sum + parsePriceValue(option.price), 0),
    [selectedOptionList],
  );

  const basePrice = parsePriceValue(currentTrim?.price ?? 0);
  const totalPrice = basePrice + parsePriceValue(selectedColor?.price ?? 0) + optionsTotal;

  const discountAmount =
    pricing?.calculateDiscount?.({
      currentTrim,
      selectedOptions: selectedOptionList,
      color: selectedColor,
      totalPrice,
    }) ?? 0;

  const finalTotal =
    pricing?.calculateFinalTotal?.({
      basePrice,
      color: selectedColor,
      optionsTotal,
      discountAmount,
      selectedOptions: selectedOptionList,
      currentTrim,
    }) ?? Math.max(totalPrice - discountAmount, 0);

  const loadingState = (
    <div className={styles['car-detail-page']}>
      <div className={styles['car-detail-container']}>
        <Breadcrumb items={breadcrumbItems} />
        <div className={styles['loading-state']}>{loadingMessage}</div>
      </div>
    </div>
  );

  const errorState = (
    <div className={styles['car-detail-page']}>
      <div className={styles['car-detail-container']}>
        <Breadcrumb items={breadcrumbItems} />
        <div className={styles['error-state']}>
          {errorMessage}
          <button type="button" onClick={onErrorBack}>
            {errorBackLabel}
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return loadingState;
  }

  if (isError) {
    return errorState;
  }

  return (
    <div className={styles['car-detail-page']}>
      <div className={styles['car-detail-container']}>
        <Breadcrumb items={breadcrumbItems} />

        <div className={styles['car-detail-layout']}>
          <div className={styles['car-detail-left']}>
            <div className={styles['car-hero-section']}>
              <img
                src={normalizedData.heroImage}
                alt={normalizedData.name}
                className={styles['car-hero-image']}
                onError={(event) => {
                  event.currentTarget.src = FALLBACK_IMAGE;
                }}
              />

              <div className={styles['car-info-badge']}>
                <div>
                  <div className={styles['brand-logo-square']}></div>
                  <h1 className={styles['car-hero-title']}>{normalizedData.name}</h1>
                  <p className={styles['car-hero-subtitle']}>{normalizedData.brand}</p>
                </div>
                <div className={styles['color-info-section']}>
                  <div className={styles['color-header']}>
                    <span className={styles['color-label-text']}>외장색상 선택</span>
                    <span className={styles['selected-color-text']}>{selectedColor?.name}</span>
                  </div>
                  <div className={styles['color-palette']}>
                    {colors.map((color, index) => (
                      <button
                        key={color.id ?? index}
                        className={`${styles['color-swatch']} ${
                          selectedColorIndex === index ? styles['selected'] : ''
                        }`}
                        style={{ backgroundColor: color.code }}
                        onClick={() => setSelectedColorIndex(index)}
                        type="button"
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles['option-card']}>
              <div
                className={styles['option-card-header']}
                onClick={() => toggleSection('trim')}
                role="button"
                tabIndex={0}
                onKeyUp={() => toggleSection('trim')}
              >
                <h3 className={styles['option-card-title']}>세부모델 선택</h3>
                <button type="button" className={styles['toggle-btn']}>
                  {expandedSections.trim ? '−' : '+'}
                </button>
              </div>
              {expandedSections.trim && (
                <div className={styles['option-card-content']}>
                  <div className={styles['trim-selector']}>
                    {trimGroups.map((group, groupIndex) => (
                      <div key={group.id ?? groupIndex} className={styles['trim-group']}>
                        <div
                          className={styles['trim-group-header']}
                          onClick={() => toggleTrimGroup(groupIndex)}
                          role="button"
                          tabIndex={0}
                          onKeyUp={() => toggleTrimGroup(groupIndex)}
                        >
                          <span className={styles['trim-group-title']}>{group.title}</span>
                          <button type="button" className={styles['group-toggle']}>
                            {expandedTrimGroups[groupIndex] ? '−' : '+'}
                          </button>
                        </div>
                        {expandedTrimGroups[groupIndex] && (
                          <div className={styles['trim-list']}>
                            {group.items.map((item, itemIndex) => {
                              const baseIndex = trimGroups
                                .slice(0, groupIndex)
                                .reduce((sum, g) => sum + g.items.length, 0);
                              const globalIndex = baseIndex + itemIndex;
                              const isActive = selectedTrimIndex === globalIndex;
                              return (
                                <div
                                  key={item.id ?? globalIndex}
                                  className={`${styles['trim-option']} ${
                                    isActive ? styles['active'] : ''
                                  }`}
                                  onClick={() => setSelectedTrimIndex(globalIndex)}
                                  onKeyUp={() => setSelectedTrimIndex(globalIndex)}
                                  role="button"
                                  tabIndex={0}
                                >
                                  <div className={styles['trim-radio']}>
                                    {isActive && <span className={styles['trim-check']}>✓</span>}
                                  </div>
                                  <div className={styles['trim-name']}>{item.name}</div>
                                  <div className={styles['trim-price']}>
                                    {parsePriceValue(item.price).toLocaleString()}원
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {showOptionsSection && options.length > 0 && (
              <div className={styles['option-card']}>
                <div
                  className={styles['option-card-header']}
                  onClick={() => toggleSection('options')}
                  role="button"
                  tabIndex={0}
                  onKeyUp={() => toggleSection('options')}
                >
                  <h3 className={styles['option-card-title']}>옵션 선택</h3>
                  <button type="button" className={styles['toggle-btn']}>
                    {expandedSections.options ? '−' : '+'}
                  </button>
                </div>
                {expandedSections.options && (
                  <div className={styles['option-card-content']}>
                    <div className={styles['additional-options']}>
                      {options.map((option) => (
                        <div
                          key={option.id}
                          className={`${styles['additional-option']} ${
                            selectedOptions[option.id] ? styles['active'] : ''
                          }`}
                          onClick={() => handleOptionToggle(option.id)}
                          onKeyUp={() => handleOptionToggle(option.id)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className={styles['option-checkbox']}>
                            {selectedOptions[option.id] && <span>✓</span>}
                          </div>
                          <div className={styles['option-details']}>
                            <span className={styles['option-name']}>{option.name}</span>
                            <span className={styles['option-price']}>
                              +{parsePriceValue(option.price).toLocaleString()}원
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {leftExtras}

            {showContractSection && (
              <div className={`${styles['option-card']} ${styles['contract-conditions']}`}>
                <div
                  className={styles['option-card-header']}
                  onClick={() => toggleSection('contract')}
                  role="button"
                  tabIndex={0}
                  onKeyUp={() => toggleSection('contract')}
                >
                  <h3 className={styles['option-card-title']}>계약 조건 선택</h3>
                  <button type="button" className={styles['toggle-btn']}>
                    {expandedSections.contract ? '−' : '+'}
                  </button>
                </div>

                {expandedSections.contract && (
                  <div className={styles['option-card-content']}>
                    <div className={styles['contract-row']}>
                      <label className={styles['contract-label']}>이용방법</label>
                      <div className={styles['contract-options']}>
                        {mergedContractOptions.methods.map((method) => (
                          <button
                            key={method}
                            type="button"
                            className={`${styles['contract-btn']} ${
                              contractMethod === method ? styles['active'] : ''
                            }`}
                            onClick={() => setContractMethod(method)}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles['contract-row']}>
                      <label className={styles['contract-label']}>이용기간</label>
                      <div className={styles['contract-options-grid']}>
                        {mergedContractOptions.periods.map((period) => (
                          <button
                            key={period}
                            type="button"
                            className={`${styles['contract-btn']} ${
                              contractPeriod === period ? styles['active'] : ''
                            }`}
                            onClick={() => setContractPeriod(period)}
                          >
                            {period}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles['contract-row']}>
                      <label className={styles['contract-label']}>보증금</label>
                      <div className={styles['contract-options-grid']}>
                        {mergedContractOptions.deposits.map((value) => (
                          <button
                            key={value}
                            type="button"
                            className={`${styles['contract-btn']} ${
                              deposit === value ? styles['active'] : ''
                            }`}
                            onClick={() => setDeposit(value)}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles['contract-row']}>
                      <label className={styles['contract-label']}>선납금</label>
                      <div className={styles['contract-options-grid']}>
                        {mergedContractOptions.prepayments.map((value) => (
                          <button
                            key={value}
                            type="button"
                            className={`${styles['contract-btn']} ${
                              prepayment === value ? styles['active'] : ''
                            }`}
                            onClick={() => setPrepayment(value)}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles['contract-row']}>
                      <label className={styles['contract-label']}>연간 약정운행거리</label>
                      <div className={styles['contract-options-grid']}>
                        {mergedContractOptions.mileage.map((value) => (
                          <button
                            key={value}
                            type="button"
                            className={`${styles['contract-btn']} ${
                              mileage === value ? styles['active'] : ''
                            }`}
                            onClick={() => setMileage(value)}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles['contract-row']}>
                      <label className={styles['contract-label']}>자동차세</label>
                      <div className={styles['contract-options']}>
                        {mergedContractOptions.carTax.map((value) => (
                          <button
                            key={value}
                            type="button"
                            className={`${styles['contract-btn']} ${
                              carTax === value ? styles['active'] : ''
                            }`}
                            onClick={() => setCarTax(value)}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles['contract-row']}>
                      <label className={styles['contract-label']}>보험 면제</label>
                      <div className={styles['contract-options']}>
                        {mergedContractOptions.insurance.map((value) => (
                          <button
                            key={value}
                            type="button"
                            className={`${styles['contract-btn']} ${
                              insuranceAge === value ? styles['active'] : ''
                            }`}
                            onClick={() => setInsuranceAge(value)}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles['car-detail-right']}>
            <QuickConsultCard
              carName={normalizedData.name}
              trimName={currentTrim?.name}
              trimPrice={currentTrim?.price}
              selectedColor={selectedColor?.name}
              selectedColorPrice={selectedColor?.price}
              selectedOptions={selectedOptionList}
              discountAmount={discountAmount}
              showDiscount={showDiscountBadge && discountAmount > 0}
              onEstimateClick={() => {
                setIsEstimateOpen(true);
                pricing?.onEstimateClick?.({
                  currentTrim,
                  selectedOptions: selectedOptionList,
                  color: selectedColor,
                  contract: {
                    method: contractMethod,
                    period: contractPeriod,
                    deposit,
                    prepayment,
                    mileage,
                    carTax,
                    insuranceAge,
                  },
                  totalPrice,
                  discountAmount,
                  finalTotal,
                });
              }}
            />

            {rightExtras}
          </div>
        </div>
      </div>

      {enableEstimateModal && (
        <EstimateModal
          open={isEstimateOpen}
          onClose={() => setIsEstimateOpen(false)}
          carName={normalizedData.name}
          trimName={currentTrim?.name}
        />
      )}
    </div>
  );
};

export default PromotionDetailTemplate;





