import { COALITION_BASE_PATH } from '../config/coalitionConfig';
import { contentHttp } from './contentApi';

/**
 * 제휴사 전용 공개 콘텐츠 API.
 *
 * 원더굿라이프 공용 배너(`/api/content/banners`)와 달리 제휴사별로 분리되어 있어서,
 * 어드민 "제휴사 관리 > 배너관리"에 등록한 것만 이 사이트에 노출된다.
 *
 * 어드민이 제공하는 값 (wonder-admin-front/src/pages/CoalitionBannerManage.jsx)
 *   contentType: BANNER | YOUTUBE
 *   pageType:    MAIN(메인 홈) | DOMESTIC(국산차 목록) | IMPORTED(수입차 목록) | SPECIAL(특가차량)
 *   position:    '' (미지정) | TOP | MIDDLE | BOTTOM
 *   YOUTUBE는 pageType이 MAIN으로 고정된다.
 */

export const COALITION_PAGE_TYPE = {
  MAIN: 'MAIN',
  DOMESTIC: 'DOMESTIC',
  IMPORTED: 'IMPORTED',
  SPECIAL: 'SPECIAL',
};

const byDisplayOrder = (a, b) => (a?.displayOrder ?? 0) - (b?.displayOrder ?? 0);

/**
 * 어드민 업로드 경로에 공백이나 한글이 들어가면(예: `/블라인드 카스토리/`)
 * `background-image: url(...)`에 그대로 넣었을 때 CSS 선언이 통째로 무효가 된다.
 * 서버가 준 주소를 퍼센트 인코딩해서 넘긴다.
 */
const normalizeImageUrl = (url) => {
  if (!url) return url;
  if (/%[0-9A-Fa-f]{2}/.test(url)) return url; // 이미 인코딩된 주소는 건드리지 않는다
  try {
    return encodeURI(url);
  } catch {
    return url;
  }
};

const fetchContents = async (pageType, contentType) => {
  const { data } = await contentHttp.get(`${COALITION_BASE_PATH}/contents`, {
    params: { pageType, contentType },
  });
  const items = Array.isArray(data) ? data : [];
  return items
    .filter((item) => item && item.active !== false)
    .map((item) => ({ ...item, imageUrl: normalizeImageUrl(item.imageUrl) }))
    .sort(byDisplayOrder);
};

export const coalitionAPI = {
  /**
   * 페이지 상단·중간에 노출하는 배너.
   * 하단 전용 배너(position=BOTTOM)는 전역 배너가 따로 가져가므로 제외한다.
   */
  getBanners: async (pageType) => {
    const items = await fetchContents(pageType, 'BANNER');
    return items.filter((item) => item.imageUrl && item.position !== 'BOTTOM');
  },

  /** 화면 하단에 깔리는 전역 배너 (메인 홈 + 하단). */
  getGlobalBanners: async () => {
    const items = await fetchContents(COALITION_PAGE_TYPE.MAIN, 'BANNER');
    return items.filter((item) => item.imageUrl && item.position === 'BOTTOM');
  },

  /** 메인 홈 유튜브 영상. */
  getYoutubeVideos: async (limit = 3) => {
    const items = await fetchContents(COALITION_PAGE_TYPE.MAIN, 'YOUTUBE');
    return items.filter((item) => item.youtubeUrl).slice(0, limit);
  },
};

export default coalitionAPI;
