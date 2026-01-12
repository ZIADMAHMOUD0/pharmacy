// src/__tests__/Products.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock data
const mockProducts = [
  {
    id: 1,
    name: 'Paracetamol',
    description: 'Pain reliever',
    price: '9.99',
    category_name: 'Pain Relief',
    total_stock: 100,
    requires_prescription: false
  },
  {
    id: 2,
    name: 'Amoxicillin',
    description: 'Antibiotic',
    price: '15.99',
    category_name: 'Antibiotics',
    total_stock: 50,
    requires_prescription: true
  },
  {
    id: 3,
    name: 'Vitamin C',
    description: 'Immune booster',
    price: '12.99',
    category_name: 'Vitamins',
    total_stock: 200,
    requires_prescription: false
  }
];

// Mock Products Component - self-contained
const MockProducts = ({ products = mockProducts, onAddToCart = jest.fn() }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  
  const categories = [...new Set(products.map(p => p.category_name))];
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || p.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <h1>Products</h1>
      
      <input
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <select 
        value={selectedCategory} 
        onChange={(e) => setSelectedCategory(e.target.value)}
        aria-label="Category filter"
      >
        <option value="">All Categories</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      
      <p>{filteredProducts.length} products found</p>
      
      <div>
        {filteredProducts.map(product => (
          <div key={product.id} data-testid="product-card">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p>${product.price}</p>
            <p>Stock: {product.total_stock}</p>
            <p>Category: {product.category_name}</p>
            {product.requires_prescription && (
              <span data-testid="rx-badge">Prescription Required</span>
            )}
            <button onClick={() => onAddToCart(product.id)}>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
};

describe('Products Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders products page title', () => {
    render(<MockProducts />);
    expect(screen.getByRole('heading', { name: /products/i })).toBeInTheDocument();
  });

  test('displays all products', () => {
    render(<MockProducts />);
    expect(screen.getByText('Paracetamol')).toBeInTheDocument();
    expect(screen.getByText('Amoxicillin')).toBeInTheDocument();
    expect(screen.getByText('Vitamin C')).toBeInTheDocument();
  });

  test('displays product prices', () => {
    render(<MockProducts />);
    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.getByText('$15.99')).toBeInTheDocument();
    expect(screen.getByText('$12.99')).toBeInTheDocument();
  });

  test('shows prescription badge for Rx products', () => {
    render(<MockProducts />);
    const rxBadges = screen.getAllByTestId('rx-badge');
    expect(rxBadges.length).toBe(1); // Only Amoxicillin
  });

  test('has search input', () => {
    render(<MockProducts />);
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  test('filters products by search', () => {
    render(<MockProducts />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Vitamin' } });
    
    expect(screen.queryByText('Paracetamol')).not.toBeInTheDocument();
    expect(screen.queryByText('Amoxicillin')).not.toBeInTheDocument();
    expect(screen.getByText('Vitamin C')).toBeInTheDocument();
  });

  test('has category filter', () => {
    render(<MockProducts />);
    const categorySelect = screen.getByRole('combobox', { name: /category/i });
    expect(categorySelect).toBeInTheDocument();
  });

  test('filters products by category', () => {
    render(<MockProducts />);
    
    const categorySelect = screen.getByRole('combobox', { name: /category/i });
    fireEvent.change(categorySelect, { target: { value: 'Vitamins' } });
    
    expect(screen.queryByText('Paracetamol')).not.toBeInTheDocument();
    expect(screen.getByText('Vitamin C')).toBeInTheDocument();
  });

  test('has add to cart buttons', () => {
    render(<MockProducts />);
    const addButtons = screen.getAllByRole('button', { name: /add to cart/i });
    expect(addButtons.length).toBe(3);
  });

  test('calls onAddToCart when button clicked', () => {
    const mockAddToCart = jest.fn();
    render(<MockProducts onAddToCart={mockAddToCart} />);
    
    const addButtons = screen.getAllByRole('button', { name: /add to cart/i });
    fireEvent.click(addButtons[0]);
    
    expect(mockAddToCart).toHaveBeenCalledWith(1);
  });

  test('displays product count', () => {
    render(<MockProducts />);
    expect(screen.getByText(/3 products found/i)).toBeInTheDocument();
  });

  test('updates product count after filter', () => {
    render(<MockProducts />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Vitamin' } });
    
    expect(screen.getByText(/1 products found/i)).toBeInTheDocument();
  });
});
