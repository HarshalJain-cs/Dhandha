import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { setUser, clearUser } from './store/slices/authSlice';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import MainLayout from './components/MainLayout';
import { ProductList, ProductDetail, ProductForm } from './pages/products';
import Categories from './pages/Categories';
import Stones from './pages/Stones';
import MetalRates from './pages/MetalRates';
import Customers from './pages/Customers';
import InvoiceList from './pages/InvoiceList';
import InvoiceCreate from './pages/InvoiceCreate';
import InvoiceDetail from './pages/InvoiceDetail';
import KarigarList from './pages/KarigarList';
import KarigarOrders from './pages/KarigarOrders';
import GoldLoanList from './pages/GoldLoanList';
import GoldLoanCreate from './pages/GoldLoanCreate';
import GoldLoanDetail from './pages/GoldLoanDetail';
import VendorList from './pages/VendorList';
import PurchaseOrderList from './pages/PurchaseOrderList';
import PurchaseOrderCreate from './pages/PurchaseOrderCreate';
import PurchaseOrderDetail from './pages/PurchaseOrderDetail';
import QuotationList from './pages/QuotationList';
import QuotationCreate from './pages/QuotationCreate';
import QuotationDetail from './pages/QuotationDetail';
import SalesReturnList from './pages/SalesReturnList';
import SalesReturnCreate from './pages/SalesReturnCreate';
import SalesReturnDetail from './pages/SalesReturnDetail';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';

/**
 * Main Application Component
 */
const App: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);

  /**
   * Validate token on app load
   */
  useEffect(() => {
    const validateToken = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const response = await window.electronAPI.auth.validateToken(savedToken);
          if (response.success && response.user) {
            dispatch(setUser({
              user: response.user,
              token: savedToken,
            }));
          } else {
            dispatch(clearUser());
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Token validation error:', error);
          dispatch(clearUser());
          localStorage.removeItem('token');
        }
      }
    };

    validateToken();
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Product Routes */}
        <Route
          path="/products"
          element={
            <PrivateRoute>
              <MainLayout>
                <ProductList />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/products/new"
          element={
            <PrivateRoute>
              <MainLayout>
                <ProductForm />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <PrivateRoute>
              <MainLayout>
                <ProductDetail />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <PrivateRoute>
              <MainLayout>
                <ProductForm />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Master Data Routes */}
        <Route
          path="/categories"
          element={
            <PrivateRoute>
              <MainLayout>
                <Categories />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/stones"
          element={
            <PrivateRoute>
              <MainLayout>
                <Stones />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/metal-rates"
          element={
            <PrivateRoute>
              <MainLayout>
                <MetalRates />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Customer Routes */}
        <Route
          path="/customers"
          element={
            <PrivateRoute>
              <MainLayout>
                <Customers />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Billing / Invoice Routes */}
        <Route
          path="/billing"
          element={
            <PrivateRoute>
              <MainLayout>
                <InvoiceList />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/billing/new"
          element={
            <PrivateRoute>
              <MainLayout>
                <InvoiceCreate />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/billing/:id"
          element={
            <PrivateRoute>
              <MainLayout>
                <InvoiceDetail />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Karigar Routes */}
        <Route
          path="/karigar/list"
          element={
            <PrivateRoute>
              <MainLayout>
                <KarigarList />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/karigar/orders"
          element={
            <PrivateRoute>
              <MainLayout>
                <KarigarOrders />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Gold Loan Routes */}
        <Route
          path="/gold-loans"
          element={
            <PrivateRoute>
              <MainLayout>
                <GoldLoanList />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/gold-loans/new"
          element={
            <PrivateRoute>
              <MainLayout>
                <GoldLoanCreate />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/gold-loans/:id"
          element={
            <PrivateRoute>
              <MainLayout>
                <GoldLoanDetail />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Vendor Routes */}
        <Route
          path="/vendors"
          element={
            <PrivateRoute>
              <MainLayout>
                <VendorList />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Purchase Order Routes */}
        <Route
          path="/purchase-orders"
          element={
            <PrivateRoute>
              <MainLayout>
                <PurchaseOrderList />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/purchase-orders/create"
          element={
            <PrivateRoute>
              <MainLayout>
                <PurchaseOrderCreate />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/purchase-orders/:id"
          element={
            <PrivateRoute>
              <MainLayout>
                <PurchaseOrderDetail />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Quotation Routes */}
        <Route
          path="/quotations"
          element={
            <PrivateRoute>
              <MainLayout>
                <QuotationList />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/quotations/create"
          element={
            <PrivateRoute>
              <MainLayout>
                <QuotationCreate />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/quotations/:id"
          element={
            <PrivateRoute>
              <MainLayout>
                <QuotationDetail />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Sales Return Routes */}
        <Route
          path="/sales-returns"
          element={
            <PrivateRoute>
              <MainLayout>
                <SalesReturnList />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/sales-returns/create"
          element={
            <PrivateRoute>
              <MainLayout>
                <SalesReturnCreate />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/sales-returns/:id"
          element={
            <PrivateRoute>
              <MainLayout>
                <SalesReturnDetail />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Audit Log Route */}
        <Route
          path="/audit-log"
          element={
            <PrivateRoute>
              <MainLayout>
                <AuditLog />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Settings Route */}
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <MainLayout>
                <Settings />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Default Route */}
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
        />

        {/* 404 Route */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
