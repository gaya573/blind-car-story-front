import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MobleCarFilter from './MobleCarFilter.jsx';

const renderWithProviders = (ui, route = '/m/search/filters') => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
};

describe('MobleCarFilter', () => {
  test('renders filter page', () => {
    renderWithProviders(<MobleCarFilter />);

    expect(screen.getByText(/차량검색/)).toBeInTheDocument();
  });

  test('renders domestic and import tabs', () => {
    renderWithProviders(<MobleCarFilter />);

    expect(screen.getByText('국산차')).toBeInTheDocument();
    expect(screen.getByText('수입차')).toBeInTheDocument();
  });

  test('renders filter options', () => {
    renderWithProviders(<MobleCarFilter />);

    expect(screen.getByText(/제조사/)).toBeInTheDocument();
    expect(screen.getByText(/연료/)).toBeInTheDocument();
    expect(screen.getByText('가솔린')).toBeInTheDocument();
    expect(screen.getByText('전기·수소')).toBeInTheDocument();
  });
});















