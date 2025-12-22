import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { setUser, clearUser } from './store/slices/authSlice';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';

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
              <Dashboard />
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
