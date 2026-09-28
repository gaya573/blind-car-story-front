// 모바일 차량 상세(/m/car-detail)에서 사용하는 계약 조건 관련 공통 모듈
// - 다른 페이지(예: /m/advance/detail)에서도 동일한 계약 조건 로직을 재사용할 수 있도록 분리

// "10%", "없음" 등에서 숫자 퍼센트만 추출
export const parsePercent = (value) => {
  if (!value || value === '없음') return 0;
  const match = String(value).match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};

// 계약 옵션 상수 (PC 웹 CarDetail와 동일하게 유지)
export const CONTRACT_PERIOD_OPTIONS = ['24개월', '36개월', '48개월', '60개월'];
export const DEPOSIT_OPTIONS = ['없음', '10%', '20%', '30%', '40%'];
export const PREPAYMENT_OPTIONS = ['없음', '10%', '20%', '30%', '40%'];
export const MILEAGE_OPTIONS = ['10,000km', '20,000km', '30,000km', '40,000km', '50,000km'];

// 이용방법별 기본 계약 조건 (PC 웹과 정책을 맞춰야 할 경우 여기만 수정)
export const getDefaultContractConfigForMethod = (method) => {
  switch (method) {
    case '리스':
      return {
        contractPeriod: '48개월',
        deposit: '없음',
        prepayment: '30%',
        mileage: '20,000km',
        carTax: '포함',
        insuranceAge: '만 26세이상',
      };
    case '신차구입(할부)':
      return {
        contractPeriod: '48개월',
        deposit: '없음',
        prepayment: '30%',
        mileage: '20,000km',
        carTax: '포함',
        insuranceAge: '만 26세이상',
      };
    case '장기렌탈':
    default:
      return {
        contractPeriod: '48개월',
        deposit: '없음',
        prepayment: '30%',
        mileage: '20,000km',
        carTax: '포함',
        insuranceAge: '만 26세이상',
      };
  }
};

// 계약 조건 팝업에 들어갈 그룹(이용방법/계약기간/보증금/선납금/연간 주행거리/자동차세/보험연령) 구성
// - MobleCarDetail.jsx 의 계약조건 팝업에서 사용
export const buildContractGroups = (config, saved = {}) => {
  const {
    availableMethods = ['장기렌탈', '리스'],
    contractMethod = '장기렌탈',
    contractPeriod = '48개월',
    deposit = '없음',
    prepayment = '30%',
    mileage = '20,000km',
    carTax = '포함',
    insuranceAge = '만 26세이상',
    brandOrigin = null,
  } = config || {};

  const isFinanceMode = brandOrigin === '수입차' && contractMethod === '신차구입(할부)';

  const groups = [
    {
      title: '이용방법',
      options: availableMethods.map((method) => ({
        name: method === '장기렌탈' ? '장기렌트' : method,
        value: method,
      })),
    },
    {
      title: isFinanceMode ? '할부기간' : '계약기간',
      options: CONTRACT_PERIOD_OPTIONS.map((label) => ({
        // 수입차인 경우에는 이용방법과 무관하게 24개월을 "일시불"로 표시
        name: brandOrigin === '수입차' && label === '24개월' ? '일시불' : label,
        value: label,
      })),
    },
  ];

  // 렌트/리스 공통 필드
  if (!isFinanceMode) {
    // 모바일 팝업: 선납금 → 보증금 → 연간 약정운행거리 순서
    groups.push(
      {
        title: '선납금',
        options: [...PREPAYMENT_OPTIONS.map((label) => ({ name: label, value: label }))],
      },
      {
        title: '보증금',
        options: [...DEPOSIT_OPTIONS.map((label) => ({ name: label, value: label }))],
      },
      {
        title: '연간 약정운행거리',
        options: [...MILEAGE_OPTIONS.map((label) => ({ name: label, value: label }))],
      },
    );
  } else {
    // 신차구입(할부) 등 금융 상품에서는 선납금만 공통 노출
  groups.push({
    title: '선납금',
    options: [...PREPAYMENT_OPTIONS.map((label) => ({ name: label, value: label }))],
  });
  }

  // 리스일 때만 자동차세 노출
  if (!isFinanceMode && contractMethod === '리스') {
    groups.push({
      title: '자동차세',
      options: [
        { name: '포함', value: '포함' },
        { name: '미포함', value: '미포함' },
      ],
    });
  }

  // 장기렌탈(국산/수입) 공통으로 보험 연령 노출
  if (!isFinanceMode && contractMethod === '장기렌탈') {
    groups.push({
      title: '보험 구분',
      options: [
        { name: '만 26세이상', value: '만 26세이상' },
        { name: '만 21세이상', value: '만 21세이상' },
      ],
    });
  }

  // saved(이전에 선택한 값)가 있으면 선택 상태 반영
  return groups.map((group) => {
    const savedEntry = saved[group.title];
    const savedValue = savedEntry?.value ?? savedEntry?.name;
    const items = group.options || [];

    return {
      ...group,
      multiple: false,
      options: items.map((item) => {
        const optionValue = item.value ?? item.name;
        return {
          ...item,
          selected: Boolean(savedValue) && savedValue === optionValue,
          groupTitle: group.title,
        };
      }),
    };
  });
};


