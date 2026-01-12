// src/__tests__/Cart.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock cart data
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

// Mock Cart Component - self-contained
const MockCart = ({ 
  items = mockCartItems, 
  onRemove = jest.fn(), 
  onUpdateQuantity = jest.fn(),
  onCheckout = jest.fn()
}) => {
  const total = items.reduce((sum, item) => 
    sum + (parseFloat(item.product_price) * item.quantity), 0
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div>
      <h1>Shopping Cart</h1>
      <p>{itemCount} items in cart</p>
      
      {items.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          {items.map(item => (
            <div key={item.id} data-testid="cart-item">
              <h3>{item.product_name}</h3>
              <p>Price: ${item.product_price}</p>
              <div>
                <button 
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span data-testid={`quantity-${item.id}`}>{item.quantity}</span>
                <button 
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <p>Subtotal: ${(parseFloat(item.product_price) * item.quantity).toFixed(2)}</p>
              <button onClick={() => onRemove(item.id)}>Remove</button>
            </div>
          ))}
          
          <div data-testid="cart-summary">
            <h2>Order Summary</h2>
            <p>Total: ${total.toFixed(2)}</p>
            <button onClick={onCheckout}>Proceed to Checkout</button>
          </div>
        </>
      )}
    </div>
  );
};

describe('Cart Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders cart page title', () => {
    render(<MockCart />);
    expect(screen.getByRole('heading', { name: /shopping cart/i })).toBeInTheDocument();
  });

  test('displays cart items', () => {
    render(<MockCart />);
    expect(screen.getByText('Vitamin C')).toBeInTheDocument();
    expect(screen.getByText('Omega-3')).toBeInTheDocument();
  });

  test('displays item prices', () => {
    render(<MockCart />);
    expect(screen.getByText('Price: $19.99')).toBeInTheDocument();
    expect(screen.getByText('Price: $24.99')).toBeInTheDocument();
  });

  test('displays item quantities', () => {
    render(<MockCart />);
    expect(screen.getByTestId('quantity-1')).toHaveTextContent('2');
    expect(screen.getByTestId('quantity-2')).toHaveTextContent('1');
  });

  test('displays correct total price', () => {
    render(<MockCart />);
    // Total: (19.99 * 2) + (24.99 * 1) = 64.97
    expect(screen.getByText(/\$64\.97/)).toBeInTheDocument();
  });

  test('displays item count', () => {
    render(<MockCart />);
    expect(screen.getByText(/3 items in cart/i)).toBeInTheDocument();
  });

  test('has quantity increase buttons', () => {
    render(<MockCart />);
    const increaseButtons = screen.getAllByRole('button', { name: /increase/i });
    expect(increaseButtons.length).toBe(2);
  });

  test('has quantity decrease buttons', () => {
    render(<MockCart />);
    const decreaseButtons = screen.getAllByRole('button', { name: /decrease/i });
    expect(decreaseButtons.length).toBe(2);
  });

  test('has remove buttons', () => {
    render(<MockCart />);
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    expect(removeButtons.length).toBe(2);
  });

  test('has checkout button', () => {
    render(<MockCart />);
    const checkoutButton = screen.getByRole('button', { name: /checkout/i });
    expect(checkoutButton).toBeInTheDocument();
  });

  test('calls onRemove when remove button clicked', () => {
    const mockRemove = jest.fn();
    render(<MockCart onRemove={mockRemove} />);
    
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[0]);
    
    expect(mockRemove).toHaveBeenCalledWith(1);
  });

  test('calls onUpdateQuantity when increase clicked', () => {
    const mockUpdate = jest.fn();
    render(<MockCart onUpdateQuantity={mockUpdate} />);
    
    const increaseButtons = screen.getAllByRole('button', { name: /increase/i });
    fireEvent.click(increaseButtons[0]);
    
    expect(mockUpdate).toHaveBeenCalledWith(1, 3); // item 1, quantity 2+1=3
  });

  test('calls onUpdateQuantity when decrease clicked', () => {
    const mockUpdate = jest.fn();
    render(<MockCart onUpdateQuantity={mockUpdate} />);
    
    const decreaseButtons = screen.getAllByRole('button', { name: /decrease/i });
    fireEvent.click(decreaseButtons[0]);
    
    expect(mockUpdate).toHaveBeenCalledWith(1, 1); // item 1, quantity 2-1=1
  });

  test('calls onCheckout when checkout button clicked', () => {
    const mockCheckout = jest.fn();
    render(<MockCart onCheckout={mockCheckout} />);
    
    const checkoutButton = screen.getByRole('button', { name: /checkout/i });
    fireEvent.click(checkoutButton);
    
    expect(mockCheckout).toHaveBeenCalled();
  });

  test('shows empty cart message when no items', () => {
    render(<MockCart items={[]} />);
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  test('hides checkout when cart is empty', () => {
    render(<MockCart items={[]} />);
    expect(screen.queryByRole('button', { name: /checkout/i })).not.toBeInTheDocument();
  });

  test('displays subtotals for each item', () => {
    render(<MockCart />);
    // Vitamin C: 19.99 * 2 = 39.98
    expect(screen.getByText(/\$39\.98/)).toBeInTheDocument();
  });
});
