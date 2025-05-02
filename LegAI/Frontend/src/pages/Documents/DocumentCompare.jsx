import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout, Typography, Spin, Alert, Card, Button, Table, Tabs, Select, Tooltip, Tag, Divider, Space, Empty } from 'antd';
import { ArrowLeftOutlined, SwapOutlined, FileTextOutlined, HistoryOutlined, InfoCircleOutlined } from '@ant-design/icons';
import Navbar from '../../components/layout/Nav/Navbar';
import documentCompareService from '../../services/documentCompareService';
import legalService from '../../services/legalService';
import styles from './DocumentCompare.module.css';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;
const { TabPane } = Tabs;
const { Option } = Select;

/**
 * Trang so sánh văn bản pháp luật
 */
const DocumentCompare = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentDocument, setCurrentDocument] = useState(null);
  const [previousDocuments, setPreviousDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState(null);

  // Tải thông tin chi tiết văn bản hiện tại và tìm kiếm các phiên bản trước
  useEffect(() => {
    const fetchDocumentData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Lấy thông tin văn bản hiện tại
        const currentDocResponse = await legalService.getLegalDocumentById(id);
        
        if (currentDocResponse && currentDocResponse.status === 'success') {
          setCurrentDocument(currentDocResponse.data);
          
          // Tìm kiếm văn bản tương tự trực tiếp từ database
          const similarDocsResponse = await documentCompareService.getSimilarDocumentsFromDatabase(id);
          
          // Nếu API chưa sẵn sàng hoặc có lỗi, sử dụng phương pháp phân tích AI
          if (similarDocsResponse.needFallback) {
            console.log('Sử dụng phương pháp phân tích bằng AI...');
            const aiSimilarDocsResponse = await documentCompareService.getSimilarDocuments(
              currentDocResponse.data.title,
              currentDocResponse.data
            );
            
            if (aiSimilarDocsResponse && aiSimilarDocsResponse.status === 'success') {
              setPreviousDocuments(aiSimilarDocsResponse.data);
              
              // Tự động chọn văn bản mới nhất nếu có
              if (aiSimilarDocsResponse.data.length > 0) {
                setSelectedDocumentId(aiSimilarDocsResponse.data[0].id);
              }
            }
          } else if (similarDocsResponse && similarDocsResponse.status === 'success') {
            setPreviousDocuments(similarDocsResponse.data);
            
            // Tự động chọn văn bản mới nhất nếu có
            if (similarDocsResponse.data.length > 0) {
              setSelectedDocumentId(similarDocsResponse.data[0].id);
              
              // Tự động so sánh với văn bản mới nhất
              setTimeout(() => {
                try {
                  // Đảm bảo currentDocument đã được khởi tạo
                  if (currentDocument) {
                    handleCompareWithDocument(similarDocsResponse.data[0].id);
                  }
                } catch (autoCompareError) {
                  console.error('Lỗi khi tự động so sánh văn bản:', autoCompareError);
                }
              }, 1000); // Tăng timeout để đảm bảo dữ liệu đã sẵn sàng
            }
          }
        } else {
          setError('Không thể tải thông tin văn bản');
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu văn bản:', err);
        setError('Đã xảy ra lỗi khi tải thông tin văn bản');
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentData();
  }, [id]);

  // Xử lý khi người dùng chọn văn bản để so sánh
  const handleCompareWithDocument = async (docId) => {
    try {
      setComparing(true);
      setError(null);
      setComparisonResult(null);
      
      if (!docId) {
        throw new Error('Vui lòng chọn văn bản để so sánh');
      }
      
      // Đảm bảo có thông tin về văn bản hiện tại
      if (!currentDocument) {
        throw new Error('Không thể tải thông tin văn bản hiện tại');
      }
      
      // Lấy thông tin văn bản đã chọn
      const selectedDocResponse = await legalService.getLegalDocumentById(docId);
      
      if (!selectedDocResponse || selectedDocResponse.status !== 'success') {
        throw new Error('Không thể tải văn bản để so sánh');
      }
      
      // Kiểm tra xem hai văn bản có đủ tương đồng để so sánh hay không
      const selectedDoc = selectedDocResponse.data;
      
      // Kiểm tra nếu văn bản khác loại
      if (currentDocument.document_type !== selectedDoc.document_type) {
        const isContinue = window.confirm(
          `Cảnh báo: Bạn đang so sánh hai văn bản khác loại (${currentDocument.document_type} và ${selectedDoc.document_type}). Kết quả so sánh có thể không chính xác.\n\nBạn có muốn tiếp tục không?`
        );
        
        if (!isContinue) {
          setComparing(false);
          return;
        }
      }
      
      // Kiểm tra độ tương đồng của tiêu đề
      const calculateTitleSimilarity = (title1, title2) => {
        if (!title1 || !title2) return 0;
        
        // Chuẩn hóa tiêu đề
        const normalize = (title) => {
          return title.toLowerCase()
                    .replace(/[.,(){}[\]\/\-:;]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
        };
        
        const normalizedTitle1 = normalize(title1);
        const normalizedTitle2 = normalize(title2);
        
        // Tách thành các từ
        const words1 = normalizedTitle1.split(' ');
        const words2 = normalizedTitle2.split(' ');
        
        // Đếm số từ trùng
        let matchingWords = 0;
        
        words1.forEach(w1 => {
          if (words2.includes(w1)) {
            matchingWords++;
          }
        });
        
        // Tính tỷ lệ % số từ trùng trên tổng số từ
        const matchPercent = (matchingWords / Math.max(words1.length, words2.length)) * 100;
        
        return Math.round(matchPercent);
      };
      
      const titleSimilarity = calculateTitleSimilarity(currentDocument.title, selectedDoc.title);
      
      // Nếu tiêu đề quá khác nhau (dưới 30% từ trùng nhau)
      if (titleSimilarity < 30) {
        const isContinue = window.confirm(
          `Cảnh báo: Hai văn bản có tiêu đề rất khác nhau (chỉ giống nhau ${titleSimilarity}%).\nVăn bản 1: ${currentDocument.title}\nVăn bản 2: ${selectedDoc.title}\n\nBạn có chắc muốn tiếp tục so sánh không?`
        );
        
        if (!isContinue) {
          setComparing(false);
          return;
        }
      }
      
      // Thực hiện phân tích sự khác biệt giữa hai văn bản
      const analyzeResponse = await documentCompareService.analyzeDocumentDifferences(
        currentDocument,
        selectedDocResponse.data
      );
      
      if (analyzeResponse && analyzeResponse.status === 'success') {
        setComparisonResult(analyzeResponse.data);
      } else {
        throw new Error(analyzeResponse.message || 'Không thể phân tích sự khác biệt');
      }
    } catch (err) {
      console.error('Lỗi khi so sánh văn bản:', err);
      setError(err.message || 'Đã xảy ra lỗi khi so sánh văn bản');
    } finally {
      setComparing(false);
    }
  };

  // Định dạng ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Định dạng nội dung có thay đổi với highlighting
  const formatChangedContent = (content) => {
    return (
      <div className={styles.changedContent}>
        {content}
      </div>
    );
  };

  // Columns cho bảng thay đổi
  const additionsColumns = [
    {
      title: 'Nội dung thêm mới',
      dataIndex: 'content',
      key: 'content',
      render: (text) => (
        <div className={styles.additionContent}>
          <div dangerouslySetInnerHTML={{ __html: text }} />
        </div>
      )
    },
    {
      title: 'Vị trí',
      dataIndex: 'location',
      key: 'location',
      width: 150
    }
  ];

  const deletionsColumns = [
    {
      title: 'Nội dung đã xóa',
      dataIndex: 'content',
      key: 'content',
      render: (text) => (
        <div className={styles.deletionContent}>
          <div dangerouslySetInnerHTML={{ __html: text }} />
        </div>
      )
    },
    {
      title: 'Vị trí',
      dataIndex: 'location',
      key: 'location',
      width: 150
    }
  ];

  const modificationsColumns = [
    {
      title: 'Nội dung cũ',
      dataIndex: 'oldContent',
      key: 'oldContent',
      render: (text) => (
        <div className={styles.deletionContent}>
          <div dangerouslySetInnerHTML={{ __html: text }} />
        </div>
      )
    },
    {
      title: 'Nội dung mới',
      dataIndex: 'newContent',
      key: 'newContent',
      render: (text) => (
        <div className={styles.additionContent}>
          <div dangerouslySetInnerHTML={{ __html: text }} />
        </div>
      )
    },
    {
      title: 'Vị trí',
      dataIndex: 'location',
      key: 'location',
      width: 150
    }
  ];

  // Render danh sách văn bản để so sánh
  const renderCompareOptions = () => {
    if (previousDocuments.length === 0) {
      return (
        <div className={styles.emptyContainer}>
          <Empty 
            description={
              <div>
                <p><strong>Không tìm thấy phiên bản trước của văn bản này</strong></p>
                <p>Hệ thống không tìm thấy phiên bản cũ hơn của văn bản này trong cơ sở dữ liệu.</p>
                <p>Đây có thể là văn bản đầu tiên của loại này hoặc phiên bản đầu tiên trong hệ thống.</p>
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        </div>
      );
    }

    return (
      <div className={styles.compareOptions}>
        <Alert 
          message="Phiên bản trước" 
          description={
            <div>
              <p>Đã tìm thấy {previousDocuments.length} phiên bản trước của văn bản này.</p>
              {previousDocuments.length > 0 && (
                <p>Hệ thống đã tự động chọn phiên bản gần nhất ({formatDate(previousDocuments[0].issued_date)}) để so sánh.</p>
              )}
            </div>
          }
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Select
          placeholder="Chọn phiên bản để so sánh"
          style={{ width: '100%', marginBottom: 16,cursor:'pointer' }}
          onChange={(value) => setSelectedDocumentId(value)}
          value={selectedDocumentId}
          className={styles.documentSelect}
          size="large"
          optionLabelProp="title"
          showSearch
          optionFilterProp="children"
          dropdownMatchSelectWidth={false}
          dropdownStyle={{ width: 'auto', minWidth: '100%',cursor:'pointer' }}
        >
          {previousDocuments.map((doc) => (
            <Option 
              key={doc.id} 
              value={doc.id}
              title={doc.title}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.selectOption}>
                <div className={styles.docTitle}>{doc.title}</div>
                <div className={styles.docInfo}>
                  <Tag color="blue">{doc.document_type}</Tag>
                  {doc.similarity_score >= 90 && (
                    <Tag color="green">Phiên bản trước</Tag>
                  )}
                  <span className={styles.docDate}>Ngày ban hành: {formatDate(doc.issued_date)}</span>
                </div>
              </div>
            </Option>
          ))}
        </Select>

        <Button 
          type="primary" 
          onClick={() => handleCompareWithDocument(selectedDocumentId)}
          disabled={!selectedDocumentId || comparing}
          loading={comparing}
          icon={<SwapOutlined />}
          className={styles.compareButton}
          size="large"
          block
        >
          So sánh với phiên bản đã chọn
        </Button>
      </div>
    );
  };

  // Render kết quả so sánh
  const renderComparisonResult = () => {
    if (!comparisonResult) {
      return null;
    }

    const { documentsInfo, comparison } = comparisonResult;
    
    return (
      <div className={styles.comparisonResult}>
        <Card className={styles.comparisonHeader}>
          <div className={styles.documentsInfo}>
            <div className={styles.documentInfo}>
              <Title level={5}>Phiên bản hiện tại</Title>
              <Text strong>{documentsInfo.current.title}</Text>
              <Text>Ngày ban hành: {formatDate(documentsInfo.current.issued_date)}</Text>
            </div>
            
            <div className={styles.comparisonArrow}>
              <SwapOutlined className={styles.arrowIcon} />
            </div>
            
            <div className={styles.documentInfo}>
              <Title level={5}>Phiên bản trước</Title>
              <Text strong>{documentsInfo.previous.title}</Text>
              <Text>Ngày ban hành: {formatDate(documentsInfo.previous.issued_date)}</Text>
            </div>
          </div>
        </Card>

        <div className={styles.summarySection}>
          <Title level={4}>Tóm tắt thay đổi</Title>
          <Paragraph className={styles.summaryContent}>
            <div dangerouslySetInnerHTML={{ __html: comparison.summary }} />
          </Paragraph>
        </div>

        <div className={styles.statisticsSection}>
          <Space size="large">
            <Tooltip title="Nội dung được thêm mới trong phiên bản hiện tại">
              <Tag color="green" className={styles.statTag}>
                <span className={styles.statCount}>{comparison.additions.length}</span> phần thêm mới
              </Tag>
            </Tooltip>
            
            <Tooltip title="Nội dung đã bị xóa từ phiên bản trước">
              <Tag color="red" className={styles.statTag}>
                <span className={styles.statCount}>{comparison.deletions.length}</span> phần đã xóa
              </Tag>
            </Tooltip>
            
            <Tooltip title="Nội dung đã được sửa đổi từ phiên bản trước">
              <Tag color="gold" className={styles.statTag}>
                <span className={styles.statCount}>{comparison.modifications.length}</span> phần sửa đổi
              </Tag>
            </Tooltip>
          </Space>
        </div>

        <Tabs defaultActiveKey="all" className={styles.resultTabs}>
          <TabPane tab="Tất cả thay đổi" key="all">
            {/* Hiển thị tất cả các thay đổi */}
            <div className={styles.changesSection}>
              {comparison.additions.length > 0 && (
                <div className={styles.additionsSection}>
                  <Title level={5}>Nội dung thêm mới trong phiên bản hiện tại</Title>
                  <Table 
                    dataSource={comparison.additions.map((item, index) => ({ ...item, key: `addition-${index}` }))} 
                    columns={additionsColumns} 
                    pagination={{ pageSize: 5 }}
                    className={styles.changesTable}
                  />
                </div>
              )}
              
              {comparison.deletions.length > 0 && (
                <div className={styles.deletionsSection}>
                  <Title level={5}>Nội dung đã xóa từ phiên bản trước</Title>
                  <Table 
                    dataSource={comparison.deletions.map((item, index) => ({ ...item, key: `deletion-${index}` }))} 
                    columns={deletionsColumns} 
                    pagination={{ pageSize: 5 }}
                    className={styles.changesTable}
                  />
                </div>
              )}
              
              {comparison.modifications.length > 0 && (
                <div className={styles.modificationsSection}>
                  <Title level={5}>Nội dung sửa đổi giữa hai phiên bản</Title>
                  <Table 
                    dataSource={comparison.modifications.map((item, index) => ({ ...item, key: `modification-${index}` }))} 
                    columns={modificationsColumns} 
                    pagination={{ pageSize: 5 }}
                    className={styles.changesTable}
                  />
                </div>
              )}
            </div>
          </TabPane>
          
          <TabPane tab="Phần thêm mới" key="additions">
            <Table 
              dataSource={comparison.additions.map((item, index) => ({ ...item, key: `addition-${index}` }))} 
              columns={additionsColumns} 
              pagination={{ pageSize: 10 }}
              className={styles.changesTable}
            />
          </TabPane>
          
          <TabPane tab="Phần đã xóa" key="deletions">
            <Table 
              dataSource={comparison.deletions.map((item, index) => ({ ...item, key: `deletion-${index}` }))} 
              columns={deletionsColumns} 
              pagination={{ pageSize: 10 }}
              className={styles.changesTable}
            />
          </TabPane>
          
          <TabPane tab="Phần sửa đổi" key="modifications">
            <Table 
              dataSource={comparison.modifications.map((item, index) => ({ ...item, key: `modification-${index}` }))} 
              columns={modificationsColumns} 
              pagination={{ pageSize: 10 }}
              className={styles.changesTable}
            />
          </TabPane>
        </Tabs>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <Content className={styles.container}>
        <div className={styles.header}>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/legal/documents/${id}`)}
            className={styles.backButton}
          >
            Quay lại chi tiết văn bản
          </Button>
          
          <Title level={2} className={styles.pageTitle}>
            Nghiên cứu và So sánh Phiên bản Văn bản Pháp luật
          </Title>
        </div>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
            <p>Đang tải thông tin văn bản...</p>
          </div>
        ) : error ? (
          <Alert
            message="Đã xảy ra lỗi"
            description={error}
            type="error"
            showIcon
            className={styles.errorAlert}
          />
        ) : (
          <div className={styles.content}>
            <Card className={styles.currentDocumentCard}>
              <div className={styles.documentHeader}>
                <Title level={3}>
                  <FileTextOutlined className={styles.documentIcon} /> {currentDocument.title}
                </Title>
                <div className={styles.documentMeta}>
                  <Tag color="blue">{currentDocument.document_type}</Tag>
                  <Text>Ngày ban hành: {formatDate(currentDocument.issued_date)}</Text>
                  {currentDocument.document_number && (
                    <Text>Số hiệu: {currentDocument.document_number}</Text>
                  )}
                </div>
              </div>
              
              <Divider />
              
              <div className={styles.compareSection}>
                <Title level={4}>
                  <HistoryOutlined className={styles.sectionIcon} /> So sánh với phiên bản trước
                </Title>
                <Alert 
                  message="Hướng dẫn"
                  description="Hệ thống sẽ tìm kiếm các phiên bản cũ hơn của văn bản hiện tại để so sánh. Các phiên bản được xác định dựa trên tiêu đề tương tự và ngày ban hành trước đó."
                  type="info" 
                  showIcon
                  icon={<InfoCircleOutlined />}
                  className={styles.infoAlert}
                />
                
                {renderCompareOptions()}
              </div>
              
              {comparing ? (
                <div className={styles.comparingContainer}>
                  <Spin size="large" />
                  <p>Đang phân tích sự khác biệt...</p>
                </div>
              ) : renderComparisonResult()}
            </Card>
          </div>
        )}
      </Content>
    </>
  );
};

export default DocumentCompare; 