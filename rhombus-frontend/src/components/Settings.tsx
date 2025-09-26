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
  message,
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
        setThemeSettings(settings);
        setBackgroundImage(settings.backgroundImage);
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

  const handleImageUpload = async (file: File) => {
    try {
      const validation = await validateImage(file);

      if (!validation.valid) {
        Modal.error({
          title: 'Invalid Image',
          content: validation.error,
        });
        return false;
      }

      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setBackgroundImage(base64);
        setImageInfo({
          name: file.name,
          size: file.size,
          dimensions: validation.dimensions!,
        });

        message.success(`Background image uploaded successfully! Resolution: ${validation.dimensions!.width}x${validation.dimensions!.height}`);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      Modal.error({
        title: 'Upload Error',
        content: 'Failed to process the image. Please try again.',
      });
    }

    return false; // Prevent default upload behavior
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
        message.success('Background image removed successfully!');
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

  const handleSaveSettings = () => {
    const finalSettings = {
      ...themeSettings,
      backgroundImage,
    };

    localStorage.setItem('rhombus-theme-settings', JSON.stringify(finalSettings));

    // Apply theme to document root immediately
    document.documentElement.style.setProperty('--primary-color', finalSettings.primaryColor);

    if (finalSettings.backgroundImage) {
      document.documentElement.style.setProperty('--background-image', `url(${finalSettings.backgroundImage})`);
      document.documentElement.style.setProperty('--background-overlay', finalSettings.backgroundOverlay ? 'block' : 'none');
      document.documentElement.style.setProperty('--background-opacity', finalSettings.backgroundOpacity.toString());
    } else {
      document.documentElement.style.removeProperty('--background-image');
      document.documentElement.style.removeProperty('--background-overlay');
      document.documentElement.style.removeProperty('--background-opacity');
    }

    // Force re-render by triggering a style recalculation
    document.body.style.display = 'none';
    void document.body.offsetHeight; // Trigger reflow - used for side effect
    document.body.style.display = '';

    // Update the theme settings state to ensure consistency
    setThemeSettings(finalSettings);

    Modal.success({
      title: '🎉 Settings Saved & Applied',
      content: 'Your theme settings have been saved and applied immediately!',
      onOk: () => {
        // Additional force update if needed
        window.dispatchEvent(new Event('resize'));
      }
    });
  };

  const handleResetSettings = () => {
    Modal.confirm({
      title: 'Reset to Default',
      content: 'Are you sure you want to reset all settings to default values?',
      okText: 'Reset',
      okType: 'danger',
      onOk: () => {
        const defaultSettings = {
          primaryColor: '#667eea',
          backgroundImage: null,
          backgroundOverlay: true,
          backgroundOpacity: 0.3,
        };

        setThemeSettings(defaultSettings);
        setBackgroundImage(null);
        setImageInfo(null);

        localStorage.removeItem('rhombus-theme-settings');
        document.documentElement.style.removeProperty('--primary-color');
        document.documentElement.style.removeProperty('--background-image');
        document.documentElement.style.removeProperty('--background-overlay');
        document.documentElement.style.removeProperty('--background-opacity');

        message.success('Settings reset to default values!');
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
                      <Text>{imageInfo.name}</Text>
                    </div>
                    <div>
                      <Text strong>Size: </Text>
                      <Text>{formatFileSize(imageInfo.size)}</Text>
                    </div>
                    <div>
                      <Text strong>Resolution: </Text>
                      <Tag color="blue">{imageInfo.dimensions.width}x{imageInfo.dimensions.height}</Tag>
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
                  value={themeSettings.primaryColor}
                  onChange={(e) => handlePrimaryColorChange(e.target.value)}
                  style={{
                    width: '50px',
                    height: '40px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', color: '#666' }}>
                  Current: {themeSettings.primaryColor}
                </span>
              </div>
            </div>

            <Divider />

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Background Overlay</Text>
                <Switch
                  checked={themeSettings.backgroundOverlay}
                  onChange={handleOverlayChange}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <Text strong>Background Opacity ({Math.round(themeSettings.backgroundOpacity * 100)}%)</Text>
              <div style={{ marginTop: 8 }}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={themeSettings.backgroundOpacity}
                  onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
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
