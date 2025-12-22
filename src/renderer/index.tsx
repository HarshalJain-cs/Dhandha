import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import { store } from './store';
import App from './App';
import './styles/index.css';

/**
 * Ant Design Theme Configuration
 */
const theme = {
  token: {
    colorPrimary: '#d4af37', // Gold color for jewellery theme
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    colorInfo: '#1890ff',
    borderRadius: 6,
    fontSize: 14,
  },
};

/**
 * Root React Component
 */
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider theme={theme}>
        <App />
      </ConfigProvider>
    </Provider>
  </React.StrictMode>
);
