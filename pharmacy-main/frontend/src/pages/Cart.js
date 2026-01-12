import React, { useState, useEffect } from 'react';
import { cartAPI, orderAPI } from '../services/api';
import { FiTrash2, FiShoppingBag, FiMinus, FiPlus, FiCreditCard, FiTruck, FiShield } from 'react-icons/fi';
import ConfirmModal from '../components/ConfirmModal';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutForm, setCheckoutForm] = useState({
    shipping_address: '',
    payment_method: 'cash'
  });
  const [showCheckout, setShowCheckout] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
  });
  const [actionLoading, setActionLoading] = useState(false);

  const toast = useToast();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setCartItems(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const closeConfirmModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
    setActionLoading(false);
  };

  const handleRemoveItem = (itemId, itemName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Item',
      message: `Remove "${itemName}" from your cart?`,
      type: 'warning',
      confirmText: 'Yes, Remove',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await cartAPI.removeFromCart(itemId);
          toast.success('Item removed from cart');
          fetchCart();
        } catch (error) {
          toast.error('Error removing item');
        } finally {
          closeConfirmModal();
        }
      },
    });
  };

  const handleUpdateQuantity = async (itemId, currentQty, change) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;

    try {
      await cartAPI.updateQuantity(itemId, { quantity: newQty });
      fetchCart();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error updating quantity');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0).toFixed(2);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.warning('Your cart is empty');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Order',
      message: `Place order for $${calculateTotal()}? Your order will be reviewed by our team.`,
      type: 'success',
      confirmText: 'Place Order',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await orderAPI.checkout(checkoutForm);
          toast.success('Order placed successfully!');
          setShowCheckout(false);
          fetchCart();
        } catch (error) {
          toast.error(error.response?.data?.error || 'Checkout failed');
        } finally {
          closeConfirmModal();
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        loading={actionLoading}
      />

      {/* Hero Section */}
      <section 
        className="relative py-12 overflow-hidden"
        style={{
          backgroundImage: 'url(/assets/images/pharmacy-bg.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/80"></div>
        <div className="relative z-10 container mx-auto px-6">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <FiShoppingBag size={36} /> Shopping Cart
          </h1>
          <p className="text-white/70">{cartItems.length} items in your cart</p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading cart...</p>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiShoppingBag className="text-gray-400" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">Add some products to get started!</p>
            <a
              href="/products"
              className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Browse Products
            </a>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-2xl shadow-lg p-6 flex flex-col sm:flex-row gap-4 hover:shadow-xl transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Product Image */}
                  <div className="w-full sm:w-32 h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl overflow-hidden flex-shrink-0">
                    <img 
                      src={item.product_image ? `http://localhost:8000${item.product_image}` : `https://via.placeholder.com/150/e0e7ff/4f46e5?text=${encodeURIComponent(item.product_name)}`}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800 mb-1">{item.product_name}</h3>
                    <p className="text-gray-500 text-sm mb-3">{item.product_manufacturer}</p>
                    
                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                          disabled={item.quantity <= 1}
                          className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                        >
                          <FiMinus size={16} />
                        </button>
                        <span className="w-12 text-center font-bold text-lg">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                          className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                        >
                          <FiPlus size={16} />
                        </button>
                      </div>
                      
                      {/* Price */}
                      <div className="text-right">
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          ${(item.product_price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">${item.product_price} each</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item.id, item.product_name)}
                    className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all self-start"
                  >
                    <FiTrash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>${calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-800">Total</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ${calculateTotal()}
                      </span>
                    </div>
                  </div>
                </div>

                {!showCheckout ? (
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <FiCreditCard /> Proceed to Checkout
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Shipping Address</label>
                      <textarea
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows="3"
                        placeholder="Enter your delivery address"
                        value={checkoutForm.shipping_address}
                        onChange={(e) => setCheckoutForm({...checkoutForm, shipping_address: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                      <select
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={checkoutForm.payment_method}
                        onChange={(e) => setCheckoutForm({...checkoutForm, payment_method: e.target.value})}
                      >
                        <option value="cash">Cash on Delivery</option>
                        <option value="card">Credit/Debit Card</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCheckout(false)}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCheckout}
                        className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        Place Order
                      </button>
                    </div>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <FiTruck className="mx-auto text-blue-600 mb-1" size={24} />
                      <p className="text-xs text-gray-600">Free Shipping</p>
                    </div>
                    <div>
                      <FiShield className="mx-auto text-green-600 mb-1" size={24} />
                      <p className="text-xs text-gray-600">Secure</p>
                    </div>
                    <div>
                      <span className="block text-2xl mb-1">💊</span>
                      <p className="text-xs text-gray-600">Quality</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
