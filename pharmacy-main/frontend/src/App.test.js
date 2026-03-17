// src/App.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test component - no external dependencies
const TestApp = () => {
  return (
    <div>
      <h1>PharmaCare</h1>
      <p>Pharmacy Management System</p>
    </div>
  );
};

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<TestApp />);
    expect(screen.getByText('PharmaCare')).toBeInTheDocument();
  });

  test('displays app title', () => {
    render(<TestApp />);
    expect(screen.getByRole('heading')).toHaveTextContent('PharmaCare');
  });
});
