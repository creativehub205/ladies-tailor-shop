import axios from 'axios';
import { API_BASE_URL } from '../utils/config';

// Simple in-memory storage for token
let memoryToken = null;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = memoryToken; // Use in-memory token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  } catch (error) {
    console.error('Error in request interceptor:', error);
    return config;
  }
});

// Export functions to manage token
export const setAuthToken = (token) => {
  memoryToken = token;
};

export const getAuthToken = () => {
  return memoryToken;
};

export const clearAuthToken = () => {
  memoryToken = null;
};

export const authAPI = {
  login: async (username, password) => {
    try {
      const response = await api.post('/login', { username, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Login failed' };
    }
  },
};

export const customerAPI = {
  getCustomers: async (search = '') => {
    try {
      const response = await api.get('/customers', { params: { search } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch customers' };
    }
  },

  getCustomerById: async (customerId) => {
    try {
      const response = await api.get(`/customers/${customerId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch customer details' };
    }
  },

  addCustomer: async (customerData) => {
    try {
      const response = await api.post('/customers', customerData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to add customer' };
    }
  },

  updateCustomer: async (customerId, customerData) => {
    try {
      const response = await api.put(`/customers/${customerId}`, customerData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update customer' };
    }
  },

  deleteCustomer: async (customerId) => {
    try {
      const response = await api.delete(`/customers/${customerId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to delete customer' };
    }
  },
};

export const orderAPI = {
  getOrders: async (search = '') => {
    try {
      const response = await api.get('/orders', { params: { search } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch orders' };
    }
  },

  getOrderById: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch order details' };
    }
  },

  addOrder: async (orderData, imageUri) => {
    try {
      console.log('API addOrder called with:', { orderData, imageUri });
      
      const formData = new FormData();
      
      Object.keys(orderData).forEach(key => {
        if (key === 'measurements' || key === 'garment_types') {
          formData.append(key, JSON.stringify(orderData[key]));
        } else {
          formData.append(key, orderData[key]);
        }
      });

      if (imageUri) {
        console.log('Adding image to formData:', imageUri);
        
        // Better file type detection for React Native
        let fileType = 'jpeg';
        let fileName = 'design.jpg';
        
        if (imageUri.includes('.')) {
          const uriParts = imageUri.split('.');
          fileType = uriParts[uriParts.length - 1].toLowerCase();
          fileName = `design.${fileType}`;
        } else if (imageUri.includes('image/')) {
          // Handle case where URI might include mime type
          const mimeMatch = imageUri.match(/image\/(\w+)/);
          if (mimeMatch) {
            fileType = mimeMatch[1];
            fileName = `design.${fileType}`;
          }
        }
        
        // Ensure valid mime type
        const mimeType = `image/${fileType}`;
        
        console.log('Image details:', { fileName, fileType, mimeType });
        
        formData.append('design_image', {
          uri: imageUri,
          name: fileName,
          type: mimeType,
        });
      } else {
        console.log('No image URI provided');
      }

      console.log('Sending formData to backend...');
      const response = await api.post('/orders', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to create order' };
    }
  },

  createOrder: async (orderData, imageUri) => {
    return orderAPI.addOrder(orderData, imageUri);
  },

  updateOrder: async (orderId, orderData, imageUri) => {
    try {
      const formData = new FormData();
      
      Object.keys(orderData).forEach(key => {
        if (key === 'measurements' || key === 'garment_types') {
          formData.append(key, JSON.stringify(orderData[key]));
        } else {
          formData.append(key, orderData[key]);
        }
      });

      if (imageUri) {
        const uriParts = imageUri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        formData.append('design_image', {
          uri: imageUri,
          name: `design.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      const response = await api.put(`/orders/${orderId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update order' };
    }
  },

  deleteOrder: async (orderId) => {
    try {
      const response = await api.delete(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to delete order' };
    }
  },
};

export default api;
