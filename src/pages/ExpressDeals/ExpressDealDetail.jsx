import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Breadcrumb from '../../components/Breadcrumb';
import EstimateModal from '../../components/modals/EstimateModal';
import QuickConsultCard from '../../components/QuickConsultCard';
import styles from './ExpressDealDetail.module.css';
import { contentAPI } from '../../services/contentApi';
import { useCarDetailQuery } from '../../hooks/queries/carQueries';

const FALLBACK_IMAGE = '/placeholder/car.svg';

const ExpressDealDetail = () => {
  const { carId } = useParams();
  const navigate = useNavigate();

  const {
    data: inventoryItem,
    isLoading: isLoadingItem,
    isError: isErrorItem,
  } = useQuery({
    queryKey: ['express-deal', 'item', carId],
    queryFn: async () => {
      const allItems = await contentAPI.getUrgentInventory(1000);
      return allItems.find((item) => item.id === Number(carId));
    },
    enabled: Boolean(carId),
  });

  const trimId = inventoryItem?.trimId;
  const { data: carDetail, isLoading: isLoadingDetail } = useCarDetailQuery(trimId);

  useEffect(() => {
    if (trimId && carDetail && !isLoadingDetail) {
      navigate(`/car-detail/trim/${trimId}`, { replace: true });
    }
  }, [trimId, carDetail, isLoadingDetail, navigate]);
  
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedTrimIndex, setSelectedTrimIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({
    sunroof: false,
    adas: false,
    leather: false,
    premium: false
  });
  
  // 계약 조건
  const [contractMethod, setContractMethod] = useState('장기렌탈');
  const [contractPeriod, setContractPeriod] = useState('48개월');
  const [deposit, setDeposit] = useState('없음');
  const [prepayment, setPrepayment] = useState('30%');
  const [mileage, setMileage] = useState('20,000km');
  const [carTax, setCarTax] = useState('포함');
  const [insuranceAge, setInsuranceAge] = useState('만 21세(이상)');
  const [isEstimateOpen, setIsEstimateOpen] = useState(false);
  
  // 디테일 페이지 진입/차량 변경 시 스크롤을 맨 위로 고정
  useEffect(() => {
    if (typeof window !== 'undefined' && window.scrollTo) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      // 일부 환경에서 즉시 반영 안 되는 경우 보완
      setTimeout(() => {
        if (window.scrollTo) window.scrollTo(0, 0);
      }, 0);
    }
  }, [carId]);
  
  // 접기/펼치기 상태 (초기값: 모두 펼쳐짐)
  const [expandedSections, setExpandedSections] = useState({
    trim: true,
    options: true,
    contract: true
  });
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 차량 데이터 (인벤토리 데이터 기반) - hooks는 조건부 return 전에 선언되어야 함
  const carData = useMemo(() => ({
    name: inventoryItem?.title ?? '즉시 출고 차량',
    brand: inventoryItem?.extraInfo ?? '블라인드 카스토리',
    colors: [
      { name: '크리미 화이트 펄', code: '#F5F5F5' },
      { name: '어비스 블랙 펄', code: '#1A1A1A' },
      { name: '문라이트 블루 펄', code: '#111111' },
      { name: '엔진 레드', code: '#D32F2F' },
      { name: '쉬머링 실버', code: '#9E9E9E' },
    ],
    trimGroups: [
      {
        title: '아반떼 2026년형 가솔린 1.6 하이브리드 개별소비세 인하',
        items: [
          { name: '스마트 (A/T)', price: 26180000 },
          { name: '모던 라이트 (A/T)', price: 26440000 },
          { name: '모던 라이트 (A/T)', price: 26440000 },
          { name: '인스퍼레이션 (A/T)', price: 32150000 },
          { name: 'N라인 (A/T)', price: 32840000 },
        ],
      },
      {
        title: '아반떼 2026년형 가솔린 1.6 개별소비세 인하',
        items: [
          { name: '스마트 (A/T)', price: 20340000 },
          { name: '모던 (A/T)', price: 23550000 },
          { name: '인스퍼레이션 (A/T)', price: 27710000 },
          { name: 'N라인 (A/T)', price: 28080000 },
        ],
      },
      {
        title: '아반떼 2026년형 LPG 1.6 (일반판매용) 개별소비세 인하',
        items: [
          { name: '스마트 (A/T)', price: 21720000 },
          { name: '모던 (A/T)', price: 24920000 },
          { name: '인스퍼레이션 (A/T)', price: 28420000 },
        ],
      },
    ],
    options: [
      { id: 'sunroof', name: '선루프 (파노라마)', price: 700000 },
      { id: 'adas', name: '고급 안전 (ADAS)', price: 200000 },
      { id: 'leather', name: '가죽 시트', price: 380000 },
      { id: 'premium', name: '프리미엄 패키지', price: 250000 },
    ],
    features: [
      '스마트키',
      '후방 카메라',
      '전방 충돌 경고',
      '차선 이탈 경고',
      '크루즈 컨트롤',
      '블루투스',
    ]
  }), [inventoryItem]);

  // 그룹 펼침 상태 - hooks는 조건부 return 전에 선언되어야 함
  const [expandedTrimGroups, setExpandedTrimGroups] = useState(
    carData?.trimGroups?.map(() => true) ?? []
  );
  const toggleTrimGroup = (idx) => {
    setExpandedTrimGroups(prev => prev.map((v, i) => (i === idx ? !v : v)));
  };

  // 세부모델(트림) 변경 시 옵션 선택 상태 초기화
  useEffect(() => {
    if (carData?.options) {
      const reset = carData.options.reduce((acc, opt) => {
        acc[opt.id] = false;
        return acc;
      }, {});
      setSelectedOptions(reset);
    }
  }, [selectedTrimIndex, carData]);

  // 조건부 return (모든 hooks는 위에 선언됨)
  if (isLoadingItem || isLoadingDetail) {
    return (
      <div className={styles['car-detail-page']}>
        <div className={styles['car-detail-container']}>
          <div className={styles['loading-state']}>차량 정보를 불러오는 중입니다...</div>
        </div>
      </div>
    );
  }

  if (isErrorItem || !inventoryItem) {
    return (
      <div className={styles['car-detail-page']}>
        <div className={styles['car-detail-container']}>
          <div className={styles['error-state']}>
            차량 정보를 불러오지 못했습니다.
            <button type="button" onClick={() => navigate('/express-deals')}>목록으로 돌아가기</button>
          </div>
        </div>
      </div>
    );
  }

  const allTrims = carData?.trimGroups?.flatMap(g => g.items) ?? [];
  const currentTrim = allTrims[selectedTrimIndex] || allTrims[0];

  const breadcrumbItems = [
    { label: '홈', link: '/' },
    { label: '즉시출고 특가', link: '/express-deals' },
    { label: carData.name }
  ];

  const calculateDiscount = () => {
    // 즉시할인가 계산 (예시: 기본 가격의 10% 할인)
    const basePrice = currentTrim.price;
    return Math.round(basePrice * 0.1); // 10% 할인
  };

  const calculateTotal = () => {
    let total = currentTrim.price;
    Object.keys(selectedOptions).forEach(key => {
      if (selectedOptions[key]) {
        const option = carData.options.find(opt => opt.id === key);
        if (option) total += option.price;
      }
    });
    return total;
  };

  const calculateFinalTotal = () => {
    return calculateTotal() - calculateDiscount();
  };

  const handleOptionToggle = (optionId) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }));
  };

  return (
    <div className={styles['car-detail-page']}>
      <div className={styles['car-detail-container']}>
        <Breadcrumb items={breadcrumbItems} />
        
        <div className={styles['car-detail-layout']}>
          {/* 왼쪽: 차량 이미지 + 옵션들 */}
          <div className={styles['car-detail-left']}>
            {/* 차량 이미지 + 오버레이 정보 */}
            <div className={styles['car-hero-section']}>
              <img 
                src="https://images.unsplash.com/photo-1542362567-b07e54358753?w=1200&h=700&fit=crop" 
                alt={carData.name}
                className={styles['car-hero-image']}
              />
              
              {/* 우측 상단 정보 오버레이 */}
              <div className={styles['car-info-badge']}>
                <div>
                <div className={styles['brand-logo-square']}> </div>
                <h1 className={styles['car-hero-title']}>{carData.name}</h1>
                </div>
                <div className={styles['color-info-section']}>
                  <div className={styles['color-header']}>
                    
                    <span className={styles['color-label-text']}>외장색상 선택</span>
                    <span className={styles['selected-color-text']}>{carData.colors[selectedColor].name}</span>
                  </div>
                  <div className={styles['color-palette']}>
                    {carData.colors.map((color, idx) => (
                      <button
                        key={idx}
                        className={`${styles['color-swatch']} ${selectedColor === idx ? styles['selected'] : ''}`}
                        style={{ backgroundColor: color.code }}
                        onClick={() => setSelectedColor(idx)}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>  
            </div>

            {/* 세부모델 선택 */}
            <div className={styles['option-card']}>
              <div className={styles['option-card-header']} >
                <h3 className={styles['option-card-title']}>세부모델 선택</h3>
                    
              </div>
              {expandedSections.trim && (
                <div className={styles['option-card-content']}>
                  <div className={styles['trim-selector']}>
                    {carData.trimGroups.map((group, gidx) => (
                      <div key={gidx} className={styles['trim-group']}>
                        <div className={styles['trim-group-header']} onClick={() => toggleTrimGroup(gidx)}>
                          <span className={styles['trim-group-title']}>{group.title}</span>
                          <button className={styles['group-toggle']}>{expandedTrimGroups[gidx] ? '−' : '+'}</button>
                        </div>
                        {expandedTrimGroups[gidx] && (
                          <div className={styles['trim-list']}>
                            {group.items.map((item, idx) => {
                              const baseIndex = carData.trimGroups
                                .slice(0, gidx)
                                .reduce((sum, g) => sum + g.items.length, 0);
                              const globalIndex = baseIndex + idx;
                              const active = selectedTrimIndex === globalIndex;
                              return (
                                <div
                                  key={globalIndex}
                                  className={`${styles['trim-option']} ${active ? styles['active'] : ''}`}
                                  tabIndex={0}
                                  onClick={() => setSelectedTrimIndex(globalIndex)}
                                >
                                  <div className={styles['trim-radio']}>{active && <span className={styles['trim-check']}>✓</span>}</div>
                                  <div className={styles['trim-name']}>{item.name}</div>
                                  <div className={styles['trim-price']}>{item.price.toLocaleString()}원</div>
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

            {/* 옵션 선택 */}
            <div className={styles['option-card']}>
              <div className={styles['option-card-header']} onClick={() => toggleSection('options')}>
                <h3 className={styles['option-card-title']}>옵션 선택</h3>
                <button className={styles['toggle-btn']}>
                  {expandedSections.options ? '−' : '+'}
                </button>
              </div>
              {expandedSections.options && (
                <div className={styles['option-card-content']}>
                  <div className={styles['additional-options']}>
                    {carData.options.map((option) => (
                      <div
                        key={option.id}
                        className={`${styles['additional-option']} ${selectedOptions[option.id] ? styles['active'] : ''}`}
                        onClick={() => handleOptionToggle(option.id)}
                      >
                        <div className={styles['option-checkbox']}>
                          {selectedOptions[option.id] && <span>✓</span>}
                        </div>
                        <div className={styles['option-details']}>
                          <span className={styles['option-name']}>{option.name}</span>
                          <span className={styles['option-price']}>+{option.price.toLocaleString()}원</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 계약 조건 선택 */}
            <div className={`${styles['option-card']} ${styles['contract-conditions']}`}>
              <div className={styles['option-card-header']} onClick={() => toggleSection('contract')}>
                <h3 className={styles['option-card-title']}>계약 조건 선택</h3>
                <button className={styles['toggle-btn']}>
                  {expandedSections.contract ? '−' : '+'}
                </button>
              </div>
              
              {expandedSections.contract && (
                <div className={styles['option-card-content']}>
                  {/* 이용방법 */}
                  <div className={styles['contract-row']}>
                <label className={styles['contract-label']}>이용방법</label>
                <div className={styles['contract-options']}>
                  <button 
                    className={`${styles['contract-btn']} ${contractMethod === '장기렌탈' ? styles['active'] : ''}`}
                    onClick={() => setContractMethod('장기렌탈')}
                  >
                    장기렌탈
                  </button>
                  <button 
                    className={`${styles['contract-btn']} ${contractMethod === '리스' ? styles['active'] : ''}`}
                    onClick={() => setContractMethod('리스')}
                  >
                    리스
                  </button>
                </div>
              </div>

              {/* 이용기간 */}
              <div className={styles['contract-row']}>
                <label className={styles['contract-label']}>이용기간</label>
                <div className={styles['contract-options-grid']}>
                  {['24개월', '36개월', '48개월', '72개월'].map((period) => (
                    <button
                      key={period}
                      className={`${styles['contract-btn']} ${contractPeriod === period ? styles['active'] : ''}`}
                      onClick={() => setContractPeriod(period)}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* 보증금 */}
              <div className={styles['contract-row']}>
                <label className={styles['contract-label']}>보증금</label>
                <div className={styles['contract-options-grid']}>
                  {['없음', '10%', '20%', '30%', '40%'].map((dep) => (
                    <button
                      key={dep}
                      className={`${styles['contract-btn']} ${deposit === dep ? styles['active'] : ''}`}
                      onClick={() => setDeposit(dep)}
                    >
                      {dep}
                    </button>
                  ))}
                </div>
              </div>

              {/* 선납금 */}
              <div className={styles['contract-row']}>
                <label className={styles['contract-label']}>선납금</label>
                <div className={styles['contract-options-grid']}>
                  {['없음', '10%', '20%', '30%', '40%'].map((pre) => (
                    <button
                      key={pre}
                      className={`${styles['contract-btn']} ${prepayment === pre ? styles['active'] : ''}`}
                      onClick={() => setPrepayment(pre)}
                    >
                      {pre}
                    </button>
                  ))}
                </div>
              </div>

              {/* 연간 약정운행거리 */}
              <div className={styles['contract-row']}>
                <label className={styles['contract-label']}>연간 약정운행거리</label>
                <div className={styles['contract-options-grid']}>
                  {['10,000km', '20,000km', '30,000km', '40,000km', '50,000km'].map((mile) => (
                    <button
                      key={mile}
                      className={`${styles['contract-btn']} ${mileage === mile ? styles['active'] : ''}`}
                      onClick={() => setMileage(mile)}
                    >
                      {mile}
                    </button>
                  ))}
                </div>
              </div>

              {/* 자동차세 */}
              <div className={styles['contract-row']}>
                <label className={styles['contract-label']}>자동차세</label>
                <div className={styles['contract-options']}>
                  <button 
                    className={`${styles['contract-btn']} ${carTax === '포함' ? styles['active'] : ''}`}
                    onClick={() => setCarTax('포함')}
                  >
                    포함
                  </button>
                  <button 
                    className={`${styles['contract-btn']} ${carTax === '미포함' ? styles['active'] : ''}`}
                    onClick={() => setCarTax('미포함')}
                  >
                    미포함
                  </button>
                </div>
              </div>

              {/* 보험 면제 */}
              <div className={styles['contract-row']}>
                <label className={styles['contract-label']}>보험 면제</label>
                <div className={styles['contract-options']}>
                  <button 
                    className={`${styles['contract-btn']} ${insuranceAge === '만 21세(이상)' ? styles['active'] : ''}`}
                    onClick={() => setInsuranceAge('만 21세(이상)')}
                  >
                    만 21세(이상)
                  </button>
                  <button 
                    className={`${styles['contract-btn']} ${insuranceAge === '만 26세(이상)' ? styles['active'] : ''}`}
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

          {/* 오른쪽: 간편상담 스타일의 견적 카드 */}
          <div className={styles['car-detail-right']}>
            <QuickConsultCard
              carName={carData.name}
              trimName={currentTrim.name}
              trimPrice={currentTrim.price}
              selectedColor={carData.colors[selectedColor].name}
              selectedOptions={carData.options.filter(opt => selectedOptions[opt.id])}
              discountAmount={calculateDiscount()}
              showDiscount={true}
              onEstimateClick={() => setIsEstimateOpen(true)}
            />
          </div>
        </div>
      </div>
      <EstimateModal
        open={isEstimateOpen}
        onClose={() => setIsEstimateOpen(false)}
        carName={carData.name}
        trimName={currentTrim?.name}
      />
    </div>
  );
};

export default ExpressDealDetail;