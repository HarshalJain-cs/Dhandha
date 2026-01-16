import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { setUser, clearUser } from './store/slices/authSlice';
import Login from './pages/Login';
import LicenseActivation from './pages/LicenseActivation';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import MainLayout from './components/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { ProductList, ProductDetail, ProductForm } from './pages/products';
import Categories from './pages/Categories';
import Stones from './pages/Stones';
import MetalRates from './pages/MetalRates';
import Customers from './pages/Customers';
import CustomerList from './pages/Customers/CustomerList';
import CustomerDetail from './pages/Customers/CustomerDetail';
import CustomerForm from './pages/Customers/CustomerForm';
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
import UpdateNotification from './components/UpdateNotification';
import Reports from './pages/Reports'; // Import the new Reports component

/**
 * Main Application Component
 */
const App: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const [licenseValid, setLicenseValid] = useState<boolean | null>(null);
  const [licenseWarning, setLicenseWarning] = useState<string | null>(null);

  /**
   * Validate license on app load
   */
  useEffect(() => {
    const validateLicense = async () => {
      try {
        const result = await window.electronAPI.license.validate();

        if (result.valid) {
          setLicenseValid(true);
          setLicenseWarning(result.warningMessage || null);

          if (result.warningMessage) {
            console.warn('License warning:', result.warningMessage);
          }
        } else {
          setLicenseValid(false);
          console.warn('No valid license found:', result.error);
        }
      } catch (error) {
        console.error('License validation error:', error);
        setLicenseValid(false);
      }
    };

    validateLicense();
  }, []);

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

  // Show loading state while validating license
  if (licenseValid === null) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div className="spinner" style={{
          width: 50,
          height: 50,
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{ color: '#666' }}>Validating license...</div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If license is not valid, show activation page
  if (!licenseValid) {
    return (
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<LicenseActivation />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    );
  }

  // License is valid, show normal app
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <UpdateNotification />
        <Routes>
        {/* License Activation Route (accessible even if licensed) */}
        <Route path="/license-activation" element={<LicenseActivation />} />

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
                <CustomerList />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/customers/new"
          element={
            <PrivateRoute>
              <MainLayout>
                <CustomerForm />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/customers/edit/:id"
          element={
            <PrivateRoute>
              <MainLayout>
                <CustomerForm />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <PrivateRoute>
              <MainLayout>
                <CustomerDetail />
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

        {/* Reports Route */}
        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <MainLayout>
                <Reports />
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
    </ErrorBoundary>
  );
};

export default App;
