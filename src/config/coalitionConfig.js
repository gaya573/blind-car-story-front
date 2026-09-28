/**
 * 이 사이트는 원더굿라이프의 제휴사로 동작한다.
 * 배너·유튜브·상담·분석이 모두 이 코드로 분리되어 저장·조회된다.
 *
 * 어드민에 등록된 제휴사 코드와 반드시 같아야 한다.
 * 코드가 없으면 공개 API가 400 "존재하지 않는 제휴사"를 돌려준다.
 */
// GitHub Actions 는 정의되지 않은 변수를 빈 문자열로 넣는다. ?? 로는 걸러지지 않아
// `/api/coalition//…` 로 호출되므로, 비어 있으면 기본 코드를 쓴다.
const DEFAULT_CODE = 'BLINDCAR';
const RAW_CODE = String(import.meta.env?.VITE_COALITION_CODE ?? '').trim();

export const COALITION_CODE = (RAW_CODE || DEFAULT_CODE).toUpperCase();

export const COALITION_BASE_PATH = `/api/coalition/${encodeURIComponent(COALITION_CODE)}`;
