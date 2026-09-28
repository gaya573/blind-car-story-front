import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';
import QuickConsultCard from '../../components/QuickConsultCard';
import ConsultSuccessModal from '../../components/ConsultSuccessModal.jsx';
import styles from '../Car/CarDetail.module.css';
import { useCarDetailQuery } from '../../hooks/queries/carQueries';
import { useShareableConsultUrl } from '../../utils/shareableUrl';
import { handleKakaoPopupBlocked } from '../../utils/kakaoPopup';

// 입력값 우선, 없으면 카카오 OAuth로 연락처 확보 (최대 30자)
async function ensurePhone(given = '') {
  const v = (given || '').trim();
  if (v) return v.length > 30 ? v.slice(0, 30) : v;
  try {
    const { loginWithKakao } = await import('../../utils/kakaoAuth');
    const user = await loginWithKakao({ scopes: ['phone_number', 'name'], fetchUserInfo: true });
    const phone = (user?.phone || '').trim();
    return phone.length > 30 ? phone.slice(0, 30) : phone;
  } catch {
    return '';
  }
}

const FALLBACK_IMAGE = '/placeholder/car.svg';

const parsePriceValue = (value) => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const numeric = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isNaN(numeric) ? 0 : numeric;
  }
  return 0;
};

const formatCurrency = (value) => {
  const numeric = parsePriceValue(value);
  return numeric ? `${numeric.toLocaleString()}원` : '가격 정보 없음';
};

const formatOptionPrice = (value) => {
  const numeric = parsePriceValue(value);
  return `+${numeric.toLocaleString()}원`;
};

const normalizeId = (value) => (value ?? value === 0 ? String(value) : null);

const PromotionDetail = () => {
  const { id: promotionId } = useParams();
  const [searchParams] = useSearchParams();
  const queryTrimId = searchParams.get('trimId');
  const resolvedTrimId = queryTrimId ?? null;
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    isError,
  } = useCarDetailQuery(resolvedTrimId);

  const [selectedTrimId, setSelectedTrimId] = useState(resolvedTrimId ? String(resolvedTrimId) : null);
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState({
    trim: true,
    options: true,
    contract: true,
  });
  const [contractMethod, setContractMethod] = useState('장기렌탈');
  const [contractPeriod, setContractPeriod] = useState('48개월');
  const [deposit, setDeposit] = useState('없음');
  const [prepayment, setPrepayment] = useState('30%');
  const [mileage, setMileage] = useState('20,000km');
  const [carTax, setCarTax] = useState('포함');
  const [insuranceAge, setInsuranceAge] = useState('만 21세(이상)');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    if (resolvedTrimId) {
      setSelectedTrimId(String(resolvedTrimId));
    }
  }, [resolvedTrimId]);

  const trimGroups = useMemo(() => {
    if (!data) return [];
    const trims = data.trims ?? [];
    if (!trims.length) {
      return [];
    }
    return [
      {
        key: data.id ?? 'trim-detail',
        modelId: data.id ?? 'trim-detail',
        modelName: data.name ?? '세부모델',
        trims: trims.map((trim) => ({
          id: normalizeId(trim.id),
          name: trim.name,
          basePrice: parsePriceValue(trim.basePrice ?? trim.price ?? 0),
          options: trim.options ?? [],
          colors: trim.colors ?? [],
        })),
      },
    ];
  }, [data]);

  const allTrims = useMemo(
    () => trimGroups.flatMap((group) => group.trims),
    [trimGroups],
  );

  const selectedTrim = useMemo(
    () => allTrims.find((trim) => trim.id === selectedTrimId) ?? null,
    [allTrims, selectedTrimId],
  );

  useEffect(() => {
    if (!selectedTrim && allTrims.length > 0) {
      setSelectedTrimId(allTrims[0].id);
    }
  }, [selectedTrim, allTrims]);

  useEffect(() => {
    setSelectedOptionIds(new Set());
    const firstColorId = selectedTrim?.colors?.length ? normalizeId(selectedTrim.colors[0].id) : null;
    setSelectedColorId(firstColorId);
  }, [selectedTrim?.id, selectedTrim?.colors]);

  const trimOptions = selectedTrim?.options ?? [];
  const trimColors = selectedTrim?.colors ?? (data?.availableColors ?? []);

  const optionItemsForCard = useMemo(
    () =>
      trimOptions.map((option) => ({
        name: option.name,
        price: parsePriceValue(option.discountedPrice ?? option.price ?? option.amount ?? 0),
      })),
    [trimOptions],
  );

  const selectedColor = useMemo(
    () => trimColors.find((color) => normalizeId(color.id) === selectedColorId) ?? null,
    [trimColors, selectedColorId],
  );

  const colorPrice = useMemo(
    () => parsePriceValue(selectedColor?.additionalPrice ?? selectedColor?.price ?? 0),
    [selectedColor],
  );

  const basePriceValue = parsePriceValue(selectedTrim?.basePrice ?? 0);

  const contractPeriodOptions = ['24개월', '36개월', '48개월', '60개월', '72개월'];
  const depositOptions = ['없음', '10%', '20%', '30%', '40%'];
  const prepaymentOptions = ['없음', '10%', '20%', '30%', '40%'];
  const mileageOptions = ['10,000km', '15,000km', '20,000km', '30,000km', '40,000km'];

  const handleNavigateBack = () => {
    navigate(-1);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleOption = (optionId) => {
    const normalized = normalizeId(optionId);
    if (!normalized) return;
    setSelectedOptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(normalized)) {
        next.delete(normalized);
      } else {
        next.add(normalized);
      }
      return next;
    });
  };

  const breadcrumbItems = useMemo(
    () => [
      { label: '홈', link: '/' },
      { label: '차량 상세' },
      { label: data?.name ?? '트림 상세' },
    ],
    [data?.name],
  );

  const hierarchyTitle = useMemo(() => {
    if (!selectedTrim) return '';
    return [data?.name, selectedTrim.name].filter(Boolean).join(' → ');
  }, [data?.name, selectedTrim?.name]);

  const consultModelName = data?.name ?? '';
  const brandName = data?.brandName ?? '';

  const selectedOptionsForSubmit = useMemo(
    () =>
      Array.from(selectedOptionIds)
        .map((optionId) => {
          const option = trimOptions.find((opt) => normalizeId(opt.id) === optionId);
          return option?.name ?? '';
        })
        .filter(Boolean),
    [selectedOptionIds, trimOptions],
  );

  // URL 동기화 (민감정보 제외)
  useShareableConsultUrl(
    () => {
      const terms = [
        contractMethod,
        contractPeriod,
        deposit !== '없음' ? `보증금 ${deposit}` : '',
        prepayment !== '없음' ? `선납금 ${prepayment}` : '',
        mileage,
      ].filter(Boolean);

      return {
        brand: brandName,
        model: consultModelName,
        vehicleLineId: data?.vehicleLineId || '',
        trimId: selectedTrimId || '',
        colorId: selectedColorId || '',
        optionIds: Array.from(selectedOptionIds || []),
        terms,
        consultType: '트림상세',
        source: 'car-trim-detail',
      };
    },
    (preset) => {
      if (preset?.trimId) setSelectedTrimId(preset.trimId);
      if (preset?.colorId) setSelectedColorId(preset.colorId);
      if (preset?.optionIds?.length) setSelectedOptionIds(new Set(preset.optionIds));
      // terms는 필요 시 상태로 매핑
    },
    [
      brandName,
      consultModelName,
      data?.vehicleLineId,
      selectedTrimId,
      selectedColorId,
      selectedOptionIds,
      contractMethod,
      contractPeriod,
      deposit,
      prepayment,
      mileage,
    ]
  );

  if (!resolvedTrimId) {
    return (
      <div className={styles['car-detail-page']}>
        <div className={styles['car-detail-container']}>
          <div className={styles['error-state']}>
            연결된 차량 정보를 찾을 수 없습니다.
            {promotionId && (
              <p style={{ marginTop: '12px' }}>
                프로모션(ID: {promotionId})에 매핑된 차량 트림이 없습니다.
              </p>
            )}
            <button type="button" onClick={() => navigate('/promotion/brands')}>목록으로 돌아가기</button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles['car-detail-page']}>
        <div className={styles['car-detail-container']}>
          <div className={styles['loading-state']}>차량 정보를 불러오는 중입니다...</div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles['car-detail-page']}>
        <div className={styles['car-detail-container']}>
          <div className={styles['error-state']}>
            차량 정보를 불러오지 못했습니다. <button onClick={handleNavigateBack}>이전 페이지로 돌아가기</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['car-detail-page']}>
      <div className={styles['car-detail-container']}>
        <Breadcrumb items={breadcrumbItems} />
        {hierarchyTitle && (
          <div className={styles['hierarchy-banner']}>
            <span className={styles['hierarchy-text']}>{hierarchyTitle}</span>
          </div>
        )}

        <div className={styles['car-detail-layout']}>
          <div className={styles['car-detail-left']}>
            <div className={styles['car-hero-section']}>
              <img src={FALLBACK_IMAGE} alt={data.name} className={styles['car-hero-image']} />
              <div className={styles['car-info-badge']}>
                <div className={styles['brand-summary']}>
                  <div className={styles['brand-logo-square']}>
                    {data?.brandLogoUrl && <img src={data.brandLogoUrl} alt={data?.brandName ?? '브랜드 로고'} />}
                  </div>
                  <div>
                    <h1 className={styles['car-hero-title']}>{data.name}</h1>
                    <span className={styles['car-brand-name']}>{data.brandName}</span>
                  </div>
                </div>
                {trimColors.length > 0 && (
                  <div className={styles['color-info-section']}>
                    <div className={styles['color-header']}>
                      <span className={styles['color-label-text']}>외장색상 선택</span>
                      {selectedColor && <span className={styles['selected-color-text']}>{selectedColor.name}</span>}
                    </div>
                    <div className={styles['color-palette']}>
                      {trimColors.map((color) => {
                        const colorKey = normalizeId(color.id);
                        return (
                          <button
                            type="button"
                            key={colorKey ?? color.name}
                            className={`${styles['color-swatch']} ${selectedColorId === colorKey ? styles['selected'] : ''}`}
                            style={{ backgroundColor: color.colorCode ?? '#ccc' }}
                            onClick={() => setSelectedColorId(colorKey)}
                            title={color.name}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles['option-card']}>
              <div className={styles['option-card-header']} onClick={() => toggleSection('trim')}>
                <h3 className={styles['option-card-title']}>세부모델 선택</h3>
                <span className={styles['toggle-icon']}>{expandedSections.trim ? '−' : '+'}</span>
              </div>
              {expandedSections.trim && (
                <div className={styles['option-card-content']}>
                  <div className={styles['trim-selector']}>
                    {trimGroups.length === 0 ? (
                      <div className={styles['trim-empty']}>등록된 세부모델이 없습니다.</div>
                    ) : (
                      trimGroups.map((group) => (
                        <div key={group.key} className={styles['trim-group']}>
                          <div className={styles['trim-group-items']}>
                            {group.trims.map((trim) => {
                              const isSelected = selectedTrimId === trim.id;
                              return (
                                <button
                                  type="button"
                                  key={trim.id}
                                  className={`${styles['trim-option']} ${isSelected ? styles['active'] : ''}`}
                                  onClick={() => setSelectedTrimId(trim.id)}
                                  aria-pressed={isSelected}
                                >
                                  <div className={styles['trim-radio']}>
                                    {isSelected && <span className={styles['trim-check']}>✓</span>}
                                  </div>
                                  <div className={styles['trim-name']}>{trim.name}</div>
                                  <div className={styles['trim-price']}>{formatCurrency(trim.basePrice)}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {trimOptions.length > 0 && (
              <div className={styles['option-card']}>
                <div className={styles['option-card-header']} onClick={() => toggleSection('options')}>
                  <h3 className={styles['option-card-title']}>추가 옵션 선택</h3>
                  <span className={styles['toggle-icon']}>{expandedSections.options ? '−' : '+'}</span>
                </div>
                {expandedSections.options && (
                  <div className={styles['option-card-content']}>
                    <div className={styles['additional-options']}>
                      {trimOptions.map((option) => {
                        const optionId = normalizeId(option.id);
                        const active = optionId ? selectedOptionIds.has(optionId) : false;
                        const price = option.discountedPrice ?? option.price ?? 0;
                        return (
                          <button
                            type="button"
                            key={optionId ?? option.name}
                            className={`${styles['additional-option']} ${active ? styles['active'] : ''}`}
                            onClick={() => toggleOption(option.id)}
                            aria-pressed={active}
                          >
                            <div className={styles['option-checkbox']}>{active && <span>✓</span>}</div>
                            <div className={styles['option-details']}>
                              <span className={styles['option-name']}>{option.name}</span>
                              <span className={styles['option-price']}>{formatOptionPrice(price)}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={styles['option-card']}>
              <div className={styles['option-card-header']} onClick={() => toggleSection('contract')}>
                <h3 className={styles['option-card-title']}>계약 조건 선택</h3>
                <span className={styles['toggle-icon']}>{expandedSections.contract ? '−' : '+'}</span>
              </div>
              {expandedSections.contract && (
                <div className={styles['option-card-content']}>
                  <div className={styles['contract-row']}>
                    <span className={styles['contract-label']}>이용방법</span>
                    <div className={styles['contract-options']}>
                      <button
                        type="button"
                        className={`${styles['contract-btn']} ${contractMethod === '장기렌탈' ? styles['contract-btn-active'] : ''}`}
                        onClick={() => setContractMethod('장기렌탈')}
                      >
                        장기렌탈
                      </button>
                      <button
                        type="button"
                        className={`${styles['contract-btn']} ${contractMethod === '리스' ? styles['contract-btn-active'] : ''}`}
                        onClick={() => setContractMethod('리스')}
                      >
                        리스
                      </button>
                    </div>
                  </div>

                  <div className={styles['contract-row']}>
                    <span className={styles['contract-label']}>이용기간</span>
                    <div className={styles['contract-options-grid']}>
                      {contractPeriodOptions.map((option) => (
                        <button
                          type="button"
                          key={option}
                          className={`${styles['contract-btn']} ${contractPeriod === option ? styles['contract-btn-active'] : ''}`}
                          onClick={() => setContractPeriod(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles['contract-row']}>
                    <span className={styles['contract-label']}>보증금</span>
                    <div className={styles['contract-options-grid']}>
                      {depositOptions.map((option) => (
                        <button
                          type="button"
                          key={option}
                          className={`${styles['contract-btn']} ${deposit === option ? styles['contract-btn-active'] : ''}`}
                          onClick={() => setDeposit(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles['contract-row']}>
                    <span className={styles['contract-label']}>선납금</span>
                    <div className={styles['contract-options-grid']}>
                      {prepaymentOptions.map((option) => (
                        <button
                          type="button"
                          key={option}
                          className={`${styles['contract-btn']} ${prepayment === option ? styles['contract-btn-active'] : ''}`}
                          onClick={() => setPrepayment(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles['contract-row']}>
                    <span className={styles['contract-label']}>연간 약정운행거리</span>
                    <div className={styles['contract-options-grid']}>
                      {mileageOptions.map((option) => (
                        <button
                          type="button"
                          key={option}
                          className={`${styles['contract-btn']} ${mileage === option ? styles['contract-btn-active'] : ''}`}
                          onClick={() => setMileage(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles['contract-row']}>
                    <span className={styles['contract-label']}>자동차세</span>
                    <div className={styles['contract-options']}>
                      <button
                        type="button"
                        className={`${styles['contract-btn']} ${carTax === '포함' ? styles['contract-btn-active'] : ''}`}
                        onClick={() => setCarTax('포함')}
                      >
                        포함
                      </button>
                      <button
                        type="button"
                        className={`${styles['contract-btn']} ${carTax === '미포함' ? styles['contract-btn-active'] : ''}`}
                        onClick={() => setCarTax('미포함')}
                      >
                        미포함
                      </button>
                    </div>
                  </div>

                  <div className={styles['contract-row']}>
                    <span className={styles['contract-label']}>보험 면제</span>
                    <div className={styles['contract-options']}>
                      <button
                        type="button"
                        className={`${styles['contract-btn']} ${insuranceAge === '만 21세(이상)' ? styles['contract-btn-active'] : ''}`}
                        onClick={() => setInsuranceAge('만 21세(이상)')}
                      >
                        만 21세(이상)
                      </button>
                      <button
                        type="button"
                        className={`${styles['contract-btn']} ${insuranceAge === '만 26세(이상)' ? styles['contract-btn-active'] : ''}`}
                        onClick={() => setInsuranceAge('만 26세(이상)')}
                      >
                        만 26세(이상)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className={styles['car-detail-right']}>
            <QuickConsultCard
              trimName={selectedTrim?.name}
              trimPrice={basePriceValue}
              selectedColor={selectedColor?.name ?? '선택 없음'}
              selectedColorPrice={colorPrice}
              selectedOptions={optionItemsForCard}
              onEstimateClick={async () => {
                try {
                  const { submitConsult } = await import('../../services/consultHelper');

                  const phone = await ensurePhone('');

                  const terms = [];
                  if (contractMethod) terms.push(contractMethod);
                  if (contractPeriod) terms.push(contractPeriod);
                  if (deposit && deposit !== '없음') terms.push(`보증금 ${deposit}`);
                  if (prepayment && prepayment !== '없음') terms.push(`선납금 ${prepayment}`);
                  if (mileage) terms.push(mileage);

                  const options = [];
                  if (selectedColor?.name) {
                    options.push(`색상: ${selectedColor.name}`);
                  }
                  options.push(...selectedOptionsForSubmit);

                  const result = await submitConsult({
                    brand: data?.brandName || '',
                    model: consultModelName || '',
                    trim: selectedTrim?.name || '',
                    color: selectedColor?.name || '',
                    phone,
                    options,
                    terms,
                    consultType: '트림상세',
                    source: 'car-trim-detail',
                    entryLabel: `차량 상세 > ${data?.name || ''}`,
                    extra: {
                      vehicleLineId: data.vehicleLineId ?? null,
                      trimId: selectedTrim?.id ?? null,
                      brandName: data?.brandName ?? '',
                      contractMethod,
                      contractPeriod,
                      deposit,
                      prepayment,
                      mileage,
                      carTax,
                      insuranceAge,
                    },
                  });

                  // API 호출이 성공하면 무조건 성공 모달 표시
                  if (result.success && result.method === 'db') {
                    setIsSuccessModalOpen(true);
                    // 팝업 차단 처리 (모달 표시 이후에 처리)
                    handleKakaoPopupBlocked(result);
                  } else if (!result.success && result.method === 'db') {
                    alert(result.message || '상담 신청에 실패했습니다.');
                  }
                } catch (error) {
                  console.error('[CarTrimDetail] 상담 신청 실패', error);
                }
              }}
            />
          </aside>
        </div>
      </div>
      <ConsultSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </div>
  );
};

export default PromotionDetail;
