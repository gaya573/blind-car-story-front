import React from 'react';

/**
 * 차량 이용방법(장기렌트 / 리스 / 신차구입)을
 * 국산차 / 수입차에 따라 나눠서 선택하는 공통 컴포넌트입니다.
 *
 * props:
 * - vehicleType: 'domestic' | 'imported'
 * - value: 현재 선택된 계약 타입 키 (예: 'domesticLongTermRent')
 * - onChange: (nextKey: string) => void
 */

const METHOD_CONFIG = {
  domestic: [
    {
      key: 'domesticLongTermRent',
      title: '국산차 장기렌트',
      methodLabel: '장기렌트',
    },
    {
      key: 'domesticLease',
      title: '국산차 리스',
      methodLabel: '리스',
    },
  ],
  imported: [
    {
      key: 'importLongTermRent',
      title: '수입차 장기렌트',
      methodLabel: '장기렌트',
    },
    {
      key: 'importLease',
      title: '수입차 리스',
      methodLabel: '리스',
    },
    {
      key: 'importNewCarPurchase',
      title: '수입차 신차구입',
      methodLabel: '신차구입',
    },
  ],
};

const cardStyle = {
  background: '#ffffff',
  padding: '24px 24px 20px',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(28, 28, 28, 0.08)',
  marginBottom: '24px',
};

const titleStyle = {
  fontSize: '16px',
  fontWeight: 700,
  marginBottom: '16px',
  color: '#1c1c1c',
};

const buttonBaseStyle = {
  flex: 1,
  padding: '14px 12px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  color: '#1c1c1c',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 4,
  transition: 'all 0.15s ease-out',
  minHeight: 72,
};

const mainLabelStyle = {
  fontSize: '14px',
  fontWeight: 700,
};

const subLabelStyle = {
  fontSize: '12px',
  color: '#767676',
};

export function CarContractMethodSelector({
  vehicleType = 'domestic',
  value,
  onChange,
}) {
  const methods = METHOD_CONFIG[vehicleType] || [];

  return (
    <section style={cardStyle}>
      <h3 style={titleStyle}>이용방법</h3>
      <div style={{ display: 'flex', gap: 12 }}>
        {methods.map((method) => {
          const isActive = value === method.key;
          return (
            <button
              key={method.key}
              type="button"
              onClick={() => onChange && onChange(method.key)}
              style={{
                ...buttonBaseStyle,
                border: isActive ? '2px solid #111111' : buttonBaseStyle.border,
                background: isActive ? '#f6efd8' : buttonBaseStyle.background,
                boxShadow: isActive
                  ? '0 0 0 1px rgba(17, 17, 17, 0.25)'
                  : 'none',
              }}
            >
              <span style={mainLabelStyle}>{method.title}</span>
              <span style={subLabelStyle}>{method.methodLabel}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default CarContractMethodSelector;


