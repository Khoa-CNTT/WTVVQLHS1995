import React, { useState, useEffect } from 'react';
import { Modal, Button, Spin, Alert, Divider, Typography, Collapse, Space, Card } from 'antd';
import { BarChartOutlined, FileTextOutlined, TeamOutlined, FileSearchOutlined, LinkOutlined, StarOutlined } from '@ant-design/icons';
import aiService from '../../services/aiService';
import styles from './DocumentAnalysis.module.css';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * Component để hiển thị phân tích văn bản pháp luật bằng AI
 */
const DocumentAnalysis = ({ documentId, documentTitle, documentContent, visible, onClose }) => {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  // Phân tích văn bản khi modal được mở
  useEffect(() => {
    if (visible && documentId && documentContent) {
      analyzeDocument();
    }
  }, [visible, documentId, documentContent]);

  // Hàm phân tích văn bản
  const analyzeDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Gọi API để phân tích văn bản
      const response = await aiService.analyzeLegalDocument(
        documentId, 
        documentContent, 
        documentTitle
      );
      
      if (response && response.success && response.data) {
        setAnalysis(response.data.analysis);
      } else {
        setError('Không thể phân tích văn bản. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Lỗi khi phân tích văn bản:', error);
      setError('Đã xảy ra lỗi: ' + (error.message || 'Không thể phân tích văn bản'));
    } finally {
      setLoading(false);
    }
  };

  // Format kết quả phân tích thành các phần riêng biệt
  const formatAnalysis = () => {
    if (!analysis) return null;
    
    // Phát hiện các phần trong kết quả phân tích
    const sections = [
      { title: 'Tóm tắt nội dung', icon: <FileTextOutlined />, pattern: /Tóm tắt|Nội dung chính/i },
      { title: 'Đối tượng áp dụng', icon: <TeamOutlined />, pattern: /Đối tượng áp dụng|Phạm vi áp dụng/i },
      { title: 'Điều khoản quan trọng', icon: <BarChartOutlined />, pattern: /Điều khoản quan trọng|Điểm chính/i },
      { title: 'Vấn đề pháp lý nổi bật', icon: <FileSearchOutlined />, pattern: /Vấn đề pháp lý|Điểm đáng chú ý/i },
      { title: 'Văn bản liên quan', icon: <LinkOutlined />, pattern: /Văn bản liên quan|Liên kết pháp lý/i },
      { title: 'Đánh giá và tác động', icon: <StarOutlined />, pattern: /Đánh giá|Tác động|Ý nghĩa/i }
    ];
    
    // Tách kết quả phân tích thành các phần
    const analysisLines = analysis.split('\n');
    const formattedSections = [];
    
    let currentSection = null;
    let currentContent = [];
    
    analysisLines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      // Kiểm tra xem dòng này có phải là tiêu đề của một phần mới không
      const matchedSection = sections.find(section => 
        trimmedLine.match(section.pattern) && 
        (trimmedLine.endsWith(':') || /^\d+\.\s/.test(trimmedLine))
      );
      
      if (matchedSection) {
        // Lưu phần hiện tại trước khi chuyển sang phần mới
        if (currentSection && currentContent.length > 0) {
          formattedSections.push({
            title: currentSection.title,
            icon: currentSection.icon,
            content: currentContent.join('\n')
          });
          currentContent = [];
        }
        
        currentSection = matchedSection;
      } else if (currentSection) {
        currentContent.push(trimmedLine);
      } else {
        // Dòng không thuộc phần nào, thêm vào phần tóm tắt
        if (!currentSection) {
          currentSection = sections[0];
        }
        currentContent.push(trimmedLine);
      }
    });
    
    // Thêm phần cuối cùng
    if (currentSection && currentContent.length > 0) {
      formattedSections.push({
        title: currentSection.title,
        icon: currentSection.icon,
        content: currentContent.join('\n')
      });
    }
    
    // Nếu không tìm thấy phần nào, sử dụng toàn bộ phân tích
    if (formattedSections.length === 0) {
      formattedSections.push({
        title: 'Phân tích tổng quan',
        icon: <FileTextOutlined />,
        content: analysis
      });
    }
    
    return formattedSections;
  };

  // Hiển thị kết quả phân tích
  const renderAnalysis = () => {
    const formattedSections = formatAnalysis();
    
    if (!formattedSections) return null;
    
    return (
      <Collapse 
        defaultActiveKey={['0']} 
        className={styles.analysisCollapse}
      >
        {formattedSections.map((section, index) => (
          <Panel 
            header={
              <Space>
                {section.icon}
                <Text strong>{section.title}</Text>
              </Space>
            } 
            key={index}
          >
            <Paragraph className={styles.sectionContent}>
              {section.content.split('\n').map((paragraph, idx) => (
                <React.Fragment key={idx}>
                  {paragraph}
                  <br />
                </React.Fragment>
              ))}
            </Paragraph>
          </Panel>
        ))}
      </Collapse>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <FileSearchOutlined />
          <span>Nghiên cứu văn bản: {documentTitle}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="back" onClick={onClose}>
          Đóng
        </Button>,
        <Button 
          key="refresh" 
          type="default" 
          icon={<FileSearchOutlined />} 
          loading={loading}
          onClick={analyzeDocument}
        >
          Phân tích lại
        </Button>
      ]}
      className={styles.analysisModal}
    >
      {loading ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <Text className={styles.loadingText}>
            Đang phân tích văn bản pháp luật...
          </Text>
          <Text type="secondary">
            Quá trình này có thể mất vài giây, vui lòng đợi
          </Text>
        </div>
      ) : error ? (
        <Alert
          message="Lỗi phân tích"
          description={error}
          type="error"
          showIcon
          className={styles.errorAlert}
        />
      ) : analysis ? (
        <div className={styles.analysisContainer}>
          <Card className={styles.analysisIntro}>
            <Title level={4}>Phân tích văn bản pháp luật bằng AI</Title>
            <Text type="secondary">
              Dưới đây là kết quả phân tích chi tiết văn bản "{documentTitle}" bằng công nghệ trí tuệ nhân tạo.
              Kết quả phân tích nhằm mục đích tham khảo và hỗ trợ việc nghiên cứu.
            </Text>
          </Card>
          
          <Divider />
          
          {renderAnalysis()}
          
          <Divider dashed />
          
          <Text type="secondary" className={styles.disclaimer}>
            Lưu ý: Phân tích này được thực hiện tự động bởi AI và chỉ mang tính chất tham khảo.
            Vui lòng tham khảo ý kiến chuyên gia pháp lý cho các quyết định quan trọng.
          </Text>
        </div>
      ) : (
        <Alert
          message="Chưa có kết quả"
          description="Chưa có kết quả phân tích nào. Vui lòng thử phân tích lại."
          type="info"
          showIcon
          className={styles.infoAlert}
        />
      )}
    </Modal>
  );
};

export default DocumentAnalysis; 