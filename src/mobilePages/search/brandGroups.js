/**
 * 퍼블리싱 carlist-data.js 의 모바일 브랜드 선택 목록.
 * name 은 검색결과(/m/search/results?brand=)로 넘기는 값이다. 차량 API 브랜드 이름과 표기가 조금 달라도
 * (KG모빌리티 ↔ KGM, 토요타 ↔ 도요타) 검색결과 화면이 isSameBrandName 으로 맞춰 찾는다.
 */
const logo = (file) => `/bcs/images/manufacturers/${file}`;

export const MOBILE_BRAND_GROUPS = [
  {
    origin: 'domestic',
    label: '국산차',
    brands: [
      { name: '현대', logoUrl: logo('hyundai.svg') },
      { name: '기아', logoUrl: logo('kia.svg') },
      { name: '제네시스', logoUrl: logo('genesis.svg') },
      { name: '르노코리아', logoUrl: logo('renault-korea.svg') },
      { name: 'KG모빌리티', logoUrl: logo('kgm.svg') },
      { name: '쉐보레', logoUrl: logo('chevrolet.svg') },
    ],
  },
  {
    origin: 'imported',
    label: '수입차',
    brands: [
      { name: 'BMW', logoUrl: logo('bmw.svg') },
      { name: '벤츠', logoUrl: logo('mercedes-benz.svg') },
      { name: '아우디', logoUrl: logo('audi.svg') },
      { name: '폭스바겐', logoUrl: logo('volkswagen.svg') },
      { name: '테슬라', logoUrl: '' },
      { name: '볼보', logoUrl: logo('volvo.svg') },
      { name: '렉서스', logoUrl: logo('lexus.svg') },
      { name: '토요타', logoUrl: logo('toyota.svg') },
      { name: 'BYD', logoUrl: logo('byd.svg') },
      { name: '포드', logoUrl: logo('ford.svg') },
      { name: '폴스타', logoUrl: logo('polestar.svg') },
    ],
  },
];

export const brandResultsPath = (origin, brandName) => {
  const params = new URLSearchParams();
  if (origin) params.set('carOrigin', origin);
  if (brandName) params.set('brand', brandName);
  return `/m/search/results?${params.toString()}`;
};

