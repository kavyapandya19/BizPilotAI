import React, { createContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const queryClient = useQueryClient();
  const userQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      return response.data.data;
    },
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
      queryClient.removeQueries({ queryKey: ['auth', 'me'] });
    }
  }, [queryClient, token]);

  useEffect(() => {
    if (userQuery.isError) {
      setToken(null);
    }
  }, [userQuery.isError]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: nextToken, user } = response.data;
      setToken(nextToken);
      queryClient.setQueryData(['auth', 'me'], user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    setToken(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user: userQuery.data || null, token, loading: Boolean(token) && userQuery.isPending, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
