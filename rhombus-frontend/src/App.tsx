import React from 'react';
import { ConfigProvider, Layout } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './components/MainLayout';
import './App.css';

const { Content } = Layout;

// Create a client
const queryClient = new QueryClient();

// Ant Design theme configuration
const theme = {
  token: {
    colorPrimary: '#667eea',
    colorBgBase: 'transparent',
    colorBgContainer: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
  },
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme}>
        <div className="app-container">
          {/* Background elements */}
          <div className="background-overlay"></div>
          <div className="geometric-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
            <div className="floating-elements">
              <div className="float-element float-1">📊</div>
              <div className="float-element float-2">🎯</div>
              <div className="float-element float-3">⚡</div>
              <div className="float-element float-4">🔍</div>
            </div>
          </div>

          {/* Main content */}
          <Layout className="main-layout">
            <Content>
              <MainLayout />
            </Content>
          </Layout>
        </div>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
