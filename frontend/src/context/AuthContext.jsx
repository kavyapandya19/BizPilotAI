import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set default axios header if token exists
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      fetchUser();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      // In a real app, hit the /api/auth/me endpoint
      // For this scaffold, we'll mock a successful fetch if a token exists
      // const res = await axios.get('/api/auth/me');
      // setUser(res.data.data);
      
      // Mock user for UI development
      setUser({
        name: 'Admin User',
        email: 'admin@bizpilot.ai',
        role: 'admin',
        business: { name: 'Acme Corp' }
      });
    } catch (error) {
      console.error('Error fetching user', error);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // Mock login for UI development
      if (email === 'admin@bizpilot.ai' && password === 'password') {
        const mockToken = 'mock_jwt_token_12345';
        setToken(mockToken);
        return { success: true };
      }
      return { success: false, message: 'Invalid credentials' };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
