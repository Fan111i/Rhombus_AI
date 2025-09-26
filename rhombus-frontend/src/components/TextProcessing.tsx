import React, { useState } from 'react';
import {
  Card,
  Steps,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Alert,
  Row,
  Col,
  Progress,
  Modal,
} from 'antd';
import {
  EditOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface ProcessResults {
  matches_count: number;
  affected_rows: number;
  total_rows: number;
  processed_data?: string;
  description: string;
  originalPattern: string;
}

const TextProcessing: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [processResults, setProcessResults] = useState<ProcessResults | null>(null);
  const [form] = Form.useForm();

  const steps = [
    {
      title: 'Input Text',
      icon: <EditOutlined />,
      description: 'Enter your text data'
    },
    {
      title: 'Configure Pattern',
      icon: <PlayCircleOutlined />,
      description: 'Set up pattern matching'
    },
    {
      title: 'View Results',
      icon: <CheckCircleOutlined />,
      description: 'See processed text'
    },
  ];

  const handleProcessText = async (values: any) => {
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

      // Process text directly using regex
      const regex = new RegExp(patternData.pattern, 'g');
      const matches = inputText.match(regex) || [];
      const processedText = inputText.replace(regex, values.replacement);

      setProcessResults({
        matches_count: matches.length,
        affected_rows: matches.length > 0 ? 1 : 0,
        total_rows: 1,
        processed_data: processedText,
        originalPattern: patternData.pattern,
        description: values.description,
      });
      setCurrentStep(2);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to process text. Please try again.';
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
          <Card className="glass-card">
            <Title level={3} style={{ marginBottom: 16 }}>✍️ Input Your Text</Title>

            <Form layout="vertical">
              <Form.Item
                label="Text Content"
                required
              >
                <TextArea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter your text here... You can paste emails, phone numbers, addresses, or any text that contains patterns you want to find and replace."
                  rows={8}
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    fontFamily: 'Monaco, "Lucida Console", monospace'
                  }}
                />
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">
                  Characters: {inputText.length} | Lines: {inputText.split('\n').length}
                </Text>

                <Space>
                  <Button
                    onClick={() => {
                      setInputText('');
                      Modal.success({
                        title: '✅ Text Cleared',
                        content: 'Text area has been cleared.',
                      });
                    }}
                  >
                    Clear Text
                  </Button>

                  <Button
                    type="primary"
                    onClick={() => setCurrentStep(1)}
                    disabled={!inputText.trim()}
                  >
                    Continue to Pattern Configuration →
                  </Button>
                </Space>
              </div>
            </Form>

            {inputText && (
              <Alert
                message="Text Preview"
                description={
                  <div style={{
                    maxHeight: '100px',
                    overflow: 'auto',
                    background: '#f5f5f5',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginTop: '8px',
                    fontFamily: 'Monaco, "Lucida Console", monospace'
                  }}>
                    {inputText.substring(0, 200)}{inputText.length > 200 && '...'}
                  </div>
                }
                type="info"
                style={{ marginTop: 16 }}
              />
            )}
          </Card>
        );

      case 1:
        return (
          <Card className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={3} style={{ margin: 0 }}>⚙️ Configure Pattern Matching</Title>
              <Button
                onClick={() => setCurrentStep(0)}
                icon={<EditOutlined />}
              >
                Back to Text Input
              </Button>
            </div>

            <Alert
              message="Text Information"
              description={
                <div>
                  <Text>Characters: {inputText.length} | Lines: {inputText.split('\n').length}</Text>
                </div>
              }
              type="info"
              style={{ marginBottom: 24 }}
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleProcessText}
              size="large"
            >
              <Form.Item
                name="description"
                label="Pattern Description (Natural Language)"
                rules={[{ required: true, message: 'Please describe what you want to find' }]}
              >
                <Input
                  placeholder="e.g., find email addresses, find phone numbers, find URLs"
                  prefix={<ExclamationCircleOutlined />}
                />
              </Form.Item>

              <Form.Item
                name="replacement"
                label="Replacement Value"
                rules={[{ required: true, message: 'Please specify replacement value' }]}
              >
                <Input
                  placeholder="e.g., REDACTED, [HIDDEN], ***"
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

      case 2:
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
                        <Text type="secondary">Replacements Made</Text>
                        <div style={{ fontSize: '24px', color: '#52c41a', fontWeight: 'bold' }}>
                          {processResults?.matches_count ?? 0}
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">Text Length</Text>
                        <div style={{ fontSize: '24px', color: '#1890ff', fontWeight: 'bold' }}>
                          {processResults?.processed_data?.length ?? 0}
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
                      <p><strong>Original Length:</strong> {inputText.length} characters</p>
                      <p><strong>Processed Length:</strong> {processResults?.processed_data?.length} characters</p>
                    </div>
                  }
                  type="success"
                  style={{ marginBottom: 24 }}
                />

                {processResults?.processed_data && (
                  <div>
                    <Title level={4}>🔄 Processed Text</Title>
                    <div style={{
                      background: '#f5f5f5',
                      padding: '16px',
                      borderRadius: '8px',
                      maxHeight: '300px',
                      overflow: 'auto',
                      fontFamily: 'Monaco, "Lucida Console", monospace',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {processResults.processed_data}
                    </div>

                    <div style={{ marginTop: 12, textAlign: 'center' }}>
                      <Button
                        type="primary"
                        onClick={() => {
                          navigator.clipboard.writeText(processResults.processed_data || '');
                          Modal.success({
                            title: '📋 Copied to Clipboard',
                            content: 'Processed text has been copied to your clipboard.',
                          });
                        }}
                      >
                        📋 Copy Processed Text
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => {
                    setCurrentStep(0);
                    setInputText('');
                    setProcessResults(null);
                    form.resetFields();
                  }}
                  style={{ marginTop: 16 }}
                >
                  Start New Text Processing
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
          <Text>Processing your text...</Text>
        </Card>
      )}

      {renderStepContent()}
    </div>
  );
};

export default TextProcessing;