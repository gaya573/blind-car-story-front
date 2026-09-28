import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MobleCarSearch from './MobleCarSearch.jsx';

const renderWithProviders = (ui) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('MobleCarSearch', () => {
  test('renders the vehicle search entry page', () => {
    renderWithProviders(<MobleCarSearch />);

    expect(screen.getByText('어떤 차를 찾으세요?')).toBeInTheDocument();
  });

  test('renders domestic and imported featured brands', () => {
    renderWithProviders(<MobleCarSearch />);

    expect(screen.getByText('국산차')).toBeInTheDocument();
    expect(screen.getByText('수입차')).toBeInTheDocument();
    expect(screen.getByText('현대')).toBeInTheDocument();
    expect(screen.getByText('BMW')).toBeInTheDocument();
  });
});















