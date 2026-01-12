import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
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
        
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    if (error.response) {
      const errorMessage = error.response.data?.error || 
                          error.response.data?.detail || 
                          error.response.data?.message ||
                          'An error occurred';
      error.userMessage = errorMessage;
    } else if (error.request) {
      error.userMessage = 'Network error. Please check your connection.';
    } else {
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
  
  // Handle FormData for image upload
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/products/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/products/', data);
  },
  
  update: (id, data) => {
    if (data instanceof FormData) {
      return api.patch(`/products/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.patch(`/products/${id}/`, data);
  },
  
  delete: (id) => api.delete(`/products/${id}/`),
  getLowStock: () => api.get('/products/low_stock/'),
  removeImage: (id) => api.delete(`/products/${id}/remove_image/`),
};

export const medicalProfileAPI = {
  getMyProfile: () => api.get('/medical-profiles/my_profile/'),
  updateMyProfile: (data) => api.patch('/medical-profiles/my_profile/', data),
  getAll: () => api.get('/medical-profiles/'),
  getPatientHistory: (userId) => api.get(`/medical-profiles/patient/${userId}/`),
  getFullHistory: (profileId) => api.get(`/medical-profiles/${profileId}/full_history/`),
};

export const allergyAPI = {
  getAll: () => api.get('/allergies/'),
  getByPatient: (patientId) => api.get(`/allergies/?patient=${patientId}`),
  create: (data) => api.post('/allergies/', data),
  update: (id, data) => api.patch(`/allergies/${id}/`, data),
  delete: (id) => api.delete(`/allergies/${id}/`),
  checkDrug: (drugName, patientId = null) => {
    let url = `/allergies/check_drug/?drug=${drugName}`;
    if (patientId) url += `&patient=${patientId}`;
    return api.get(url);
  },
};

export const chronicConditionAPI = {
  getAll: () => api.get('/chronic-conditions/'),
  getByPatient: (patientId) => api.get(`/chronic-conditions/?patient=${patientId}`),
  create: (data) => api.post('/chronic-conditions/', data),
  update: (id, data) => api.patch(`/chronic-conditions/${id}/`, data),
  delete: (id) => api.delete(`/chronic-conditions/${id}/`),
};

export const currentMedicationAPI = {
  getAll: () => api.get('/current-medications/'),
  getByPatient: (patientId) => api.get(`/current-medications/?patient=${patientId}`),
  create: (data) => api.post('/current-medications/', data),
  update: (id, data) => api.patch(`/current-medications/${id}/`, data),
  delete: (id) => api.delete(`/current-medications/${id}/`),
};

export const medicalNoteAPI = {
  getAll: () => api.get('/medical-notes/'),
  getByPatient: (patientId) => api.get(`/medical-notes/?patient=${patientId}`),
  create: (data) => api.post('/medical-notes/', data),
  update: (id, data) => api.patch(`/medical-notes/${id}/`, data),
  delete: (id) => api.delete(`/medical-notes/${id}/`),
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
  delete: (id) => api.delete(`/orders/${id}/`),
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
  delete: (id) => api.delete(`/questions/${id}/`),
};

export const patientRecordAPI = {
  getAll: () => api.get('/patient-records/'),
  create: (data) => api.post('/patient-records/', data),
  delete: (id) => api.delete(`/patient-records/${id}/`),
};

export const stockRequestAPI = {
  getAll: () => api.get('/stock-requests/'),
  create: (data) => api.post('/stock-requests/', data),
  approve: (id) => api.post(`/stock-requests/${id}/approve/`),
  reject: (id) => api.post(`/stock-requests/${id}/reject/`),
  delete: (id) => api.delete(`/stock-requests/${id}/`),
};

export const chatAPI = {
  getMessages: () => api.get('/chat/'),
  sendMessage: (data) => api.post('/chat/', data),
  deleteMessage: (id) => api.delete(`/chat/${id}/`),
  clearHistory: (all = false) => api.delete(`/chat/clear_history/${all ? '?all=true' : ''}`),
};