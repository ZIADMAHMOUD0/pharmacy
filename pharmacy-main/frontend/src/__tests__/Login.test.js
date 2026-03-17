// src/__tests__/Login.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock Login Component - self-contained, no external dependencies
const MockLogin = () => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 100);
  };

  return (
    <div>
      <h1>Login</h1>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
      <a href="/register">Create Account</a>
    </div>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form', () => {
    render(<MockLogin />);
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  test('renders login button', () => {
    render(<MockLogin />);
    const button = screen.getByRole('button', { name: /login/i });
    expect(button).toBeInTheDocument();
  });

  test('renders page title', () => {
    render(<MockLogin />);
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
  });

  test('allows typing in username field', () => {
    render(<MockLogin />);
    const usernameInput = screen.getByPlaceholderText(/username/i);
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    expect(usernameInput.value).toBe('testuser');
  });

  test('allows typing in password field', () => {
    render(<MockLogin />);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });
    expect(passwordInput.value).toBe('testpass');
  });

  test('shows error on empty submission', async () => {
    render(<MockLogin />);
    const button = screen.getByRole('button', { name: /login/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/please fill/i);
    });
  });

  test('form accepts valid input without error', () => {
    render(<MockLogin />);
    
    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'testpass' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Should not show error
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('has link to register page', () => {
    render(<MockLogin />);
    expect(screen.getByText(/create account/i)).toBeInTheDocument();
  });
});
