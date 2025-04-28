import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Tabs, Descriptions, Tag, Spin, Space, message, Divider, List, Modal, Select, InputNumber, Avatar, Rate, Layout, Row, Col } from 'antd';
import { DownloadOutlined, DeleteOutlined, EditOutlined, FileOutlined, FilePdfOutlined, FileWordOutlined, FileImageOutlined, UserOutlined, DollarOutlined, SendOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import legalCaseService from '../../services/legalCaseService';
import userService from '../../services/userService';
import styles from './LegalCase.module.css';
import moment from 'moment';
import Navbar from '../../components/layout/Nav/Navbar';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { confirm } = Modal;
const { Content } = Layout;

const LegalCaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [lawyers, setLawyers] = useState([]);
  const [lawyersLoading, setLawyersLoading] = useState(false);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [disputeValue, setDisputeValue] = useState(0);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [assigningLawyer, setAssigningLawyer] = useState(false);

  // Lấy thông tin vụ án
  useEffect(() => {
    const fetchCaseData = async () => {
      try {
        setLoading(true);
        const response = await legalCaseService.getLegalCaseById(id);

        if (response.success) {
          setCaseData(response.data);
        } else {
          message.error(response.message || 'Không thể tải thông tin vụ án');
          navigate('/legal-cases');
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin vụ án:', error);
        message.error('Không thể tải thông tin vụ án. Vui lòng thử lại sau.');
        navigate('/legal-cases');
      } finally {
        setLoading(false);
      }
    };

    fetchCaseData();
  }, [id, navigate]);

  // Xử lý tải xuống tài liệu
  const handleDownloadDocument = async (documentId) => {
    try {
      const blob = await legalCaseService.downloadDocument(id, documentId);

      // Tìm tên tài liệu từ caseData
      const document = caseData.documents.find(doc => doc.id === documentId);
      const fileName = document ? document.original_name : `document-${documentId}`;

      // Tạo URL tạm thời và tải xuống
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('Đã tải xuống tài liệu');
    } catch (error) {
      console.error('Lỗi khi tải xuống tài liệu:', error);
      message.error('Không thể tải xuống tài liệu. Vui lòng thử lại sau.');
    }
  };

  // Xử lý xóa vụ án
  const handleDeleteCase = () => {
    confirm({
      title: 'Xác nhận xóa vụ án',
      content: 'Bạn có chắc chắn muốn xóa vụ án này? Hành động này không thể khôi phục.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await legalCaseService.deleteLegalCase(id);

          if (response.success) {
            message.success('Đã xóa vụ án thành công');
            navigate('/legal-cases');
          } else {
            message.error(response.message || 'Không thể xóa vụ án');
          }
        } catch (error) {
          console.error('Lỗi khi xóa vụ án:', error);
          message.error('Không thể xóa vụ án. Vui lòng thử lại sau.');
        }
      },
    });
  };

  // Lấy danh sách luật sư
  const fetchLawyers = async () => {
    try {
      setLawyersLoading(true);
      const response = await userService.getAllLawyers();

      if (response.success) {
        setLawyers(response.data);
      } else {
        message.error(response.message || 'Không thể tải danh sách luật sư');
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách luật sư:', error);
      message.error('Không thể tải danh sách luật sư. Vui lòng thử lại sau.');
    } finally {
      setLawyersLoading(false);
    }
  };

  // Xử lý khi chọn luật sư cho vụ án
  const handleAssignLawyer = async (lawyerId) => {
    try {
      setAssigningLawyer(true);

      // Hiển thị xác nhận
      confirm({
        title: 'Xác nhận chọn luật sư',
        content: 'Khi bạn chọn luật sư, vụ án sẽ được gửi đến luật sư để được tư vấn. Bạn có chắc chắn muốn tiếp tục?',
        okText: 'Xác nhận',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            const response = await legalCaseService.assignLawyer(id, lawyerId);

            if (response.success) {
              message.success('Đã gán luật sư thành công');
              // Cập nhật lại thông tin vụ án
              const updatedCase = await legalCaseService.getLegalCaseById(id);
              if (updatedCase.success) {
                setCaseData(updatedCase.data);
              }
            } else {
              message.error(response.message || 'Không thể gán luật sư');
            }
          } catch (error) {
            console.error('Lỗi khi gán luật sư:', error);
            message.error('Không thể gán luật sư. Vui lòng thử lại sau.');
          } finally {
            setAssigningLawyer(false);
          }
        },
        onCancel: () => {
          setAssigningLawyer(false);
        }
      });
    } catch (error) {
      console.error('Lỗi khi gán luật sư:', error);
      message.error('Không thể gán luật sư. Vui lòng thử lại sau.');
      setAssigningLawyer(false);
    }
  };

  // Xử lý tính phí vụ án
  const handleCalculateFee = async () => {
    try {
      setCalculatingFee(true);

      const parameters = {
        dispute_value: disputeValue
      };

      const response = await legalCaseService.calculateFee(id, parameters);

      if (response.success) {
        message.success('Đã tính phí thành công');

        // Cập nhật lại thông tin vụ án
        const updatedCase = await legalCaseService.getLegalCaseById(id);
        if (updatedCase.success) {
          setCaseData(updatedCase.data);
        }
      } else {
        message.error(response.message || 'Không thể tính phí');
      }
    } catch (error) {
      console.error('Lỗi khi tính phí vụ án:', error);
      message.error('Không thể tính phí vụ án. Vui lòng thử lại sau.');
    } finally {
      setCalculatingFee(false);
    }
  };

  // Xử lý thanh toán
  const handleCreatePayment = async (paymentMethod) => {
    try {
      setProcessingPayment(true);

      const response = await legalCaseService.createPayment(id, paymentMethod);

      if (response.success) {
        message.success('Đang chuyển hướng đến trang thanh toán...');

        // Chuyển hướng đến URL thanh toán
        window.location.href = response.data.payment_url;
      } else {
        message.error(response.message || 'Không thể tạo giao dịch thanh toán');
      }
    } catch (error) {
      console.error('Lỗi khi tạo giao dịch thanh toán:', error);
      message.error('Không thể tạo giao dịch thanh toán. Vui lòng thử lại sau.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Hiển thị icon tương ứng với loại file
  const renderFileIcon = (mimeType) => {
    if (mimeType && mimeType.includes('pdf')) {
      return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
    } else if (mimeType && (mimeType.includes('word') || mimeType.includes('document'))) {
      return <FileWordOutlined style={{ color: '#1890ff' }} />;
    } else if (mimeType && mimeType.includes('image')) {
      return <FileImageOutlined style={{ color: '#52c41a' }} />;
    } else {
      return <FileOutlined />;
    }
  };

  // Định dạng trạng thái vụ án
  const renderStatus = (status) => {
    switch (status) {
      case 'draft':
        return <Tag color="blue">Nháp</Tag>;
      case 'pending':
        return <Tag color="orange">Đang xử lý</Tag>;
      case 'paid':
        return <Tag color="green">Đã thanh toán</Tag>;
      case 'completed':
        return <Tag color="green">Hoàn thành</Tag>;
      case 'cancelled':
        return <Tag color="red">Đã hủy</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // Định dạng tiền tệ
  const formatCurrency = (amount) => {
    if (!amount) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return (
      <Layout className={styles.legalCaseLayout}>
        <Navbar />
        <Content className={styles.legalCaseContent}>
          <div className={styles.loadingContainer}>
            <Spin size="large" tip="Đang tải thông tin vụ án..." />
          </div>
        </Content>
      </Layout>
    );
  }

  if (!caseData) {
    return (
      <Layout className={styles.legalCaseLayout}>
        <Navbar />
        <Content className={styles.legalCaseContent}>
          <div className={styles.errorContainer}>
            <Title level={3}>Không tìm thấy thông tin vụ án</Title>
            <Button type="primary" onClick={() => navigate('/legal-cases')} size="large">
              Quay lại danh sách
            </Button>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <>
      <Navbar />
      <Layout className={styles.legalCaseLayout}>
        <Content className={styles.legalCaseContent}>
          <div className={styles.legalCaseDetail}>
            <div className={styles.pageHeader}>
              <Button
                type="link"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/legal-cases')}
                className={styles.backButton}
              >
                Quay lại danh sách
              </Button>
              <Title level={2}>Chi tiết vụ án</Title>
            </div>

            <Card className={styles.detailCard} bordered={false}>
              <div className={styles.caseHeader}>
                <div>
                  <Title level={3}>{caseData.title}</Title>
                  <Space size={12} className={styles.caseHeaderTags}>
                    {renderStatus(caseData.status)}
                    <Tag color="#3d5a80">{caseData.case_type}</Tag>
                    {caseData.is_ai_generated && <Tag color="purple">AI</Tag>}
                  </Space>
                </div>
                <Space className={styles.headerButtons}>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/legal-cases/${id}/edit`)}
                    className={styles.editButton}
                  >
                    Chỉnh sửa
                  </Button>

                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDeleteCase}
                    className={styles.deleteButton}
                  >
                    Xóa
                  </Button>
                </Space>
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Loại vụ án</span>
                  <span className={styles.infoValue}>{caseData.case_type}</span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Ngày tạo</span>
                  <span className={styles.infoValue}>{moment(caseData.created_at).format('DD/MM/YYYY HH:mm')}</span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Trạng thái</span>
                  <span className={styles.infoValue}>{renderStatus(caseData.status)}</span>
                </div>

                {caseData.lawyer && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Luật sư phụ trách</span>
                    <span className={styles.infoValue}>{caseData.lawyer.full_name}</span>
                  </div>
                )}

                {caseData.fee_amount && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Phí dịch vụ</span>
                    <span className={styles.infoValue}>{formatCurrency(caseData.fee_amount)}</span>
                  </div>
                )}
              </div>

              <Tabs
                className={styles.detailTabs}
                defaultActiveKey="details"
                items={[
                  {
                    key: 'details',
                    label: 'Chi tiết',
                    children: (
                      <div className={styles.tabContent}>
                        <Paragraph className={styles.caseDescription}>{caseData.description}</Paragraph>

                        {/* Hiển thị nội dung AI nếu có */}
                        {caseData.is_ai_generated && caseData.ai_content && (
                          <div className={styles.aiContentSection}>
                            <Divider orientation="left">
                              <span className={styles.dividerTitle}>Nội dung do AI soạn thảo</span>
                            </Divider>
                            <div className={styles.aiContent}>
                              {caseData.ai_content.split('\n').map((line, i) => (
                                <p key={i}>{line}</p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hiển thị tài liệu */}
                        {caseData.documents && caseData.documents.length > 0 && (
                          <div className={styles.documentSection}>
                            <Divider orientation="left">
                              <span className={styles.dividerTitle}>Tài liệu</span>
                            </Divider>
                            {caseData.documents.map(doc => (
                              <div key={doc.id} className={styles.documentItem}>
                                <div className={styles.documentIcon}>
                                  {renderFileIcon(doc.mime_type)}
                                </div>
                                <div className={styles.documentInfo}>
                                  <div className={styles.documentName}>{doc.original_name}</div>
                                </div>
                                <div className={styles.documentAction}>
                                  <Button
                                    type="primary"
                                    icon={<DownloadOutlined />}
                                    size="middle"
                                    onClick={() => handleDownloadDocument(doc.id)}
                                    className={styles.downloadButton}
                                  >
                                    Tải xuống
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'lawyer',
                    label: 'Luật sư',
                    children: (
                      <div className={styles.tabContent}>
                        {caseData.lawyer ? (
                          <div>
                            <Card bordered={false} className={styles.lawyerCard}>
                              <div className={styles.lawyerProfile}>
                                <Avatar size={80} icon={<UserOutlined />} src={caseData.lawyer.avatar_url} className={styles.lawyerAvatar} />
                                <div className={styles.lawyerInfo}>
                                  <Title level={4}>{caseData.lawyer.full_name}</Title>
                                  <Text type="secondary">{caseData.lawyer.email}</Text>
                                </div>
                              </div>
                              <Divider />
                              <Descriptions title="Thông tin luật sư" column={1} className={styles.lawyerDetails}>
                                <Descriptions.Item label="Chuyên môn">Dân sự, Hình sự</Descriptions.Item>
                                <Descriptions.Item label="Số năm kinh nghiệm">7 năm</Descriptions.Item>
                                <Descriptions.Item label="Đánh giá">
                                  <Rate disabled defaultValue={4.5} allowHalf />
                                </Descriptions.Item>
                              </Descriptions>
                            </Card>
                          </div>
                        ) : (
                          <div className={styles.assignLawyerSection}>
                            <Title level={4}>Chọn luật sư cho vụ án</Title>
                            <Paragraph className={styles.sectionDescription}>
                              Chọn một luật sư để được tư vấn và xử lý vụ án của bạn. Luật sư sẽ liên hệ với bạn sau khi được gán.
                            </Paragraph>

                            <Button
                              type="primary"
                              onClick={fetchLawyers}
                              loading={lawyersLoading}
                              size="large"
                              className={styles.primaryButton}
                            >
                              Xem danh sách luật sư
                            </Button>

                            {lawyers.length > 0 && (
                              <List
                                itemLayout="horizontal"
                                dataSource={lawyers}
                                className={styles.lawyerList}
                                renderItem={lawyer => (
                                  <div className={styles.lawyerItem}>
                                    <div className={styles.lawyerAvatar}>
                                      <Avatar size={64} icon={<UserOutlined />} src={lawyer.avatar_url} />
                                    </div>
                                    <div className={styles.lawyerInfo}>
                                      <div className={styles.lawyerName}>{lawyer.full_name}</div>
                                      <div className={styles.lawyerMeta}>
                                        {lawyer.specialization || 'Luật sư đa lĩnh vực'}
                                      </div>
                                      <div className={styles.lawyerRating}>
                                        <Rate disabled defaultValue={lawyer.average_rating || 4} allowHalf />
                                        <span className={styles.ratingCount}>
                                          {lawyer.average_rating || 4}/5 ({lawyer.review_count || 0} đánh giá)
                                        </span>
                                      </div>
                                    </div>
                                    <div className={styles.lawyerAction}>
                                      <Button
                                        type="primary"
                                        onClick={() => handleAssignLawyer(lawyer.id)}
                                        loading={assigningLawyer}
                                        className={styles.assignButton}
                                      >
                                        Chọn
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'payment',
                    label: 'Phí và thanh toán',
                    children: (
                      <div className={styles.tabContent}>
                        {caseData.fee_amount ? (
                          <div className={styles.paymentSection}>
                            <Title level={4}>Thông tin phí dịch vụ</Title>

                            <div className={styles.feeItem}>
                              <span>Phí cơ bản:</span>
                              <span>{formatCurrency(JSON.parse(caseData.fee_details).base_fee)}</span>
                            </div>

                            <div className={styles.feeItem}>
                              <span>Phí bổ sung:</span>
                              <span>{formatCurrency(JSON.parse(caseData.fee_details).additional_fee)}</span>
                            </div>

                            <div className={styles.feeTotal}>
                              <span>Tổng phí:</span>
                              <span>{formatCurrency(caseData.fee_amount)}</span>
                            </div>

                            {caseData.status !== 'paid' && (
                              <div className={styles.paymentButton}>
                                <Button
                                  type="primary"
                                  icon={<DollarOutlined />}
                                  onClick={() => handleCreatePayment('credit_card')}
                                  loading={processingPayment}
                                  disabled={!caseData.lawyer}
                                  size="large"
                                  className={styles.primaryButton}
                                >
                                  Thanh toán ngay
                                </Button>
                                {!caseData.lawyer && (
                                  <div className={styles.paymentWarning}>
                                    Vui lòng chọn luật sư trước khi thanh toán
                                  </div>
                                )}
                              </div>
                            )}

                            {caseData.status === 'paid' && (
                              <div className={styles.paidStatus}>
                                <Tag color="green" icon={<CheckCircleOutlined />}>Đã thanh toán</Tag>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={styles.calculateFeeSection}>
                            <Title level={4}>Tính phí dịch vụ</Title>
                            <Paragraph className={styles.sectionDescription}>
                              Nhập giá trị tranh chấp (nếu có) để tính phí dịch vụ. Phí sẽ được tính dựa trên loại vụ án và các thông số bổ sung.
                            </Paragraph>

                            <Space direction="vertical" style={{ width: '100%' }} size="large">
                              <div className={styles.disputeValueInput}>
                                <span className={styles.inputLabel}>Giá trị tranh chấp (VNĐ):</span>
                                <InputNumber
                                  className={styles.amountInput}
                                  min={0}
                                  step={1000000}
                                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                  value={disputeValue}
                                  onChange={value => setDisputeValue(value)}
                                  size="large"
                                />
                              </div>

                              <Button
                                type="primary"
                                onClick={handleCalculateFee}
                                loading={calculatingFee}
                                disabled={!caseData.lawyer}
                                size="large"
                                className={styles.primaryButton}
                              >
                                Tính phí
                              </Button>

                              {!caseData.lawyer && (
                                <div className={styles.paymentWarning}>
                                  Vui lòng chọn luật sư trước khi tính phí
                                </div>
                              )}
                            </Space>
                          </div>
                        )}
                      </div>
                    )
                  }
                ]}
              />
            </Card>
          </div>
        </Content>
      </Layout></>
  );
};

export default LegalCaseDetail; 