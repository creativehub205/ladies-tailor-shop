import React, { createContext, useState, useEffect } from 'react';

// Simple in-memory storage fallback
const memoryStorage = {
  data: {},
  getItemAsync: async (key) => {
    return memoryStorage.data[key] || null;
  },
  setItemAsync: async (key, value) => {
    memoryStorage.data[key] = value;
  },
  deleteItemAsync: async (key) => {
    delete memoryStorage.data[key];
  }
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkLoginStatus = async () => {
    try {
      const token = await memoryStorage.getItemAsync('userToken');
      setUserToken(token);
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token) => {
    try {
      await memoryStorage.setItemAsync('userToken', token);
      setUserToken(token);
    } catch (error) {
      console.error('Error saving token:', error);
      setUserToken(token); // Still set token even if storage fails
    }
  };

  const logout = async () => {
    try {
      await memoryStorage.deleteItemAsync('userToken');
      await memoryStorage.deleteItemAsync('tailorData');
      // Clear API token as well
      const { clearAuthToken } = await import('../services/api');
      clearAuthToken();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
    setUserToken(null);
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ userToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
