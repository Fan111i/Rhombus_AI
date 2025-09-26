import React, { useState } from 'react';
import {
  Card,
  Steps,
  Upload,
  Button,
  Form,
  Input,
  Table,
  Typography,
  Space,
  Alert,
  Tag,
  Row,
  Col,
  Progress,
  Modal,
} from 'antd';
import {
  InboxOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface FileData {
  name: string;
  data: any[];
  columns: string[];
  rowCount: number;
}

interface ProcessResults {
  matches_count: number;
  affected_rows: number;
  total_rows: number;
  affected_columns?: string[];
  processed_data?: any[];
  description: string;
  originalPattern: string;
}

const DataProcessing: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [processResults, setProcessResults] = useState<ProcessResults | null>(null);
  const [form] = Form.useForm();

  const steps = [
    {
      title: 'Upload File',
      icon: <InboxOutlined />,
      description: 'Upload your data file'
    },
    {
      title: 'Preview Data',
      icon: <FileTextOutlined />,
      description: 'Review uploaded data'
    },
    {
      title: 'Configure Pattern',
      icon: <PlayCircleOutlined />,
      description: 'Set up pattern matching'
    },
    {
      title: 'View Results',
      icon: <CheckCircleOutlined />,
      description: 'See processed data'
    },
  ];

  // Simple single file data access
  const getFileData = () => {
    return uploadedFile ? uploadedFile.data : [];
  };

  const processFileUpload = async (file: File) => {
    console.log('Processing file upload:', file.name, file.size, file.type);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Sending request to backend...');
      const response = await fetch('http://localhost:8000/api/upload-file/', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!data.success) {
        console.error('Upload failed:', data.error);
        Modal.error({ title: 'Upload Failed', content: data.error });
        setLoading(false);
        return null;
      }

      const newFile: FileData = {
        name: file.name,
        data: data.data,
        columns: data.columns,
        rowCount: data.row_count,
      };

      console.log('Created newFile object:', newFile);
      return newFile;
    } catch (error) {
      console.error('Upload error:', error);
      Modal.error({
        title: 'Upload Error',
        content: `Failed to upload file "${file.name}". Error: ${error instanceof Error ? error.message : String(error)}`,
      });
      setLoading(false);
      return null;
    }
  };

  const handleFileUpload = async (file: File) => {
    // Check if there's already an uploaded file
    if (uploadedFile) {
      Modal.confirm({
        title: '🔄 Replace Existing File?',
        content: (
          <div>
            <p>You already have <strong>{uploadedFile.name}</strong> uploaded.</p>
            <p>Do you want to replace it with <strong>{file.name}</strong>?</p>
            <div style={{
              background: '#f0f8ff',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              marginTop: '12px'
            }}>
              💡 This will remove the current file and all processing results
            </div>
          </div>
        ),
        okText: '✅ Replace File',
        cancelText: '❌ Keep Current',
        width: 450,
        onOk: async () => {
          const newFile = await processFileUpload(file);
          if (newFile) {
            setUploadedFile(newFile);
            setProcessResults(null); // Clear previous results
            setCurrentStep(1); // Auto-navigate to preview
            setLoading(false);
            Modal.success({
              title: '🎉 File Replaced Successfully',
              content: `${newFile.name} has been uploaded with ${newFile.rowCount} rows and ${newFile.columns.length} columns.`,
            });
          }
        },
        onCancel: () => {
          setLoading(false);
          Modal.info({
            title: '📁 Upload Cancelled',
            content: `Keeping current file: ${uploadedFile.name}`,
          });
        },
      });
    } else {
      // No existing file, proceed with upload
      const newFile = await processFileUpload(file);
      if (newFile) {
        setUploadedFile(newFile);
        setLoading(false);

        // Show success message and auto-navigate quickly
        const modal = Modal.success({
          title: '✅ File Uploaded Successfully',
          content: `${newFile.name} has been uploaded with ${newFile.rowCount} rows and ${newFile.columns.length} columns. Redirecting to preview...`,
        });

        // Auto close modal and navigate to preview
        setTimeout(() => {
          modal.destroy();
          setCurrentStep(1);
        }, 1500);
      }
    }
  };

  const handleProcessData = async (values: any) => {
    setLoading(true);
    try {
      // First get the regex pattern
      const patternResponse = await fetch('http://localhost:8000/api/convert-to-regex/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: values.description,
        }),
      });

      const patternData = await patternResponse.json();

      if (!patternData.success) {
        throw new Error(patternData.error);
      }

      // Get single file data
      const fileData = getFileData();

      const processResponse = await fetch('http://localhost:8000/api/process-data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: fileData,
          pattern: patternData.pattern,
          replacement: values.replacement,
          apply_to_all_columns: true,
        }),
      });

      const processData = await processResponse.json();

      if (processData.success) {
        setProcessResults({
          ...processData,
          originalPattern: patternData.pattern,
          description: values.description,
        });
        setCurrentStep(3);
      } else {
        throw new Error(processData.error);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to process data. Please try again.';
      Modal.error({
        title: 'Processing Failed',
        content: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <Card className="glass-card">
              <Title level={3} style={{ marginBottom: 16 }}>📁 Upload Your Data File</Title>
              <Dragger
                name="file"
                multiple={false}
                accept=".csv,.xlsx,.xls,.json,.txt,.tsv"
                beforeUpload={(file) => {
                  console.log('beforeUpload triggered:', file.name);
                  handleFileUpload(file);
                  return false; // Prevent default upload
                }}
                showUploadList={false}
                onChange={(info) => {
                  console.log('onChange triggered:', info.file.name, info.file.status);
                }}
                onDrop={(e) => {
                  console.log('onDrop triggered: Files dropped:', e.dataTransfer.files.length);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px dashed #667eea',
                  borderRadius: '8px'
                }}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ fontSize: '48px', color: '#667eea' }} />
                </p>
                <p className="ant-upload-text">Click or drag a file to this area to upload</p>
                <p className="ant-upload-hint">
                  Supports CSV, Excel, JSON, TXT, TSV files (Max: 10MB). After upload, you'll be taken to preview the data.
                </p>
              </Dragger>
            </Card>

          </div>
        );

      case 1:
        return (
          <Card className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={3} style={{ margin: 0 }}>👁 Preview Uploaded Data</Title>
              <Button
                onClick={() => {
                  setCurrentStep(0);
                  setUploadedFile(null); // Clear uploaded file when going back
                }}
                icon={<FileTextOutlined />}
              >
                Back to Upload
              </Button>
            </div>

            {uploadedFile && (
              <div style={{ marginBottom: 24 }}>
                <Space style={{ marginBottom: 16 }}>
                  <FileTextOutlined />
                  <Text strong>{uploadedFile.name}</Text>
                  <Tag color="blue">{uploadedFile.rowCount} rows</Tag>
                  <Tag color="green">{uploadedFile.columns.length} columns</Tag>
                </Space>

                <Table
                  dataSource={uploadedFile.data.slice(0, 5)}
                  columns={uploadedFile.columns.map(col => ({
                    title: col,
                    dataIndex: col,
                    key: col,
                    ellipsis: true,
                  }))}
                  pagination={false}
                  size="small"
                  scroll={{ x: true }}
                />

                {uploadedFile.data.length > 5 && (
                  <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
                    ... and {uploadedFile.data.length - 5} more rows
                  </Text>
                )}
              </div>
            )}

            <Button
              type="primary"
              onClick={() => setCurrentStep(2)}
              style={{ marginTop: 16 }}
              disabled={!uploadedFile}
            >
              Continue to Pattern Configuration
            </Button>
          </Card>
        );

      case 2:
        return (
          <Card className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={3} style={{ margin: 0 }}>⚙️ Configure Pattern Matching</Title>
              <Button
                onClick={() => setCurrentStep(1)}
                icon={<FileTextOutlined />}
              >
                Back to Preview
              </Button>
            </div>

            {uploadedFile && (
              <Alert
                message="Available Columns"
                description={
                  <Space wrap>
                    {uploadedFile.columns.map(col => (
                      <Tag key={col} color="blue">{col}</Tag>
                    ))}
                  </Space>
                }
                type="info"
                style={{ marginBottom: 24 }}
              />
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleProcessData}
              size="large"
            >
              <Form.Item
                name="description"
                label="Pattern Description (Natural Language)"
                rules={[{ required: true, message: 'Please describe what you want to find' }]}
              >
                <Input
                  placeholder="e.g., find email addresses"
                  prefix={<ExclamationCircleOutlined />}
                />
              </Form.Item>

              <Form.Item
                name="replacement"
                label="Replacement Value"
                rules={[{ required: true, message: 'Please specify replacement value' }]}
              >
                <Input
                  placeholder="e.g., REDACTED"
                  prefix={<CheckCircleOutlined />}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<PlayCircleOutlined />}
                  size="large"
                  block
                >
                  🎯 Apply Pattern Matching & Replacement
                </Button>
              </Form.Item>
            </Form>
          </Card>
        );

      case 3:
        return (
          <Card className="glass-card">
            <Title level={3}>✅ Processing Results</Title>

            {processResults && (
              <div>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">Matches Found</Text>
                        <div style={{ fontSize: '24px', color: '#667eea', fontWeight: 'bold' }}>
                          {processResults?.matches_count ?? 0}
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">Rows Affected</Text>
                        <div style={{ fontSize: '24px', color: '#52c41a', fontWeight: 'bold' }}>
                          {processResults?.affected_rows ?? 0}
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">Total Rows</Text>
                        <div style={{ fontSize: '24px', color: '#1890ff', fontWeight: 'bold' }}>
                          {processResults?.total_rows ?? 0}
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>

                <Alert
                  message="Pattern Details"
                  description={
                    <div>
                      <p><strong>Description:</strong> {processResults?.description}</p>
                      <p><strong>Generated Regex:</strong> <code>{processResults?.originalPattern}</code></p>
                      <p><strong>Columns Modified:</strong> {processResults?.affected_columns?.join(', ')}</p>
                    </div>
                  }
                  type="success"
                  style={{ marginBottom: 24 }}
                />

                {processResults?.processed_data && (
                  <div>
                    <Title level={4}>🔄 Processed Data Preview</Title>
                    <Table
                      dataSource={processResults.processed_data.slice(0, 10)}
                      columns={Object.keys(processResults.processed_data[0] || {})
                        .filter(key => !key.startsWith('_'))
                        .map(col => ({
                          title: col,
                          dataIndex: col,
                          key: col,
                          ellipsis: true,
                          render: (text, record, index) => {
                            const originalData = uploadedFile?.data[index];
                            const isModified = originalData && originalData[col] !== text;
                            return (
                              <span style={isModified ? {
                                fontWeight: 'bold',
                                color: '#1890ff',
                                background: '#f0f8ff',
                                padding: '2px 4px',
                                borderRadius: '4px'
                              } : {}}>
                                {text}
                              </span>
                            );
                          }
                        }))}
                      pagination={{ pageSize: 10 }}
                      size="small"
                      scroll={{ x: true }}
                    />
                  </div>
                )}

                <Button
                  onClick={() => {
                    setCurrentStep(0);
                    setUploadedFile(null);
                    setProcessResults(null);
                    form.resetFields();
                  }}
                  style={{ marginTop: 16 }}
                >
                  Start New Processing
                </Button>
              </div>
            )}
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <Card className="glass-card" style={{ marginBottom: 24 }}>
        <Steps current={currentStep} items={steps} />
      </Card>

      {loading && (
        <Card className="glass-card" style={{ marginBottom: 24, textAlign: 'center' }}>
          <Progress percent={50} status="active" />
          <Text>Processing your request...</Text>
        </Card>
      )}

      {renderStepContent()}
    </div>
  );
};

export default DataProcessing;

