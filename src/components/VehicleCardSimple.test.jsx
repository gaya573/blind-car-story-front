import React from 'react';
import { render, screen } from '@testing-library/react';
import VehicleCardSimple from './VehicleCardSimple.jsx';

describe('VehicleCardSimple', () => {
  test('always renders the three approved rental-condition rows', () => {
    render(
      <VehicleCardSimple
        name="기아 EV5"
        trim={{
          lowestPrepayment30MonthlyFee: 237110,
          lowestDeposit30MonthlyFee: 386100,
          lowestNoDepositMonthlyFee: 433180,
        }}
      />,
    );

    expect(screen.getByText('선납금 30%')).toBeInTheDocument();
    expect(screen.getByText('보증금 30%')).toBeInTheDocument();
    expect(screen.getByText('완전무보증')).toBeInTheDocument();
    expect(screen.getByText('237,110')).toBeInTheDocument();
    expect(screen.getByText('386,100')).toBeInTheDocument();
    expect(screen.getByText('433,180')).toBeInTheDocument();
  });

  test('keeps all three condition rows even when one price is unavailable', () => {
    render(
      <VehicleCardSimple
        trim={{ lowestNoDepositMonthlyFee: 433180 }}
      />,
    );

    expect(screen.getByLabelText('렌탈 조건별 월 납입금')).toBeInTheDocument();
    expect(screen.getAllByText('가격 문의')).toHaveLength(2);
    expect(screen.getByText('433,180')).toBeInTheDocument();
  });
});
