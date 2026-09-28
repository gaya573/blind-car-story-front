/**
 * 외장색상 칩 색 계산. 기존 두 상세 페이지의 규칙을 그대로 옮겼다.
 *  - 트림 상세: 실제 CSS 색상 코드(hex/rgb)가 있는 색상만 보여준다(resolveStrictChipColor).
 *  - 차량 라인 상세: 색상 이름으로 대표색을 추정하고, 투톤은 위아래 그라데이션으로 그린다(resolveChipColor).
 */
import { resolveColorImageUrl } from './carDetailShared';

const rawColorCode = (color) => color?.hexCode || color?.colorCode || color?.rgb || color?.rgbCode || '';

/** 트림 상세: hex / rgb / rgba 만 칩 색으로 쓴다. PM2 같은 제조사 코드는 무시한다. */
export const resolveStrictChipColor = (color) => {
  const raw = rawColorCode(color);
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^rgba?\(/i.test(trimmed)) return trimmed;
  const hexMatch = trimmed.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  return hexMatch ? `#${hexMatch[1]}` : null;
};

export const hasStrictColorCode = (color) => Boolean(resolveStrictChipColor(color));

const COLOR_NAME_RULES = [
  { tokens: ['abyss', '어비스'], color: '#07080A' },
  { tokens: ['phantom', '팬텀'], color: '#090A0D' },
  { tokens: ['space black', 'black', '스페이스 블랙', '블랙'], color: '#0B0B0D' },
  { tokens: ['neoteric', 'yellow', '네오테릭', '옐로우'], color: '#C6CF22' },
  { tokens: ['mirage', '미라지'], color: '#5F7065' },
  { tokens: ['forest', '포레스트'], color: '#244235' },
  { tokens: ['robust', 'emerald', '로버스트', '에메랄드'], color: '#0F3E35' },
  { tokens: ['intense blue', '인텐스'], color: '#173E6D' },
  { tokens: ['dandy blue', '댄디'], color: '#1E4F86' },
  { tokens: ['denim blue', '데님'], color: '#2A5872' },
  { tokens: ['yacht', '요트'], color: '#2E5368' },
  { tokens: ['transmission blue', '트랜스미션'], color: '#435E6C' },
  { tokens: ['blue dusk', '블루 더스크'], color: '#3E5262' },
  { tokens: ['meta blue', 'moonlight', 'blue', '메타블루', '문라이트', '블루', 'navy', '네이비'], color: '#2E5674' },
  { tokens: ['ultimate', 'red', '얼티메이트', '레드', 'crimson', 'burgundy', '버건디'], color: '#A51D2D' },
  { tokens: ['grand white', '그랜드 화이트'], color: '#F4F3EE' },
  { tokens: ['glacier white', '글레이셔'], color: '#F1F3F2' },
  { tokens: ['chalk white', 'chalkwhite', '초크화이트'], color: '#E9E9E2' },
  { tokens: ['atlas', '아틀라스'], color: '#F5F6F1' },
  { tokens: ['creamy', 'clear white', 'white', 'snow', '화이트', '스노우', '클리어'], color: '#F3F1EA' },
  { tokens: ['shimmering', '쉬머링'], color: '#C4C8C7' },
  { tokens: ['silver', '실버'], color: '#B8B6AA' },
  { tokens: ['iron metal', '아이언'], color: '#5E6466' },
  { tokens: ['cyber gray', '사이버'], color: '#687071' },
  { tokens: ['ecotronic', '에코트로닉'], color: '#626B6B' },
  { tokens: ['moonstone', '문스톤'], color: '#73797A' },
  { tokens: ['nocturne', '녹턴'], color: '#4D5356' },
  { tokens: ['moonscape', '문스케이프'], color: '#555B5D' },
  { tokens: ['urban gray', '어반 그레이'], color: '#6E7472' },
  { tokens: ['celadon gray', '셀라돈'], color: '#879087' },
  { tokens: ['shadow matte gray', '쉐도우'], color: '#56595A' },
  { tokens: ['graphite', 'gravity', 'gray', 'grey', 'metal', '그래비티', '그레이', '메탈'], color: '#7B8083' },
  { tokens: ['latte greige', 'greige', '라떼', '그레이지'], color: '#A49D8F' },
  { tokens: ['ivory', '아이보리'], color: '#B8B6AA' },
  { tokens: ['gravity gold', 'gold', '그래비티 골드', '골드'], color: '#8E7D54' },
  { tokens: ['green', '그린', 'khaki', '카키', 'ocado', '오카도'], color: '#284F3B' },
  { tokens: ['cast iron brown', '캐스트 아이언 브라운'], color: '#4A382F' },
  { tokens: ['frosted brown', '프로스티드'], color: '#6D574A' },
  { tokens: ['brown', 'terracotta', 'copper', '브라운', '테라코타', '코퍼'], color: '#805131' },
  { tokens: ['beige', 'sand', '베이지', '샌드'], color: '#C5B49A' },
  { tokens: ['orange', 'sienna', 'siena', '오렌지'], color: '#B86432' },
];

const ROOF_BLACK_TOKENS = ['black', 'abyss', 'phantom', '블랙', '어비스', '팬텀'];

const inferColorFromName = (name = '') => {
  const text = String(name).toLowerCase();
  if (!text) return null;

  const normalizePart = (part) => part.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ').trim();
  const colorParts = text.split(/[/|+]/).map(normalizePart).filter(Boolean);
  const pick = (source) => {
    const rule = COLOR_NAME_RULES.find((item) => item.tokens.some((token) => source.includes(token)));
    return rule ? { color: rule.color } : null;
  };
  const isRoofBlack = (part = '') => ROOF_BLACK_TOKENS.some((token) => part.includes(token));

  const parsedParts = colorParts.map((part) => ({ part, match: pick(part) })).filter((item) => item.match);
  if (parsedParts.length >= 2) {
    const [firstPart, secondPart] = parsedParts;
    const firstIsBlack = isRoofBlack(firstPart.part);
    const secondIsBlack = isRoofBlack(secondPart.part);
    const roofPart = firstIsBlack && !secondIsBlack ? firstPart : secondPart;
    const bodyPart = secondIsBlack && !firstIsBlack ? firstPart : secondPart;
    const roofColor = roofPart?.match.color;
    const bodyColor = bodyPart?.match.color;
    if (roofColor && bodyColor && roofColor !== bodyColor) {
      return `linear-gradient(to bottom, ${roofColor} 0 46%, ${bodyColor} 46% 100%)`;
    }
  }

  return parsedParts[0]?.match.color ?? pick(text)?.color ?? null;
};

const GENERIC_HEX = ['#777777', '#888888', '#999999', '#808080', '#777', '#888', '#999', '#000000', '#111111', '#FF0000', '#0000FF', '#008000', '#00FF00', '#A52A2A'];

/** 차량 라인 상세: 코드가 흔한 기본값(회색·검정 등)이면 이름으로 추정한 색을 우선한다. */
export const resolveChipColor = (color) => {
  const raw = rawColorCode(color);
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (/^linear-gradient\(/i.test(trimmed)) return trimmed;
  const inferredColor = inferColorFromName(color?.name);
  if (!trimmed) return inferredColor;
  if (/^rgba?\(/i.test(trimmed)) return inferredColor || trimmed;

  const hexMatch = trimmed.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!hexMatch) return inferredColor;

  const hex = hexMatch[1];
  const normalized = `#${hex.length === 3 ? hex : hex.toUpperCase()}`;
  if (inferredColor?.startsWith('linear-gradient(')) return inferredColor;
  return inferredColor && GENERIC_HEX.includes(normalized.toUpperCase()) ? inferredColor : normalized;
};

const canDisplayColor = (color) => Boolean(resolveColorImageUrl(color) || resolveChipColor(color));

/** 차량 라인 상세: 외장색이 있으면 외장색만, 없으면 표시 가능한 색 전체 */
export const getDisplayColors = (colors) => {
  if (!Array.isArray(colors)) return [];
  const validColors = colors.filter(canDisplayColor);
  const exteriorColors = validColors.filter((color) => !color?.vehicleInterior);
  return exteriorColors.length > 0 ? exteriorColors : validColors;
};
