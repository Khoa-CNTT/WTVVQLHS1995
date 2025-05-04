import React from 'react';
import { Card, Typography, Steps, Divider, Row, Col, Alert, Button } from 'antd';
import { 
  MobileOutlined, QrcodeOutlined, CheckCircleOutlined, 
  BankOutlined, DollarOutlined, ArrowLeftOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from './PaymentForm.module.css';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

const PaymentGuide = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.paymentFormContainer}>
      <Card className={styles.paymentCard}>
        <div className={styles.paymentHeader}>
          <Button 
            type="link" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
            style={{ padding: 0, marginBottom: 16 }}
          >
            Quay lại
          </Button>
          <Title level={2}>Hướng dẫn thanh toán qua mã QR</Title>
        </div>

        <Alert
          message="Thanh toán an toàn và tiện lợi"
          description="Thanh toán qua mã QR là phương thức thanh toán nhanh chóng, an toàn và không tốn phí. Số tiền sẽ được chuyển trực tiếp vào tài khoản của luật sư xử lý vụ án của bạn."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Steps direction="vertical" current={-1}>
          <Step 
            title="Mở ứng dụng ngân hàng trên điện thoại của bạn" 
            description={
              <div>
                <Paragraph>
                  Đăng nhập vào ứng dụng ngân hàng mà bạn đang sử dụng như VCB-Mobile Banking, BIDV SmartBanking, MB Bank, Techcombank, VPBank, ACB...
                </Paragraph>
                <Paragraph type="secondary">
                  <MobileOutlined /> Đảm bảo bạn đã cài đặt và đăng nhập vào ứng dụng ngân hàng của mình.
                </Paragraph>
              </div>
            }
            icon={<MobileOutlined />}
          />
          
          <Step 
            title="Tìm chức năng quét mã QR" 
            description={
              <div>
                <Paragraph>
                  Trong ứng dụng ngân hàng, tìm chức năng "Quét mã QR" hoặc "Thanh toán bằng QR".
                </Paragraph>
                <Paragraph type="secondary">
                  <QrcodeOutlined /> Thông thường, nút quét mã QR sẽ được đặt ở vị trí dễ thấy trong ứng dụng.
                </Paragraph>
              </div>
            }
            icon={<QrcodeOutlined />}
          />
          
          <Step 
            title="Quét mã QR trên màn hình máy tính" 
            description={
              <div>
                <Paragraph>
                  Dùng camera của điện thoại quét mã QR được hiển thị trên màn hình máy tính.
                </Paragraph>
                <Paragraph>
                  <Text strong>Lưu ý:</Text> Bạn cũng có thể tải mã QR bằng cách nhấn nút "Tải xuống mã QR" và quét ảnh đã tải xuống.
                </Paragraph>
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col span={12} style={{ textAlign: 'center' }}>
                    <div style={{ 
                      border: '1px dashed #d9d9d9', 
                      padding: 16, 
                      borderRadius: 8, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center' 
                    }}>
                      <QrcodeOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
                      <Text>Mã QR trên màn hình</Text>
                    </div>
                  </Col>
                  <Col span={12} style={{ textAlign: 'center' }}>
                    <div style={{ 
                      border: '1px dashed #d9d9d9', 
                      padding: 16, 
                      borderRadius: 8, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center'
                    }}>
                      <MobileOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
                      <Text>Camera điện thoại</Text>
                    </div>
                  </Col>
                </Row>
              </div>
            }
            icon={<BankOutlined />}
          />
          
          <Step 
            title="Kiểm tra thông tin thanh toán" 
            description={
              <div>
                <Paragraph>
                  Sau khi quét mã, kiểm tra lại thông tin hiển thị trên ứng dụng ngân hàng:
                </Paragraph>
                <ul>
                  <li>Tên người thụ hưởng (tên luật sư hoặc công ty LegAI)</li>
                  <li>Số tài khoản</li>
                  <li>Số tiền cần thanh toán</li>
                  <li>Nội dung chuyển khoản (mã vụ án)</li>
                </ul>
                <Alert
                  message="Chú ý"
                  description="Vui lòng không thay đổi nội dung chuyển khoản để hệ thống có thể xác nhận giao dịch của bạn một cách chính xác."
                  type="warning"
                  showIcon
                  style={{ marginTop: 16, marginBottom: 16 }}
                />
              </div>
            }
            icon={<DollarOutlined />}
          />
          
          <Step 
            title="Xác nhận thanh toán" 
            description={
              <div>
                <Paragraph>
                  Xác nhận và hoàn tất giao dịch theo hướng dẫn của ứng dụng ngân hàng. Quá trình này có thể yêu cầu bạn nhập mã PIN hoặc xác thực sinh trắc học (vân tay, khuôn mặt).
                </Paragraph>
                <Paragraph type="secondary">
                  <CheckCircleOutlined /> Sau khi thanh toán thành công, bạn sẽ nhận được thông báo xác nhận từ ngân hàng.
                </Paragraph>
              </div>
            }
            icon={<CheckCircleOutlined />}
          />
          
          <Step 
            title="Xác nhận trên hệ thống LegAI" 
            description={
              <div>
                <Paragraph>
                  Quay lại màn hình thanh toán trên LegAI và nhấn nút "Xác nhận đã thanh toán" để hoàn tất quá trình thanh toán.
                </Paragraph>
                <Paragraph type="secondary">
                  Hệ thống sẽ cập nhật trạng thái thanh toán của bạn và gửi thông báo đến luật sư phụ trách vụ án.
                </Paragraph>
              </div>
            }
          />
        </Steps>

        <Divider />

        <Title level={4}>Các câu hỏi thường gặp</Title>

        <Paragraph>
          <Text strong>1. Tôi không thấy chức năng quét mã QR trong ứng dụng ngân hàng?</Text>
          <br />
          Một số ứng dụng ngân hàng có thể đặt chức năng quét mã QR dưới các tên khác như "QR Pay", "Thanh toán", "Chuyển tiền qua QR"... Vui lòng kiểm tra menu chính hoặc tham khảo hướng dẫn sử dụng của ngân hàng bạn đang sử dụng.
        </Paragraph>

        <Paragraph>
          <Text strong>2. Tôi đã chuyển khoản nhưng hệ thống chưa cập nhật?</Text>
          <br />
          Việc xác nhận giao dịch có thể mất từ vài giây đến vài phút tùy thuộc vào hệ thống ngân hàng. Nếu sau 15 phút giao dịch của bạn vẫn chưa được cập nhật, vui lòng nhấn nút "Xác nhận đã thanh toán" và cung cấp thông tin giao dịch.
        </Paragraph>

        <Paragraph>
          <Text strong>3. Tôi có thể sử dụng phương thức thanh toán khác?</Text>
          <br />
          Hiện tại, chúng tôi hỗ trợ thanh toán qua mã QR là phương thức chính vì tính an toàn và tiện lợi. Nếu bạn gặp khó khăn trong quá trình thanh toán, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi để được trợ giúp.
        </Paragraph>

        <Divider />

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button type="primary" size="large" onClick={() => navigate(-1)}>
            Quay lại trang thanh toán
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PaymentGuide; 