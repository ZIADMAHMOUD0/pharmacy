// src/__tests__/frontend_tests.js
/**
 * PharmaCare Frontend Test Suite
 * 
 * Setup:
 * npm install --save-dev @testing-library/react @testing-library/jest-dom jest
 * 
 * Run tests:
 * npm test
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

// Mock API
jest.mock('../services/api', () => ({
  authAPI: {
    login: jest.fn(),
    signup: jest.fn(),
  },
  productAPI: {
    getAll: jest.fn(),
    search: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  cartAPI: {
    getCart: jest.fn(),
    addToCart: jest.fn(),
    updateCart: jest.fn(),
    removeFromCart: jest.fn(),
  },
  categoryAPI: {
    getAll: jest.fn(),
  },
  orderAPI: {
    getAll: jest.fn(),
    checkout: jest.fn(),
  },
  medicalProfileAPI: {
    getMyProfile: jest.fn(),
    updateMyProfile: jest.fn(),
  },
  allergyAPI: {
    getAll: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
}));

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// ============================================================================
// LOGIN COMPONENT TESTS
// ============================================================================

describe('Login Component', () => {
  const Login = require('../pages/Login').default;
  const { authAPI } = require('../services/api');

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders login form', () => {
    renderWithRouter(<Login />);
    
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login|sign in/i })).toBeInTheDocument();
  });

  test('shows error on invalid credentials', async () => {
    authAPI.login.mockRejectedValue({
      response: { status: 401 }
    });

    renderWithRouter(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'wronguser' }
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'wrongpass' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login|sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid|error|failed/i)).toBeInTheDocument();
    });
  });

  test('successful login stores tokens', async () => {
    authAPI.login.mockResolvedValue({
      data: {
        access: 'test_access_token',
        refresh: 'test_refresh_token',
        user: { id: 1, username: 'testuser', role: 'customer' }
      }
    });

    renderWithRouter(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'testpass' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login|sign in/i }));

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('test_access_token');
    });
  });
});

// ============================================================================
// PRODUCTS COMPONENT TESTS
// ============================================================================

describe('Products Component', () => {
  const Products = require('../pages/Products').default;
  const { productAPI, cartAPI, categoryAPI } = require('../services/api');

  const mockProducts = [
    {
      id: 1,
      name: 'Paracetamol',
      description: 'Pain reliever',
      price: '9.99',
      category: 1,
      category_name: 'Pain Relief',
      manufacturer: 'PharmaCo',
      total_stock: 100,
      requires_prescription: false,
      image_url: null
    },
    {
      id: 2,
      name: 'Amoxicillin',
      description: 'Antibiotic',
      price: '15.99',
      category: 2,
      category_name: 'Antibiotics',
      manufacturer: 'MedCorp',
      total_stock: 50,
      requires_prescription: true,
      image_url: null
    }
  ];

  const mockCategories = [
    { id: 1, name: 'Pain Relief', product_count: 1 },
    { id: 2, name: 'Antibiotics', product_count: 1 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    productAPI.getAll.mockResolvedValue({ data: mockProducts });
    categoryAPI.getAll.mockResolvedValue({ data: mockCategories });
  });

  test('renders products list', async () => {
    renderWithRouter(<Products />);

    await waitFor(() => {
      expect(screen.getByText('Paracetamol')).toBeInTheDocument();
      expect(screen.getByText('Amoxicillin')).toBeInTheDocument();
    });
  });

  test('displays product prices', async () => {
    renderWithRouter(<Products />);

    await waitFor(() => {
      expect(screen.getByText(/\$9\.99/)).toBeInTheDocument();
      expect(screen.getByText(/\$15\.99/)).toBeInTheDocument();
    });
  });

  test('shows prescription badge for Rx products', async () => {
    renderWithRouter(<Products />);

    await waitFor(() => {
      expect(screen.getByText(/prescription/i)).toBeInTheDocument();
    });
  });

  test('filters products by search', async () => {
    renderWithRouter(<Products />);

    await waitFor(() => {
      expect(screen.getByText('Paracetamol')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Amox' } });

    await waitFor(() => {
      expect(screen.queryByText('Paracetamol')).not.toBeInTheDocument();
      expect(screen.getByText('Amoxicillin')).toBeInTheDocument();
    });
  });

  test('adds product to cart', async () => {
    cartAPI.addToCart.mockResolvedValue({ data: { id: 1 } });
    
    renderWithRouter(<Products />);

    await waitFor(() => {
      expect(screen.getByText('Paracetamol')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /add/i });
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      expect(cartAPI.addToCart).toHaveBeenCalledWith({
        product: 1,
        quantity: 1
      });
    });
  });
});

// ============================================================================
// CART COMPONENT TESTS
// ============================================================================

describe('Cart Component', () => {
  const Cart = require('../pages/Cart').default;
  const { cartAPI } = require('../services/api');

  const mockCartItems = [
    {
      id: 1,
      product: 1,
      product_name: 'Vitamin C',
      product_price: '19.99',
      quantity: 2
    },
    {
      id: 2,
      product: 2,
      product_name: 'Omega-3',
      product_price: '24.99',
      quantity: 1
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    cartAPI.getCart.mockResolvedValue({ data: mockCartItems });
  });

  test('renders cart items', async () => {
    renderWithRouter(<Cart />);

    await waitFor(() => {
      expect(screen.getByText('Vitamin C')).toBeInTheDocument();
      expect(screen.getByText('Omega-3')).toBeInTheDocument();
    });
  });

  test('calculates total correctly', async () => {
    renderWithRouter(<Cart />);

    // Total: (19.99 * 2) + (24.99 * 1) = 64.97
    await waitFor(() => {
      expect(screen.getByText(/64\.97/)).toBeInTheDocument();
    });
  });

  test('updates quantity', async () => {
    cartAPI.updateCart.mockResolvedValue({ data: { id: 1, quantity: 3 } });
    
    renderWithRouter(<Cart />);

    await waitFor(() => {
      expect(screen.getByText('Vitamin C')).toBeInTheDocument();
    });

    // Find increase button and click
    const increaseButtons = screen.getAllByRole('button', { name: /\+|increase/i });
    fireEvent.click(increaseButtons[0]);

    await waitFor(() => {
      expect(cartAPI.updateCart).toHaveBeenCalled();
    });
  });

  test('removes item from cart', async () => {
    cartAPI.removeFromCart.mockResolvedValue({});
    
    renderWithRouter(<Cart />);

    await waitFor(() => {
      expect(screen.getByText('Vitamin C')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole('button', { name: /remove|delete|×/i });
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(cartAPI.removeFromCart).toHaveBeenCalledWith(1);
    });
  });
});

// ============================================================================
// MEDICAL HISTORY COMPONENT TESTS
// ============================================================================

describe('Medical History Component', () => {
  const MedicalHistory = require('../pages/MedicalHistory').default;
  const { medicalProfileAPI, allergyAPI } = require('../services/api');

  const mockProfile = {
    id: 1,
    blood_type: 'A+',
    weight: '75.5',
    height: '180',
    emergency_contact_name: 'Jane Doe',
    emergency_contact_phone: '1234567890',
    allergies: [
      { id: 1, allergen: 'Penicillin', severity: 'severe' }
    ],
    chronic_conditions: [
      { id: 1, condition_name: 'Asthma', status: 'managed' }
    ],
    current_medications: [
      { id: 1, medication_name: 'Inhaler', dosage: '2 puffs', frequency: 'as_needed' }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    medicalProfileAPI.getMyProfile.mockResolvedValue({ data: mockProfile });
    allergyAPI.getAll.mockResolvedValue({ data: mockProfile.allergies });
  });

  test('renders medical profile', async () => {
    renderWithRouter(<MedicalHistory />);

    await waitFor(() => {
      expect(screen.getByText(/A\+/)).toBeInTheDocument();
    });
  });

  test('displays allergies', async () => {
    renderWithRouter(<MedicalHistory />);

    await waitFor(() => {
      expect(screen.getByText(/Penicillin/i)).toBeInTheDocument();
    });
  });

  test('displays chronic conditions', async () => {
    renderWithRouter(<MedicalHistory />);

    await waitFor(() => {
      expect(screen.getByText(/Asthma/i)).toBeInTheDocument();
    });
  });

  test('displays current medications', async () => {
    renderWithRouter(<MedicalHistory />);

    await waitFor(() => {
      expect(screen.getByText(/Inhaler/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// ADMIN MANAGE PRODUCTS TESTS
// ============================================================================

describe('Admin ManageProducts Component', () => {
  const ManageProducts = require('../pages/admin/ManageProducts').default;
  const { productAPI, categoryAPI } = require('../services/api');

  const mockProducts = [
    {
      id: 1,
      name: 'Test Product',
      description: 'Test description',
      price: '10.00',
      category: 1,
      category_name: 'Test Category',
      manufacturer: 'TestCo',
      total_stock: 50,
      is_low_stock: false,
      requires_prescription: false
    }
  ];

  const mockCategories = [
    { id: 1, name: 'Test Category' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    productAPI.getAll.mockResolvedValue({ data: mockProducts });
    categoryAPI.getAll.mockResolvedValue({ data: mockCategories });
  });

  test('renders product management page', async () => {
    renderWithRouter(<ManageProducts />);

    await waitFor(() => {
      expect(screen.getByText(/Manage Products/i)).toBeInTheDocument();
    });
  });

  test('displays add product button', async () => {
    renderWithRouter(<ManageProducts />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add product/i })).toBeInTheDocument();
    });
  });

  test('opens add product modal', async () => {
    renderWithRouter(<ManageProducts />);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /add product/i }));

    await waitFor(() => {
      expect(screen.getByText(/Add Product|Create/i)).toBeInTheDocument();
    });
  });

  test('deletes product', async () => {
    productAPI.delete.mockResolvedValue({});
    
    renderWithRouter(<ManageProducts />);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Find delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm|yes|delete/i });
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(productAPI.delete).toHaveBeenCalledWith(1);
    });
  });
});

// ============================================================================
// UTILITY COMPONENT TESTS
// ============================================================================

describe('Toast Component', () => {
  const ToastContainer = require('../components/ToastContainer').default;

  test('renders toast messages', () => {
    const toasts = [
      { id: 1, message: 'Success message', type: 'success' },
      { id: 2, message: 'Error message', type: 'error' }
    ];

    render(<ToastContainer toasts={toasts} removeToast={() => {}} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
});

describe('ConfirmModal Component', () => {
  const ConfirmModal = require('../components/ConfirmModal').default;

  test('renders confirm modal', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirm Action"
        message="Are you sure?"
      />
    );

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  test('calls onConfirm when confirmed', () => {
    const onConfirm = jest.fn();

    render(
      <ConfirmModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={onConfirm}
        title="Test"
        message="Test message"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /confirm|yes|ok/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  test('calls onClose when cancelled', () => {
    const onClose = jest.fn();

    render(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={() => {}}
        title="Test"
        message="Test message"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel|no|close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
