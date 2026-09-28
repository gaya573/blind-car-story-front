import { toVehicleCardModel, earliestDeadline } from './vehicle';
import { deadlineBadgeText, formatMonthly, formatWonTilde, validatePhone } from './format';

describe('toVehicleCardModel', () => {
  test('콘텐츠 API(snake_case) 항목을 차량 카드 모양으로 바꾼다', () => {
    const model = toVehicleCardModel({
      id: 148,
      trimId: 8144,
      vehicleLineId: 101,
      title: '현대 투싼',
      subtitle: '모던 하이브리드',
      extraInfo: '현대',
      imageUrl: 'https://cdn/tucson.png',
      basePrice: 32700000,
      lowest_prepayment_30_monthly_fee: 237110,
      lowest_deposit_30_monthly_fee: 386100,
      lowest_no_deposit_monthly_fee: 433180,
      remainingDays: 13,
    });
    expect(model).toMatchObject({
      id: 148,
      trimId: 8144,
      vehicleLineId: 101,
      brandName: '현대',
      vehicleName: '현대 투싼',
      trimName: '모던 하이브리드',
      prepayment30: 237110,
      deposit30: 386100,
      noDeposit: 433180,
      remainingDays: 13,
    });
  });

  test('camelCase·중첩 trim 요금과 마감일로 남은 일수를 계산한다', () => {
    const deadline = new Date(Date.now() + 2.5 * 86400000).toISOString();
    const model = toVehicleCardModel({
      trim: { id: 7, lowestPrepayment30MonthlyFee: 1, lowestDeposit30MonthlyFee: 2, lowestNoDepositMonthlyFee: 3 },
      name: 'K8',
      deadline,
    });
    expect(model).toMatchObject({ trimId: 7, vehicleName: 'K8', prepayment30: 1, deposit30: 2, noDeposit: 3, remainingDays: 3 });
  });
});

describe('earliestDeadline', () => {
  test('가장 이른 마감일을 고르고 잘못된 날짜는 건너뛴다', () => {
    expect(earliestDeadline([{ deadline: '2026-10-10T00:00:00' }, { deadline: 'x' }, { endDate: '2026-10-01T00:00:00' }])).toEqual(
      new Date('2026-10-01T00:00:00'),
    );
    expect(earliestDeadline([])).toBeNull();
  });
});

describe('format', () => {
  test('퍼블리싱 표기 규칙', () => {
    expect(formatWonTilde(32700000)).toBe('32,700,000원~');
    expect(formatMonthly(null)).toBe('-');
    expect(deadlineBadgeText(0)).toBe('오늘 마감');
    expect(deadlineBadgeText(3)).toBe('D-3');
    expect(deadlineBadgeText(null)).toBe('');
    expect(validatePhone('')).toBe('연락처를 입력해 주세요.');
    expect(validatePhone('010-1234-567')).toBe('');
    expect(validatePhone('0101234')).toBe('연락처 형식을 확인해 주세요.');
  });
});
