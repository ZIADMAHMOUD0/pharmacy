import React, { useState, useEffect, useCallback } from 'react';
import { productAPI, cartAPI, categoryAPI } from '../services/api';
import { FiShoppingCart, FiSearch, FiLoader, FiFilter, FiX, FiHeart, FiPackage, FiImage, FiAlertTriangle, FiGrid, FiList } from 'react-icons/fi';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [allergyWarning, setAllergyWarning] = useState({ show: false, product: null, matchingAllergies: [], activeIngredient: '' });
  const toast = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAll();
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    if (products.length === 0) {
      setFilteredProducts([]);
      return;
    }

    let filtered = products;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.category === parseInt(selectedCategory)
      );
    }

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(product => {
        const name = product.name ? product.name.toLowerCase() : '';
        const categoryName = product.category_name ? product.category_name.toLowerCase() : '';
        const manufacturer = product.manufacturer ? product.manufacturer.toLowerCase() : '';
        const description = product.description ? product.description.toLowerCase() : '';
        const query = searchQuery.toLowerCase();

        return name.includes(query) ||
               categoryName.includes(query) ||
               manufacturer.includes(query) ||
               description.includes(query);
      });
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const addToCart = async (productId, forceAdd = false) => {
    const product = products.find(p => p.id === productId);
    
    if (!forceAdd && product) {
      try {
        const response = await cartAPI.checkAllergy(productId);
        if (response.data.has_allergy) {
          setAllergyWarning({
            show: true,
            product: product,
            matchingAllergies: response.data.allergies,
            activeIngredient: response.data.active_ingredient
          });
          return;
        }
      } catch (error) {
        console.error('Error checking allergy:', error);
      }
    }
    
    try {
      setAddingToCart(prev => ({ ...prev, [productId]: true }));
      await cartAPI.addToCart({ product: productId, quantity: 1 });
      toast.success('Added to cart successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add item to cart');
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleConfirmAddToCart = async () => {
    if (allergyWarning.product) {
      await addToCart(allergyWarning.product.id, true);
    }
    setAllergyWarning({ show: false, product: null, matchingAllergies: [], activeIngredient: '' });
  };

  const getSeverityColor = (severity) => {
    const colors = {
      mild: 'bg-amber-50 text-amber-700 border-amber-200',
      moderate: 'bg-orange-50 text-orange-700 border-orange-200',
      severe: 'bg-rose-50 text-rose-700 border-rose-200',
      life_threatening: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[severity] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      
      {/* Allergy Warning Modal */}
      {allergyWarning.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <FiAlertTriangle className="text-rose-600" size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-rose-600">Allergy Warning!</h2>
                <p className="text-slate-500 text-sm">Potential allergen detected</p>
              </div>
            </div>
            
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-6">
              <p className="text-slate-700 mb-4">
                <strong className="text-slate-800">{allergyWarning.product?.name}</strong> contains ingredients you may be allergic to:
              </p>
              
              {(allergyWarning.activeIngredient || allergyWarning.product?.active_ingredient) && (
                <div className="bg-white border border-teal-200 rounded-xl p-4 mb-4">
                  <p className="text-teal-700 text-sm font-medium mb-1">💊 Active Ingredient</p>
                  <p className="text-teal-800 font-semibold">
                    {allergyWarning.activeIngredient || allergyWarning.product?.active_ingredient}
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                {allergyWarning.matchingAllergies.map((allergy, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${getSeverityColor(allergy.severity)}`}>
                    <div className="flex justify-between items-start">
                      <span className="font-semibold">{allergy.allergen}</span>
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/50">
                        {allergy.severity_display || allergy.severity}
                      </span>
                    </div>
                    {allergy.reaction && (
                      <p className="text-sm mt-2 opacity-80">Reaction: {allergy.reaction}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-slate-500 text-sm mb-6 flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              Please consult with a healthcare professional before using this product.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setAllergyWarning({ show: false, product: null, matchingAllergies: [], activeIngredient: '' })}
                className="flex-1 py-3.5 bg-slate-100 rounded-xl font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddToCart}
                className="flex-1 py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-semibold hover:from-rose-600 hover:to-rose-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30"
              >
                <FiShoppingCart size={18} />
                Add Anyway
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-700"></div>
        <div className="absolute inset-0 pattern-pharmacy opacity-10"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-10 right-20 w-40 h-40 bg-cyan-400/20 rounded-full blur-3xl animate-float animation-delay-1000"></div>
        
        <div className="relative z-10 container mx-auto px-6">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              {products.length} products available
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Our Products
            </h1>
            <p className="text-xl text-white/70 mb-8">
              Discover quality pharmaceutical products for your health needs
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
              <input
                type="text"
                placeholder="Search products, categories, manufacturers..."
                className="w-full pl-14 pr-14 py-4 bg-white rounded-2xl shadow-soft-xl text-slate-800 text-lg focus:outline-none focus:ring-4 focus:ring-teal-500/30 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1.5 transition-colors"
                >
                  <FiX size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-soft p-6 sticky top-24 border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-lg text-slate-800 flex items-center gap-2">
                  <FiFilter className="text-teal-600" /> Categories
                </h3>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full px-4 py-3.5 rounded-xl text-left font-medium transition-all duration-300 flex items-center justify-between ${
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>All Products</span>
                  <span className={`px-2.5 py-1 rounded-full text-sm font-semibold ${
                    selectedCategory === 'all' ? 'bg-white/20' : 'bg-white text-slate-600'
                  }`}>
                    {products.length}
                  </span>
                </button>
                
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id.toString())}
                    className={`w-full px-4 py-3.5 rounded-xl text-left font-medium transition-all duration-300 flex items-center justify-between ${
                      selectedCategory === category.id.toString()
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className={`px-2.5 py-1 rounded-full text-sm font-semibold ${
                      selectedCategory === category.id.toString() ? 'bg-white/20' : 'bg-white text-slate-600'
                    }`}>
                      {category.product_count || 0}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* Quick Stats */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h4 className="font-display font-semibold text-slate-800 mb-4">Quick Stats</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Total Products</span>
                    <span className="font-bold text-teal-600">{products.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Categories</span>
                    <span className="font-bold text-cyan-600">{categories.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">In Stock</span>
                    <span className="font-bold text-emerald-600">{products.filter(p => p.total_stock > 0).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6 bg-white rounded-2xl p-4 shadow-soft border border-slate-100">
              <p className="text-slate-600">
                Showing <span className="font-bold text-slate-800">{filteredProducts.length}</span> products
                {searchQuery && <span className="text-teal-600"> for "{searchQuery}"</span>}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-teal-100 text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <FiGrid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-teal-100 text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <FiList size={20} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-32">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-600 text-lg font-medium">Loading products...</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl shadow-soft border border-slate-100">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FiPackage className="text-slate-400" size={40} />
                </div>
                <h3 className="text-xl font-display font-semibold text-slate-800 mb-2">No products found</h3>
                <p className="text-slate-500 mb-6">Try adjusting your search or filter criteria</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-teal-500/30 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
                : 'space-y-4'
              }>
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    viewMode={viewMode}
                    addingToCart={addingToCart[product.id]}
                    onAddToCart={() => addToCart(product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, index, viewMode, addingToCart, onAddToCart }) => {
  if (viewMode === 'list') {
    return (
      <div className="group bg-white rounded-2xl shadow-soft hover:shadow-soft-xl transition-all duration-300 border border-slate-100 overflow-hidden flex">
        {/* Image */}
        <div className="relative w-48 h-48 flex-shrink-0 overflow-hidden bg-gradient-to-br from-teal-50 to-cyan-50">
          {product.image_url ? (
            <img 
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://via.placeholder.com/400x300/e0f2fe/0d9488?text=${encodeURIComponent(product.name)}`;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <FiImage size={40} />
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.requires_prescription && (
              <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                ℞ Rx
              </span>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            {product.category_name && (
              <span className="inline-block bg-teal-50 text-teal-700 text-xs font-semibold px-3 py-1 rounded-full mb-2">
                {product.category_name}
              </span>
            )}
            <h3 className="font-display font-bold text-lg text-slate-800 mb-1">{product.name}</h3>
            <p className="text-sm text-slate-500 mb-2">🏭 {product.manufacturer}</p>
            <p className="text-sm text-slate-600 line-clamp-2">{product.description}</p>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <div>
              <p className="text-2xl font-display font-bold text-teal-600">${product.price}</p>
              <StockIndicator stock={product.total_stock} />
            </div>
            <button
              onClick={onAddToCart}
              disabled={!product.total_stock || addingToCart}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-teal-500/30 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
            >
              {addingToCart ? (
                <FiLoader className="animate-spin" size={18} />
              ) : (
                <>
                  <FiShoppingCart size={18} />
                  Add
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group bg-white rounded-2xl shadow-soft hover:shadow-soft-xl overflow-hidden transition-all duration-500 hover:-translate-y-2 border border-slate-100"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-teal-50 to-cyan-50">
        {product.image_url ? (
          <img 
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://via.placeholder.com/400x300/e0f2fe/0d9488?text=${encodeURIComponent(product.name)}`;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <div className="text-center">
              <FiImage size={48} className="mx-auto mb-2" />
              <p className="text-sm">No Image</p>
            </div>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.requires_prescription && (
            <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              ℞ Prescription
            </span>
          )}
          {product.total_stock <= 5 && product.total_stock > 0 && (
            <span className="bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
              Low Stock
            </span>
          )}
          {product.total_stock === 0 && (
            <span className="bg-slate-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              Out of Stock
            </span>
          )}
        </div>
        
        {/* Wishlist */}
        <button className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-white transition-all shadow-lg opacity-0 group-hover:opacity-100">
          <FiHeart size={20} />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-5">
        {product.category_name && (
          <span className="inline-block bg-teal-50 text-teal-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            {product.category_name}
          </span>
        )}
        
        <h3 className="font-display font-bold text-lg text-slate-800 mb-2 line-clamp-1 group-hover:text-teal-600 transition-colors">
          {product.name}
        </h3>
        
        <p className="text-sm text-slate-500 mb-1">🏭 {product.manufacturer}</p>
        {product.active_ingredient && (
          <p className="text-sm text-teal-600 mb-1 flex items-center gap-1">
            💊 <span className="font-medium">{product.active_ingredient}</span>
          </p>
        )}
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{product.description}</p>
        
        {/* Stock */}
        <div className="mb-4">
          <StockIndicator stock={product.total_stock} />
        </div>
        
        {/* Price & Action */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <p className="text-2xl font-display font-bold text-teal-600">
            ${product.price}
          </p>
          
          <button
            onClick={onAddToCart}
            disabled={!product.total_stock || addingToCart}
            className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-teal-500/30 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
          >
            {addingToCart ? (
              <FiLoader className="animate-spin" size={18} />
            ) : (
              <>
                <FiShoppingCart size={18} />
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const StockIndicator = ({ stock }) => {
  if (stock > 5) {
    return (
      <span className="inline-flex items-center gap-2 text-emerald-600 text-sm font-medium">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
        In Stock
      </span>
    );
  } else if (stock > 0) {
    return (
      <span className="inline-flex items-center gap-2 text-amber-600 text-sm font-medium">
        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
        Only {stock} left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-rose-600 text-sm font-medium">
      <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
      Out of Stock
    </span>
  );
};

export default Products;
