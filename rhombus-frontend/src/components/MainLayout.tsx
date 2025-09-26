import React, { useState } from 'react';
import {
  Layout,
  Menu,
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Divider,
} from 'antd';
import {
  HomeOutlined,
  DatabaseOutlined,
  SettingOutlined,
  RobotOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import DataProcessing from './DataProcessing';

const { Header, Content, Sider } = Layout;
const { Title, Paragraph } = Typography;

type PageType = 'home' | 'processing' | 'settings';

const MainLayout: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [siderCollapsed, setSiderCollapsed] = useState(false);

  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: 'Home',
    },
    {
      key: 'processing',
      icon: <DatabaseOutlined />,
      label: 'Data Processing',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'processing':
        return <DataProcessing />;
      case 'settings':
        return <div>Settings Page Coming Soon...</div>;
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Sider
        collapsible
        collapsed={siderCollapsed}
        onCollapse={setSiderCollapsed}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: 'none',
        }}
        theme="light"
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <RobotOutlined style={{ fontSize: '24px', color: '#667eea' }} />
          {!siderCollapsed && (
            <span style={{
              marginLeft: 12,
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#667eea'
            }}>
              Rhombus AI
            </span>
          )}
        </div>
        <Menu
          theme="light"
          selectedKeys={[currentPage]}
          items={menuItems}
          onClick={({ key }) => setCurrentPage(key as PageType)}
          style={{
            background: 'transparent',
            border: 'none',
          }}
        />
      </Sider>

      <Layout style={{ background: 'transparent' }}>
        <Header style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Title level={3} style={{ margin: 0, color: 'white' }}>
            🔍 Smart Regex Pattern Matcher
          </Title>
          <Button
            type="primary"
            ghost
            icon={<ThunderboltOutlined />}
            style={{ borderColor: 'white', color: 'white' }}
          >
            Quick Start
          </Button>
        </Header>

        <Content style={{
          margin: '24px',
          background: 'transparent',
          overflow: 'auto'
        }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

// Home Page Component
const HomePage: React.FC<{ onNavigate: (page: PageType) => void }> = ({ onNavigate }) => {
  return (
    <div>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card className="glass-card" style={{ textAlign: 'center', marginBottom: 24 }}>
            <Space direction="vertical" size="large">
              <div>
                <RobotOutlined style={{ fontSize: '64px', color: '#667eea' }} />
              </div>
              <Title level={1} style={{ margin: 0 }}>
                Welcome to Rhombus AI
              </Title>
              <Paragraph style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                Transform your data with intelligent regex pattern matching.
                Upload files, describe patterns in natural language, and let AI do the rest.
              </Paragraph>
              <Button
                type="primary"
                size="large"
                icon={<DatabaseOutlined />}
                onClick={() => onNavigate('processing')}
                style={{ height: '48px', fontSize: '16px' }}
              >
                Start Processing Data
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card className="glass-card" hoverable>
            <Space direction="vertical" align="center">
              <FileTextOutlined style={{ fontSize: '48px', color: '#667eea' }} />
              <Title level={4}>Smart File Upload</Title>
              <Paragraph style={{ textAlign: 'center' }}>
                Support for CSV, Excel, JSON, TXT, and TSV files with intelligent
                column compatibility checking.
              </Paragraph>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="glass-card" hoverable>
            <Space direction="vertical" align="center">
              <RobotOutlined style={{ fontSize: '48px', color: '#667eea' }} />
              <Title level={4}>AI-Powered Patterns</Title>
              <Paragraph style={{ textAlign: 'center' }}>
                Describe what you want to find in natural language.
                Our AI converts it to precise regex patterns.
              </Paragraph>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="glass-card" hoverable>
            <Space direction="vertical" align="center">
              <ThunderboltOutlined style={{ fontSize: '48px', color: '#667eea' }} />
              <Title level={4}>Instant Processing</Title>
              <Paragraph style={{ textAlign: 'center' }}>
                Apply pattern matching across all text columns with
                real-time feedback and detailed results.
              </Paragraph>
            </Space>
          </Card>
        </Col>
      </Row>

      <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.3)', margin: '48px 0' }} />

      <Row>
        <Col span={24}>
          <Card className="glass-card">
            <Title level={3}>Key Features</Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Space>
                  ✅ <strong>Different Modes Support</strong> - You can enter text directly or upload files
                </Space>
              </Col>
              <Col xs={24} sm={12}>
                <Space>
                  ✅ <strong>Smart Column Analysis</strong> - Automatic compatibility checking
                </Space>
              </Col>
              <Col xs={24} sm={12}>
                <Space>
                  ✅ <strong>Natural Language</strong> - Describe patterns in plain English
                </Space>
              </Col>
              <Col xs={24} sm={12}>
                <Space>
                  ✅ <strong>Real-time Preview</strong> - See results before processing
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MainLayout;