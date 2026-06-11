import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './components/NavBar';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MenuPage from './pages/MenuPage';
import BookTablePage from './pages/BookTablePage';
import CustomerDashboard from './pages/CustomerDashboard';
import ChefDashboard from './pages/ChefDashboard';
import CashierDashboard from './pages/CashierDashboard';
import CashierNewOrder from './pages/CashierNewOrder';
import BranchManagerDashboard from './pages/BranchManagerDashboard';
import HQDashboard from './pages/HQDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/branches" element={<MenuPage />} />
          <Route path="/book" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><BookTablePage /></ProtectedRoute>} />
          <Route path="/customer" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/chef" element={<ProtectedRoute allowedRoles={['CHEF']}><ChefDashboard /></ProtectedRoute>} />
          <Route path="/cashier" element={<ProtectedRoute allowedRoles={['CASHIER']}><CashierDashboard /></ProtectedRoute>} />
          <Route path="/cashier/new" element={<ProtectedRoute allowedRoles={['CASHIER']}><CashierNewOrder /></ProtectedRoute>} />
          <Route path="/branch-manager" element={<ProtectedRoute allowedRoles={['BRANCH_MANAGER']}><BranchManagerDashboard /></ProtectedRoute>} />
          <Route path="/hq" element={<ProtectedRoute allowedRoles={['HQ_MANAGER', 'ADMIN']}><HQDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
