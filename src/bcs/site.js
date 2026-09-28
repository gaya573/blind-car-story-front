/**
 * 블라인드 카스토리 퍼블리싱(design/publishing-step2-1) 공용 상수.
 * 사업자 정보가 확정되면 이 파일만 고치면 PC·모바일 푸터에 함께 반영된다.
 */
export const SITE_NAME = '블라인드 카스토리';
export const SITE_NAME_EN = 'Blind CarStory';
export const SITE_LOGO_URL = '/bcs/images/brand/carstory-logo.svg';

export const CONSULT_PHONE = '1577-8319';
export const CONSULT_PHONE_HREF = 'tel:15778319';

export const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@BlindCarstory';
export const YOUTUBE_PROFILE_URL = '/bcs/images/youtube/channel-profile.jpg';

// 사업자 정보가 아직 전달되지 않았다. 확정되면 값만 바꾼다.
export const BUSINESS_INFO = {
  line: '주소 / 대표 / 사업자등록번호 : 정보 준비중',
  contact: `전화 : ${CONSULT_PHONE} / 이메일 : 정보 준비중`,
  copyright: `(C) ${SITE_NAME_EN} All Rights Reserved.`,
};

export const CONSULT_SUCCESS_MESSAGE = '견적 신청이 접수되었습니다.\n담당 매니저가 순차적으로 연락드립니다.';
export const CONSULT_FAIL_MESSAGE = '상담 신청을 접수하지 못했습니다. 잠시 후 다시 시도하거나 전화로 문의해 주세요.';

export const RENTAL_CONDITION_LABEL = '48개월 / 선납 30% / 2만km 기준';

export const PERIOD_OPTIONS = [
  { value: '36', label: '36개월' },
  { value: '48', label: '48개월' },
  { value: '60', label: '60개월' },
];

// 제휴 파트너사 로고 (퍼블리싱 mock-data.js partners)
export const PARTNERS = [
  { name: '하나캐피탈', logoUrl: '/bcs/images/partners/hana-capital.svg' },
  { name: 'iM캐피탈', logoUrl: '/bcs/images/partners/im-capital.svg' },
  { name: 'JB우리캐피탈', logoUrl: '/bcs/images/partners/jb-woori-capital.svg' },
  { name: 'KB캐피탈', logoUrl: '/bcs/images/partners/kb-capital.svg' },
  { name: 'K Car', logoUrl: '/bcs/images/partners/k-car.svg' },
  { name: '롯데캐피탈', logoUrl: '/bcs/images/partners/lotte-capital.svg' },
  { name: '메리츠캐피탈', logoUrl: '/bcs/images/partners/meritz-capital.svg' },
  { name: 'MG캐피탈', logoUrl: '/bcs/images/partners/mg-capital.svg' },
  { name: 'NH농협캐피탈', logoUrl: '/bcs/images/partners/nh-capital.svg' },
  { name: '오릭스캐피탈', logoUrl: '/bcs/images/partners/orix-capital.svg' },
  { name: '삼성카드', logoUrl: '/bcs/images/partners/samsung-card.svg' },
  { name: '신한카드', logoUrl: '/bcs/images/partners/shinhan-card.svg' },
  { name: '우리금융캐피탈', logoUrl: '/bcs/images/partners/woori-financial-capital.svg' },
  { name: 'BNK캐피탈', logoUrl: '/bcs/images/partners/bnk-capital.svg' },
];
