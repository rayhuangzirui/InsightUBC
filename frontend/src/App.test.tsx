import React from 'react';
import { render, screen } from '@testing-library/react';
// import App from './App';
import AppPage from './AppPage';
test('renders learn react link', () => {
  render(<AppPage />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
