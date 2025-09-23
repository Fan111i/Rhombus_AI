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
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [processResults, setProcessResults] = useState<ProcessResults | null>(null);
  const [form] = Form.useForm();

  const steps = [
    {
      title: 'Upload Files',
      icon: <InboxOutlined />,
      description: 'Upload your data files'
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

  // Smart merge compatibility analysis
  const analyzeColumnCompatibility = (existingColumns: string[], newColumns: string[]) => {
    const existing = new Set(existingColumns);
    const newCols = new Set(newColumns);

    const common = existingColumns.filter(col => newCols.has(col));
    const onlyInExisting = existingColumns.filter(col => !newCols.has(col));
    const onlyInNew = newColumns.filter(col => !existing.has(col));

    return {
      common,
      onlyInExisting,
      onlyInNew,
      isFullMatch: onlyInExisting.length === 0 && onlyInNew.length === 0,
      hasCommon: common.length > 0,
      compatibilityScore: common.length / Math.max(existing.size, newCols.size)
    };
  };

  // Smart merge all files data
  const mergeAllFilesData = (files: FileData[]) => {
    if (files.length === 0) return [];
    if (files.length === 1) return files[0].data;

    // Multiple files - smart merge
    const allColumns = new Set<string>();
    const allData: any[] = [];

    // Collect all unique columns
    files.forEach(file => {
      file.columns.forEach(col => allColumns.add(col));
    });

    const mergedColumns = Array.from(allColumns);

    // Merge data from all files
    files.forEach(file => {
      file.data.forEach(row => {
        const mergedRow: any = {};

        // Initialize all columns with empty values
        mergedColumns.forEach(col => {
          mergedRow[col] = '';
        });

        // Fill in values that exist in this row
        Object.keys(row).forEach(key => {
          if (mergedColumns.includes(key)) {
            mergedRow[key] = row[key];
          }
        });

        allData.push(mergedRow);
      });
    });

    return allData;
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/upload-file/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        Modal.error({ title: 'Upload Failed', content: data.error });
        setLoading(false);
        return;
      }

      const newFile: FileData = {
        name: file.name,
        data: data.data,
        columns: data.columns,
        rowCount: data.row_count,
      };

      if (uploadedFiles.length === 0) {
        setUploadedFiles([newFile]);
        setLoading(false);
        return;
      }

      const existingColumns = Array.from(new Set(uploadedFiles.flatMap(f => f.columns)));
      const compatibility = analyzeColumnCompatibility(existingColumns, newFile.columns);

      if (compatibility.isFullMatch) {
        setUploadedFiles(currentFiles => [...currentFiles, newFile]);
      } else if (compatibility.hasCommon) {
        Modal.confirm({
          title: '⚠️ Merge Files with Different Columns?',
          content: `The new file "${newFile.name}" has different columns. Merging will create empty cells for missing data.`,
          okText: 'Merge Anyway',
          cancelText: 'Cancel Upload',
          onOk: () => {
            setUploadedFiles(currentFiles => [...currentFiles, newFile]);
            Modal.success({
              title: 'File Added',
              content: `${newFile.name} has been added and will be merged.`,
            });
          },
          onCancel: () => {
            Modal.info({
              title: 'Upload Cancelled',
              content: `The file "${newFile.name}" was not added.`,
            });
          },
        });
      } else {
        Modal.confirm({
          title: '🚨 Replace Existing Data?',
          content: `The new file "${newFile.name}" has no columns in common with the existing data. Do you want to replace all current files with this new one?`,
          okText: 'Replace All',
          cancelText: 'Keep Existing',
          onOk: () => {
            setUploadedFiles([newFile]);
            Modal.success({
              title: 'Files Replaced',
              content: `All previous files have been removed. Now using: ${newFile.name}`,
            });
          },
          onCancel: () => {
            Modal.info({
              title: 'New File Ignored',
              content: 'Your current files remain unchanged.',
            });
          },
        });
      }
    } catch (error) {
      Modal.error({
        title: 'Upload Error',
        content: `Failed to upload or process file "${file.name}". Please try again.`,
      });
    } finally {
      setLoading(false);
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

      // Smart merge all files data
      const mergedData = mergeAllFilesData(uploadedFiles);

      const processResponse = await fetch('http://localhost:8000/api/process-data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: mergedData,
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
              <Title level={3}>📁 Upload Your Data Files</Title>
              <Dragger
                name="file"
                multiple={true}
                accept=".csv,.xlsx,.xls,.json,.txt,.tsv"
                beforeUpload={(file, fileList) => {
                  console.log('Uploading file:', file.name, 'Total files:', fileList.length);
                  handleFileUpload(file);
                  return false; // Prevent default upload
                }}
                showUploadList={false}
                onDrop={(e) => {
                  console.log('Files dropped:', e.dataTransfer.files.length);
                }}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ fontSize: '48px', color: '#667eea' }} />
                </p>
                <p className="ant-upload-text">Click or drag files to this area to upload</p>
                <p className="ant-upload-hint">
                  Support for multiple CSV, Excel, JSON, TXT, TSV files (Max: 10MB each)
                </p>
              </Dragger>
            </Card>

            {uploadedFiles.length > 0 && (
              <Card className="glass-card" style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Title level={4} style={{ margin: 0 }}>📋 Uploaded Files ({uploadedFiles.length})</Title>
                  <Button type="primary" onClick={() => setCurrentStep(1)} disabled={uploadedFiles.length === 0}>
                    Preview Data →
                  </Button>
                </div>

                <div>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileTextOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{file.name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            <Tag color="blue">{file.rowCount} rows</Tag>
                            <Tag color="green">{file.columns.length} columns</Tag>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="small"
                        danger
                        onClick={() => {
                          const newFiles = uploadedFiles.filter((_, i) => i !== index);
                          setUploadedFiles(newFiles);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, padding: '12px', backgroundColor: 'rgba(102, 126, 234, 0.1)', borderRadius: '6px', textAlign: 'center' }}>
                  <Text type="secondary">
                    💡 Continue dragging files above to add more, or use the button below
                  </Text>
                  <br />
                  <Button
                    type="dashed"
                    style={{ marginTop: 8 }}
                    icon={<InboxOutlined />}
                    onClick={() => {
                      // This simulates a click on a hidden file input element
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = '.csv,.xlsx,.xls,.json,.txt,.tsv';
                      input.style.display = 'none';

                      input.onchange = (e: Event) => {
                        const target = e.target as HTMLInputElement;
                        const files = target.files;
                        if (files) {
                          Array.from(files).forEach(file => handleFileUpload(file));
                        }
                        // Clean up the input element after use
                        document.body.removeChild(input);
                      };

                      document.body.appendChild(input);
                      input.click();
                    }}
                  >
                    📁 Add More Files
                  </Button>
                </div>
              </Card>
            )}
          </div>
        );

      case 1:
        return (
          <Card className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={3} style={{ margin: 0 }}>👁 Preview Uploaded Data</Title>
              <Button
                onClick={() => setCurrentStep(0)}
                icon={<FileTextOutlined />}
              >
                Back to Upload
              </Button>
            </div>

            {uploadedFiles.map((file, index) => (
              <div key={index} style={{ marginBottom: 24 }}>
                <Space style={{ marginBottom: 16 }}>
                  <FileTextOutlined />
                  <Text strong>{file.name}</Text>
                  <Tag color="blue">{file.rowCount} rows</Tag>
                  <Tag color="green">{file.columns.length} columns</Tag>
                </Space>

                <Table
                  dataSource={file.data.slice(0, 5)}
                  columns={file.columns.map(col => ({
                    title: col,
                    dataIndex: col,
                    key: col,
                    ellipsis: true,
                  }))}
                  pagination={false}
                  size="small"
                  scroll={{ x: true }}
                />

                {file.data.length > 5 && (
                  <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
                    ... and {file.data.length - 5} more rows
                  </Text>
                )}
              </div>
            ))}

            <Button
              type="primary"
              onClick={() => setCurrentStep(2)}
              style={{ marginTop: 16 }}
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

            <Alert
              message="Available Columns"
              description={
                <Space wrap>
                  {Array.from(new Set(uploadedFiles.flatMap(f => f.columns))).map(col => (
                    <Tag key={col} color="blue">{col}</Tag>
                  ))}
                </Space>
              }
              type="info"
              style={{ marginBottom: 24 }}
            />

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
                  <Col xs={24} sm={6}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">Matches Found</Text>
                        <div style={{ fontSize: '24px', color: '#667eea', fontWeight: 'bold' }}>
                          {processResults?.matches_count ?? 0}
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">Rows Affected</Text>
                        <div style={{ fontSize: '24px', color: '#52c41a', fontWeight: 'bold' }}>
                          {processResults?.affected_rows ?? 0}
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">Total Rows</Text>
                        <div style={{ fontSize: '24px', color: '#1890ff', fontWeight: 'bold' }}>
                          {processResults?.total_rows ?? 0}
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">Success Rate</Text>
                        <div style={{ fontSize: '24px', color: '#722ed1', fontWeight: 'bold' }}>
                          {Math.round(((processResults?.affected_rows ?? 0) / (processResults?.total_rows ?? 1)) * 100)}%
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
                            const originalData = uploadedFiles.flatMap(f => f.data)[index];
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
                    setUploadedFiles([]);
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

