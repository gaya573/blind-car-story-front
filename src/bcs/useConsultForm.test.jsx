import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BcsUiProvider } from './BcsUiContext';
import { useConsultForm } from './useConsultForm';
import PrivacyRow from './components/PrivacyRow';
import { submitConsult } from '../services/consultHelper';

jest.mock('../services/consultHelper', () => ({
  submitConsult: jest.fn(),
}));

function DemoForm() {
  const { handleSubmit, error } = useConsultForm({ source: 'home-page', entryLabel: '메인 상단 견적문의' });
  return (
    <form onSubmit={handleSubmit} noValidate data-testid="form">
      <input aria-label="이름" name="name" />
      <input aria-label="연락처" name="phone" />
      <input aria-label="브랜드" name="brand" />
      <input aria-label="차종" name="carModel" />
      <select aria-label="계약기간" name="period" defaultValue="">
        <option value="">계약기간</option>
        <option value="48">48개월</option>
      </select>
      <PrivacyRow id="privacy" />
      <p className="form-error">{error}</p>
      <button type="submit">제출</button>
    </form>
  );
}

const renderForm = () =>
  render(
    <BcsUiProvider>
      <DemoForm />
    </BcsUiProvider>,
  );

// Provider 가 견적 모달도 함께 그리므로(같은 이름의 입력칸) 테스트 폼 안에서만 찾는다.
const form = () => within(screen.getByTestId('form'));
const fill = (label, value) => fireEvent.change(form().getByLabelText(label), { target: { value } });

describe('useConsultForm', () => {
  beforeEach(() => submitConsult.mockReset());

  test('개인정보 동의는 기본으로 해제되어 있고, 체크하지 않으면 제출하지 않는다', () => {
    renderForm();
    expect(form().getByLabelText('개인정보 이용 동의')).not.toBeChecked();
    fill('연락처', '01012345678');
    fireEvent.click(form().getByRole('button', { name: '제출' }));
    expect(screen.getAllByText('개인정보 이용 동의에 체크해 주세요.').length).toBeGreaterThan(0);
    expect(submitConsult).not.toHaveBeenCalled();
  });

  test('연락처가 10~11자리가 아니면 제출하지 않는다', () => {
    renderForm();
    fireEvent.click(form().getByLabelText('개인정보 이용 동의'));
    fill('연락처', '010-123');
    fireEvent.click(form().getByRole('button', { name: '제출' }));
    expect(screen.getAllByText('연락처 형식을 확인해 주세요.').length).toBeGreaterThan(0);
    expect(submitConsult).not.toHaveBeenCalled();
  });

  test('퍼블리싱 필드를 상담 API 형식으로 보내고 성공하면 폼을 비운다', async () => {
    submitConsult.mockResolvedValue({ success: true });
    renderForm();
    fill('이름', '홍길동');
    fill('연락처', '010-1234-5678');
    fill('브랜드', '기아');
    fill('차종', '쏘렌토');
    fill('계약기간', '48');
    fireEvent.click(form().getByLabelText('개인정보 이용 동의'));
    fireEvent.click(form().getByRole('button', { name: '제출' }));

    await waitFor(() => expect(submitConsult).toHaveBeenCalledTimes(1));
    expect(submitConsult).toHaveBeenCalledWith(
      {
        name: '홍길동',
        phone: '01012345678',
        brand: '기아',
        model: '쏘렌토',
        trim: '',
        color: '',
        options: [],
        terms: ['48개월'],
        consultType: '차량견적요청',
        source: 'home-page',
        entryLabel: '메인 상단 견적문의',
      },
      { useKakao: false },
    );
    await waitFor(() => expect(form().getByLabelText('이름')).toHaveValue(''));
    expect(screen.getByRole('status')).toHaveTextContent('견적 신청이 접수되었습니다.');
  });

  test('상세 화면이 넘긴 트림·색상·옵션·계약조건을 함께 보낸다', async () => {
    submitConsult.mockResolvedValue({ success: true });
    function DetailForm() {
      const { handleSubmit } = useConsultForm({
        source: 'm-car-detail-bar',
        entryLabel: '모바일 차량 상세 > 쏘렌토',
        defaults: {
          brand: '기아',
          trim: '프레스티지',
          color: '스노우 화이트 펄',
          options: ['색상: 스노우 화이트 펄', '파노라마 선루프'],
          terms: ['48개월', '선납금 30%'],
          consultType: '차량라인상세',
          extra: { vehicleLineId: 995, trimId: 8144 },
        },
      });
      return (
        <form onSubmit={handleSubmit} noValidate data-testid="form">
          <input aria-label="연락처" name="phone" />
          <input aria-label="차종" name="carModel" defaultValue="기아 쏘렌토" />
          <PrivacyRow id="privacy" />
          <button type="submit">제출</button>
        </form>
      );
    }
    render(
      <BcsUiProvider>
        <DetailForm />
      </BcsUiProvider>,
    );
    fill('연락처', '01012345678');
    fireEvent.click(form().getByLabelText('개인정보 이용 동의'));
    fireEvent.click(form().getByRole('button', { name: '제출' }));

    await waitFor(() => expect(submitConsult).toHaveBeenCalledTimes(1));
    expect(submitConsult.mock.calls[0][0]).toMatchObject({
      brand: '기아',
      model: '기아 쏘렌토',
      trim: '프레스티지',
      color: '스노우 화이트 펄',
      options: ['색상: 스노우 화이트 펄', '파노라마 선루프'],
      terms: ['48개월', '선납금 30%'],
      consultType: '차량라인상세',
      source: 'm-car-detail-bar',
      entryLabel: '모바일 차량 상세 > 쏘렌토',
      extra: { vehicleLineId: 995, trimId: 8144 },
    });
  });

  test('백엔드가 success:false 를 돌려주면 성공으로 처리하지 않는다', async () => {
    submitConsult.mockResolvedValue({ success: false, message: '존재하지 않거나 비활성 제휴사' });
    renderForm();
    fill('이름', '홍길동');
    fill('연락처', '01012345678');
    fireEvent.click(form().getByLabelText('개인정보 이용 동의'));
    fireEvent.click(form().getByRole('button', { name: '제출' }));

    await waitFor(() => expect(screen.getAllByText('존재하지 않거나 비활성 제휴사').length).toBeGreaterThan(0));
    expect(form().getByLabelText('이름')).toHaveValue('홍길동');
  });
});
