import React, { useState, useEffect } from 'react';
import { cartAPI, orderAPI } from '../services/api';
import { FiTrash2, FiShoppingBag, FiMinus, FiPlus, FiCreditCard, FiTruck, FiShield, FiPackage, FiImage } from 'react-icons/fi';
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
    <div className="min-h-screen bg-slate-50">
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
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-700"></div>
        <div className="absolute inset-0 pattern-pharmacy opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 container mx-auto px-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <FiShoppingBag className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold text-white">Shopping Cart</h1>
              <p className="text-white/60">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">Loading cart...</p>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-soft border border-slate-100">
            <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FiShoppingBag className="text-slate-400" size={40} />
            </div>
            <h3 className="text-2xl font-display font-bold text-slate-800 mb-2">Your cart is empty</h3>
            <p className="text-slate-500 mb-8">Add some products to get started!</p>
            <a
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-glow transition-all"
            >
              <FiPackage /> Browse Products
            </a>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-2xl shadow-soft p-6 flex flex-col sm:flex-row gap-5 hover:shadow-soft-xl transition-all duration-300 border border-slate-100 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Product Image */}
                  <div className="w-full sm:w-32 h-32 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl overflow-hidden flex-shrink-0 relative">
                    {item.product_image ? (
                      <img 
                        src={item.product_image.startsWith('http') ? item.product_image : `http://localhost:8000${item.product_image}`}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://via.placeholder.com/150/e0f2fe/0d9488?text=${encodeURIComponent(item.product_name)}`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-teal-600/40">
                        <FiImage size={32} className="mb-1" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">No Photo</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-lg text-slate-800 mb-1">{item.product_name}</h3>
                    <p className="text-slate-500 text-sm mb-4">🏭 {item.product_manufacturer}</p>
                    
                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                          disabled={item.quantity <= 1}
                          className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiMinus size={16} />
                        </button>
                        <span className="w-14 text-center font-bold text-lg text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                          className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-colors"
                        >
                          <FiPlus size={16} />
                        </button>
                      </div>
                      
                      {/* Price */}
                      <div className="text-right">
                        <p className="text-2xl font-display font-bold text-teal-600">
                          ${(item.product_price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-500">${item.product_price} each</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item.id, item.product_name)}
                    className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all self-start"
                  >
                    <FiTrash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-soft p-6 sticky top-24 border border-slate-100">
                <h2 className="text-xl font-display font-bold text-slate-800 mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span className="font-semibold">${calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping</span>
                    <span className="text-emerald-600 font-semibold">Free</span>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-display font-bold text-slate-800">Total</span>
                      <span className="text-3xl font-display font-bold text-teal-600">
                        ${calculateTotal()}
                      </span>
                    </div>
                  </div>
                </div>

                {!showCheckout ? (
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold text-lg hover:shadow-glow transition-all flex items-center justify-center gap-2"
                  >
                    <FiCreditCard size={20} /> Proceed to Checkout
                  </button>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Shipping Address</label>
                      <textarea
                        className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none transition-all"
                        rows="3"
                        placeholder="Enter your delivery address"
                        value={checkoutForm.shipping_address}
                        onChange={(e) => setCheckoutForm({...checkoutForm, shipping_address: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
                      <select
                        className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white"
                        value={checkoutForm.payment_method}
                        onChange={(e) => setCheckoutForm({...checkoutForm, payment_method: e.target.value})}
                      >
                        <option value="cash">💵 Cash on Delivery</option>
                        <option value="card">💳 Credit/Debit Card</option>
                      </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setShowCheckout(false)}
                        className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCheckout}
                        className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
                      >
                        Place Order
                      </button>
                    </div>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="group">
                      <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                        <FiTruck className="text-teal-600" size={22} />
                      </div>
                      <p className="text-xs text-slate-600 font-medium">Free Shipping</p>
                    </div>
                    <div className="group">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                        <FiShield className="text-emerald-600" size={22} />
                      </div>
                      <p className="text-xs text-slate-600 font-medium">Secure Pay</p>
                    </div>
                    <div className="group">
                      <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                        <span className="text-xl">💊</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">Quality</p>
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
