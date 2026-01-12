import React, { useState, useEffect, useCallback } from 'react';
import { productAPI, cartAPI, categoryAPI } from '../services/api';
import { FiShoppingCart, FiSearch, FiLoader, FiFilter, FiX, FiHeart, FiPackage, FiImage } from 'react-icons/fi';
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

  const addToCart = async (productId) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-20 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Products</h1>
            <p className="text-xl text-white/80 mb-8">Discover quality pharmaceutical products for your health needs</p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
              <input
                type="text"
                placeholder="Search products, categories, manufacturers..."
                className="w-full pl-14 pr-14 py-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl text-lg focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"
                >
                  <FiX size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <FiFilter className="text-blue-600" /> Categories
                </h3>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full px-4 py-3 rounded-xl text-left font-medium transition-all duration-300 flex items-center justify-between ${
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>All Products</span>
                  <span className={`px-2 py-0.5 rounded-full text-sm ${selectedCategory === 'all' ? 'bg-white/20' : 'bg-gray-200'}`}>
                    {products.length}
                  </span>
                </button>
                
                {categories.map((category, index) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id.toString())}
                    className={`w-full px-4 py-3 rounded-xl text-left font-medium transition-all duration-300 flex items-center justify-between ${
                      selectedCategory === category.id.toString()
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-sm ${selectedCategory === category.id.toString() ? 'bg-white/20' : 'bg-gray-200'}`}>
                      {category.product_count || 0}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* Quick Stats */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="font-semibold text-gray-800 mb-4">Quick Stats</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Products</span>
                    <span className="font-bold text-blue-600">{products.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Categories</span>
                    <span className="font-bold text-purple-600">{categories.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">In Stock</span>
                    <span className="font-bold text-green-600">{products.filter(p => p.total_stock > 0).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 shadow-sm">
              <p className="text-gray-600">
                Showing <span className="font-bold text-gray-800">{filteredProducts.length}</span> products
                {searchQuery && <span className="text-blue-600"> for "{searchQuery}"</span>}
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-32">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 text-lg">Loading products...</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
                <FiPackage className="mx-auto mb-4 text-gray-300" size={64} />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                  <div 
                    key={product.id} 
                    className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
                      {product.image_url ? (
                        <img 
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://via.placeholder.com/400x300/e0e7ff/4f46e5?text=${encodeURIComponent(product.name)}`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <FiImage size={48} className="mx-auto mb-2" />
                            <p className="text-sm">No Image</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.requires_prescription && (
                          <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            ℞ Prescription
                          </span>
                        )}
                        {product.total_stock <= 5 && product.total_stock > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                            Low Stock
                          </span>
                        )}
                        {product.total_stock === 0 && (
                          <span className="bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      
                      {/* Wishlist */}
                      <button className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-all shadow-lg opacity-0 group-hover:opacity-100">
                        <FiHeart size={20} />
                      </button>
                    </div>
                    
                    {/* Content */}
                    <div className="p-5">
                      {product.category_name && (
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                          {product.category_name}
                        </span>
                      )}
                      
                      <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      {product.active_ingredient && (
                        <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">Active ingredient:</span>{" "}
                    {product.active_ingredient}
                    </p>
                    )}
                      
                      <p className="text-sm text-gray-500 mb-1">🏭 {product.manufacturer}</p>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                      
                      {/* Stock */}
                      <div className="mb-4">
                        {product.total_stock > 0 ? (
                          <span className="inline-flex items-center gap-2 text-green-600 text-sm font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            In Stock 
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-red-600 text-sm font-medium">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Out of Stock
                          </span>
                        )}
                      </div>
                      
                      {/* Price & Action */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          ${product.price}
                        </p>
                        
                        <button
                          onClick={() => addToCart(product.id)}
                          disabled={!product.total_stock || addingToCart[product.id]}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                        >
                          {addingToCart[product.id] ? (
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
