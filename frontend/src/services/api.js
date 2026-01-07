import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        // No refresh token, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/token/refresh/`, {
          refresh: refreshToken
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);
        
        processQueue(null, access);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response) {
      // Server responded with error
      const errorMessage = error.response.data?.error || 
                          error.response.data?.detail || 
                          error.response.data?.message ||
                          'An error occurred';
      error.userMessage = errorMessage;
    } else if (error.request) {
      // Request made but no response
      error.userMessage = 'Network error. Please check your connection.';
    } else {
      // Something else happened
      error.userMessage = 'An unexpected error occurred.';
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/users/login/', credentials),
  signup: (data) => api.post('/users/', data),
  changePassword: (data) => api.post('/users/change_password/', data),
  refreshToken: (refresh) => api.post('/token/refresh/', { refresh }),
};

export const userAPI = {
  getProfile: (id) => api.get(`/users/${id}/`),
  updateProfile: (id, data) => api.patch(`/users/${id}/`, data),
  getAllUsers: () => api.get('/users/'),
  createUser: (data) => api.post('/users/', data),
  deleteUser: (id) => api.delete(`/users/${id}/`),
};

export const categoryAPI = {
  getAll: () => api.get('/categories/'),
  getOne: (id) => api.get(`/categories/${id}/`),
  create: (data) => api.post('/categories/', data),
  update: (id, data) => api.patch(`/categories/${id}/`, data),
  delete: (id) => api.delete(`/categories/${id}/`),
};

export const productAPI = {
  getAll: () => api.get('/products/'),
  search: (query) => api.get(`/products/search/?q=${query}`),
  getOne: (id) => api.get(`/products/${id}/`),
  create: (data) => api.post('/products/', data),
  update: (id, data) => api.patch(`/products/${id}/`, data),
  delete: (id) => api.delete(`/products/${id}/`),
  getLowStock: () => api.get('/products/low_stock/'),
};

export const batchAPI = {
  getAll: () => api.get('/product-batches/'),
  getByProduct: (productId) => api.get(`/product-batches/?product=${productId}`),
  create: (data) => api.post('/product-batches/', data),
  update: (id, data) => api.patch(`/product-batches/${id}/`, data),
  delete: (id) => api.delete(`/product-batches/${id}/`),
  getExpired: () => api.get('/product-batches/expired/'),
  getExpiringSoon: (days = 30) => api.get(`/product-batches/expiring_soon/?days=${days}`),
};

export const cartAPI = {
  getCart: () => api.get('/cart/'),
  addToCart: (data) => api.post('/cart/', data),
  updateCart: (id, data) => api.patch(`/cart/${id}/`, data),
  removeFromCart: (id) => api.delete(`/cart/${id}/`),
};

export const orderAPI = {
  getAll: () => api.get('/orders/'),
  getOne: (id) => api.get(`/orders/${id}/`),
  checkout: (data) => api.post('/orders/checkout/', data),
  approve: (id) => api.post(`/orders/${id}/approve/`),
  reject: (id) => api.post(`/orders/${id}/reject/`),
  cancel: (id) => api.post(`/orders/${id}/cancel/`),
  delete: (id) => api.delete(`/orders/${id}/`),  // NEW: Delete order
  addItem: (id, data) => api.post(`/orders/${id}/add_item/`, data),
  removeItem: (id, data) => api.post(`/orders/${id}/remove_item/`, data),
  updateItemQuantity: (id, data) => api.patch(`/orders/${id}/update_item_quantity/`, data),
  updateStatus: (id, data) => api.patch(`/orders/${id}/`, data),
};

export const questionAPI = {
  getAll: () => api.get('/questions/'),
  create: (data) => api.post('/questions/', data),
  answer: (id, data) => api.post(`/questions/${id}/answer/`, data),
  update: (id, data) => api.patch(`/questions/${id}/`, data),
  delete: (id) => api.delete(`/questions/${id}/`),  // NEW: Delete question
};

export const patientRecordAPI = {
  getAll: () => api.get('/patient-records/'),
  create: (data) => api.post('/patient-records/', data),
  delete: (id) => api.delete(`/patient-records/${id}/`),  // NEW: Delete patient record
};

export const stockRequestAPI = {
  getAll: () => api.get('/stock-requests/'),
  create: (data) => api.post('/stock-requests/', data),
  approve: (id) => api.post(`/stock-requests/${id}/approve/`),
  reject: (id) => api.post(`/stock-requests/${id}/reject/`),
  delete: (id) => api.delete(`/stock-requests/${id}/`),  // NEW: Delete stock request
};

export const chatAPI = {
  getMessages: () => api.get('/chat/'),
  sendMessage: (data) => api.post('/chat/', data),
  deleteMessage: (id) => api.delete(`/chat/${id}/`),  // NEW: Delete single chat message
  clearHistory: (all = false) => api.delete(`/chat/clear_history/${all ? '?all=true' : ''}`),  // NEW: Clear chat history
};
