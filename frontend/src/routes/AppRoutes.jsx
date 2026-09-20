import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Analytics from '../pages/Analytics';
import AIAssistant from '../pages/AIAssistant';
import Inventory from '../pages/Inventory';
import Customers from '../pages/Customers';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes inside the Layout */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
