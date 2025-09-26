import React, { useState, useEffect } from 'react';
import {
  Card,
  Upload,
  Button,
  Typography,
  Space,
  Alert,
  Row,
  Col,
  Divider,
  Switch,
  Modal,
  Tag,
} from 'antd';
import {
  UploadOutlined,
  BgColorsOutlined,
  EyeOutlined,
  DeleteOutlined,
  SettingOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface ThemeSettings {
  primaryColor: string;
  backgroundImage: string | null;
  backgroundOverlay: boolean;
  backgroundOpacity: number;
}

const Settings: React.FC = () => {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{
    name: string;
    size: number;
    dimensions: { width: number; height: number };
  } | null>(null);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    primaryColor: '#667eea',
    backgroundImage: null,
    backgroundOverlay: true,
    backgroundOpacity: 0.3,
  });
  const [previewVisible, setPreviewVisible] = useState(false);

  // Load saved settings on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('rhombus-theme-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setThemeSettings({
          primaryColor: settings.primaryColor || '#667eea',
          backgroundImage: settings.backgroundImage || null,
          backgroundOverlay: settings.backgroundOverlay !== false,
          backgroundOpacity: settings.backgroundOpacity || 0.3,
        });
        setBackgroundImage(settings.backgroundImage || null);
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Validate image file
  const validateImage = (file: File): Promise<{ valid: boolean; error?: string; dimensions?: { width: number; height: number } }> => {
    return new Promise((resolve) => {
      // Check file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        resolve({
          valid: false,
          error: 'Invalid file format. Please upload JPG, PNG, GIF, or WebP images only.',
        });
        return;
      }

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        resolve({
          valid: false,
          error: 'File size too large. Maximum size is 10MB.',
        });
        return;
      }

      // Check image dimensions
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;

        // Minimum resolution check
        if (width < 800 || height < 600) {
          resolve({
            valid: false,
            error: `Image resolution too low. Minimum resolution is 800x600. Current: ${width}x${height}`,
          });
          return;
        }

        // Maximum resolution check
        if (width > 4096 || height > 4096) {
          resolve({
            valid: false,
            error: `Image resolution too high. Maximum resolution is 4096x4096. Current: ${width}x${height}`,
          });
          return;
        }

        resolve({
          valid: true,
          dimensions: { width, height },
        });
      };

      img.onerror = () => {
        resolve({
          valid: false,
          error: 'Failed to load image. Please check if the file is a valid image.',
        });
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const showSuccessMessage = (msg: string) => {
    Modal.success({
      title: 'Success',
      content: String(msg),
    });
  };

  const showErrorMessage = (title: string, msg: string) => {
    Modal.error({
      title: String(title),
      content: String(msg),
    });
  };

  const handleImageUpload = async (file: File) => {
    try {
      const validation = await validateImage(file);

      if (!validation.valid) {
        showErrorMessage('Invalid Image', validation.error || 'Unknown error');
        return false;
      }

      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setBackgroundImage(base64);

        const dims = validation.dimensions!;
        setImageInfo({
          name: String(file.name),
          size: Number(file.size),
          dimensions: { width: Number(dims.width), height: Number(dims.height) },
        });

        const successMsg = `Background image uploaded successfully! Resolution: ${dims.width}x${dims.height}`;
        showSuccessMessage(successMsg);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showErrorMessage('Upload Error', 'Failed to process the image. Please try again.');
    }

    return false;
  };

  const handleRemoveImage = () => {
    Modal.confirm({
      title: 'Remove Background Image',
      content: 'Are you sure you want to remove the current background image?',
      okText: 'Remove',
      okType: 'danger',
      onOk: () => {
        setBackgroundImage(null);
        setImageInfo(null);
        showSuccessMessage('Background image removed successfully!');
      },
    });
  };

  const handlePrimaryColorChange = (color: string) => {
    setThemeSettings(prev => ({
      ...prev,
      primaryColor: color,
    }));
  };

  const handleOverlayChange = (checked: boolean) => {
    setThemeSettings(prev => ({
      ...prev,
      backgroundOverlay: checked,
    }));
  };

  const handleOpacityChange = (opacity: number) => {
    setThemeSettings(prev => ({
      ...prev,
      backgroundOpacity: opacity,
    }));
  };

  const applyThemeSettings = (settings: ThemeSettings) => {
    const root = document.documentElement;

    // Force clear existing properties first
    root.style.removeProperty('--primary-color');
    root.style.removeProperty('--background-image');
    root.style.removeProperty('--background-overlay');
    root.style.removeProperty('--background-opacity');

    // Force a reflow to ensure clearing is processed
    void root.offsetHeight;

    // Apply new theme properties
    root.style.setProperty('--primary-color', settings.primaryColor);

    if (settings.backgroundImage) {
      root.style.setProperty('--background-image', `url(${settings.backgroundImage})`);
      root.style.setProperty('--background-overlay', settings.backgroundOverlay ? 'block' : 'none');
      root.style.setProperty('--background-opacity', settings.backgroundOpacity.toString());
    } else {
      root.style.setProperty('--background-image', 'none');
      root.style.setProperty('--background-overlay', 'none');
      root.style.setProperty('--background-opacity', '0.3');
    }

    // Force repaint by temporarily changing a harmless property
    const appContainer = document.querySelector('.app-container') as HTMLElement;
    if (appContainer) {
      const originalTransform = appContainer.style.transform;
      appContainer.style.transform = 'translateZ(0)';
      void appContainer.offsetHeight;
      appContainer.style.transform = originalTransform;
    }

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('themeUpdated', { detail: settings }));
  };

  const handleSaveSettings = () => {
    const finalSettings: ThemeSettings = {
      primaryColor: themeSettings.primaryColor,
      backgroundImage: backgroundImage,
      backgroundOverlay: themeSettings.backgroundOverlay,
      backgroundOpacity: themeSettings.backgroundOpacity,
    };

    localStorage.setItem('rhombus-theme-settings', JSON.stringify(finalSettings));

    // Apply theme with forced rendering
    setTimeout(() => {
      applyThemeSettings(finalSettings);

      // Additional repaint trigger
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
      });
    }, 0);

    setThemeSettings(finalSettings);
    showSuccessMessage('Your theme settings have been saved and applied immediately!');
  };

  const handleResetSettings = () => {
    Modal.confirm({
      title: 'Reset to Default',
      content: 'Are you sure you want to reset all settings to default values?',
      okText: 'Reset',
      okType: 'danger',
      onOk: () => {
        const defaultSettings: ThemeSettings = {
          primaryColor: '#667eea',
          backgroundImage: null,
          backgroundOverlay: true,
          backgroundOpacity: 0.3,
        };

        setThemeSettings(defaultSettings);
        setBackgroundImage(null);
        setImageInfo(null);

        localStorage.removeItem('rhombus-theme-settings');

        // Reset CSS properties
        document.documentElement.style.removeProperty('--primary-color');
        document.documentElement.style.removeProperty('--background-image');
        document.documentElement.style.removeProperty('--background-overlay');
        document.documentElement.style.removeProperty('--background-opacity');

        showSuccessMessage('Settings reset to default values!');
      },
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadProps: UploadProps = {
    name: 'background',
    multiple: false,
    accept: 'image/*',
    beforeUpload: handleImageUpload,
    showUploadList: false,
  };

  return (
    <div>
      <Card className="glass-card" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          <SettingOutlined /> Theme Settings
        </Title>
        <Text type="secondary">
          Customize your application appearance with background images and color themes
        </Text>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Background Image Settings */}
        <Col xs={24} lg={12}>
          <Card className="glass-card">
            <Title level={3}>
              <PictureOutlined /> Background Image
            </Title>

            {!backgroundImage ? (
              <Dragger {...uploadProps} style={{ marginBottom: 16 }}>
                <p className="ant-upload-drag-icon">
                  <UploadOutlined style={{ fontSize: '48px', color: '#667eea' }} />
                </p>
                <p className="ant-upload-text">Click or drag image to upload</p>
                <p className="ant-upload-hint">
                  Supports JPG, PNG, GIF, WebP (800x600 - 4096x4096, Max: 10MB)
                </p>
              </Dragger>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  position: 'relative',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  marginBottom: 12,
                }}>
                  <img
                    src={backgroundImage}
                    alt="Background preview"
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                    }}
                  />
                </div>

                {imageInfo && (
                  <Space direction="vertical" style={{ width: '100%', marginBottom: 12 }}>
                    <div>
                      <Text strong>File: </Text>
                      <Text>{String(imageInfo.name)}</Text>
                    </div>
                    <div>
                      <Text strong>Size: </Text>
                      <Text>{formatFileSize(Number(imageInfo.size))}</Text>
                    </div>
                    <div>
                      <Text strong>Resolution: </Text>
                      <Tag color="blue">{Number(imageInfo.dimensions.width)}x{Number(imageInfo.dimensions.height)}</Tag>
                    </div>
                  </Space>
                )}

                <Space>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => setPreviewVisible(true)}
                  >
                    Preview
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleRemoveImage}
                  >
                    Remove
                  </Button>
                  <Upload {...uploadProps}>
                    <Button icon={<UploadOutlined />}>
                      Replace
                    </Button>
                  </Upload>
                </Space>
              </div>
            )}

            <Alert
              message="Image Requirements"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Formats: JPG, PNG, GIF, WebP</li>
                  <li>Resolution: 800x600 to 4096x4096 pixels</li>
                  <li>File size: Maximum 10MB</li>
                  <li>Recommended: High resolution for better quality</li>
                </ul>
              }
              type="info"
            />
          </Card>
        </Col>

        {/* Color Theme Settings */}
        <Col xs={24} lg={12}>
          <Card className="glass-card">
            <Title level={3}>
              <BgColorsOutlined /> Color Theme
            </Title>

            <div style={{ marginBottom: 24 }}>
              <Text strong>Primary Color</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 8 }}>
                <input
                  type="color"
                  value={String(themeSettings.primaryColor)}
                  onChange={(e) => handlePrimaryColorChange(String(e.target.value))}
                  style={{
                    width: '50px',
                    height: '40px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', color: '#666' }}>
                  Current: {String(themeSettings.primaryColor)}
                </span>
              </div>
            </div>

            <Divider />

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Background Overlay</Text>
                <Switch
                  checked={Boolean(themeSettings.backgroundOverlay)}
                  onChange={(checked) => handleOverlayChange(Boolean(checked))}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <Text strong>Background Opacity ({Math.round(Number(themeSettings.backgroundOpacity) * 100)}%)</Text>
              <div style={{ marginTop: 8 }}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={Number(themeSettings.backgroundOpacity)}
                  onChange={(e) => handleOpacityChange(Number(parseFloat(e.target.value)))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <Divider />

            <Space>
              <Button
                type="primary"
                icon={<SettingOutlined />}
                onClick={handleSaveSettings}
                size="large"
              >
                Save Settings
              </Button>
              <Button
                onClick={handleResetSettings}
                size="large"
              >
                Reset to Default
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Image Preview Modal */}
      <Modal
        open={previewVisible}
        title="Background Image Preview"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt="Background preview"
            style={{
              width: '100%',
              maxHeight: '500px',
              objectFit: 'contain',
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default Settings;
