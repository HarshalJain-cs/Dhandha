import React, { useState } from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUser, setLoading, setError } from '../store/slices/authSlice';

/**
 * Login Form Values Interface
 */
interface LoginFormValues {
  username: string;
  password: string;
}

/**
 * Login Page Component
 */
const Login: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoadingState] = useState(false);

  /**
   * Handle login form submission
   */
  const handleLogin = async (values: LoginFormValues) => {
    setLoadingState(true);
    dispatch(setLoading(true));

    try {
      const response = await window.electronAPI.auth.login(
        values.username,
        values.password
      );

      if (response.success && response.user && response.token) {
        // Save token to localStorage
        localStorage.setItem('token', response.token);

        // Update Redux store
        dispatch(setUser({
          user: response.user,
          token: response.token,
        }));

        message.success('Login successful!');
        navigate('/dashboard');
      } else {
        dispatch(setError(response.message));
        message.error(response.message || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = 'An error occurred during login';
      dispatch(setError(errorMessage));
      message.error(errorMessage);
      console.error('Login error:', error);
    } finally {
      setLoadingState(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-logo">
          <h1>Jewellery ERP</h1>
          <p>Complete Inventory Management System</p>
        </div>

        <Form
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: 'Please enter your username!' },
              { min: 3, message: 'Username must be at least 3 characters' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Username"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please enter your password!' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
            >
              Login
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center" style={{ marginTop: 16, color: '#666' }}>
          <p style={{ fontSize: 12 }}>
            Default credentials: admin / admin123
          </p>
          <p style={{ fontSize: 12, marginTop: 4 }}>
            Please change your password after first login
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
