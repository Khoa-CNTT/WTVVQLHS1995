import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Layout, 
  Typography, 
  Row, 
  Col, 
  Card, 
  Divider, 
  Space, 
  Collapse, 
  Button, 
  Tag
} from 'antd';
import { 
  PhoneOutlined, 
  MailOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined,
  MessageOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import Navbar from '../../components/layout/Nav/Navbar';
import PageTransition from '../../components/layout/TransitionPage/PageTransition';
import ChatManager from '../../components/layout/Chat/ChatManager';
import ContactForm from './ContactForm';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

function Contact() {
  // Danh sách văn phòng
  const offices = [
    {
      name: 'Trụ sở chính - TP. Hồ Chí Minh',
      address: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh',
      phone: '(+84) 12 34 56 789',
      email: 'hcm@legai.vn',
      hours: 'Thứ 2 - Thứ 6: 8:00 - 17:30, Thứ 7: 8:00 - 12:00'
    },
    {
      name: 'Văn phòng Hà Nội',
      address: '96 Định Công, Phường Định Công, Quận Hoàng Mai, Hà Nội',
      phone: '(+84) 12 34 56 789',
      email: 'hanoi@legai.vn',
      hours: 'Thứ 2 - Thứ 6: 8:00 - 17:30, Thứ 7: 8:00 - 12:00'
    },
    {
      name: 'Văn phòng Đà Nẵng',
      address: '123 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng',
      phone: '(+84) 12 34 56 789',
      email: 'danang@legai.vn',
      hours: 'Thứ 2 - Thứ 6: 8:00 - 17:30'
    }
  ];

  return (
    <PageTransition>
        <Navbar />
        <Layout>

        {/* Banner */}
        <div style={{ 
          height: '50vh', 
          minHeight: '300px', 
          backgroundImage: 'url("https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?q=80&w=2942&auto=format&fit=crop")', 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <div style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to right, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6))',
            zIndex: 1
          }}></div>
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 20px', maxWidth: '800px' }}>
            <Title level={1} style={{ color: 'white', marginBottom: '1rem', fontSize: '3.5rem', fontWeight: 700 }}>
              Liên Hệ Với Chúng Tôi
            </Title>
            <Paragraph style={{ color: 'white', fontSize: '1.2rem' }}>
              Chúng tôi luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc của bạn
            </Paragraph>
          </div>
        </div>
        
        <Content>
          {/* Thông tin liên hệ */}
          <section style={{ padding: '80px 0', backgroundColor: '#f8f8f8' }}>
            <Row justify="center">
              <Col xs={22} sm={22} md={20} lg={18} xl={16}>
                <Row gutter={[30, 30]}>
                  <Col xs={24} sm={12} md={6}>
                    <Card 
                      hoverable 
                      style={{ height: '100%', textAlign: 'center' }}
                      bodyStyle={{ padding: '30px' }}
                    >
                      <Space direction="vertical" size="middle" align="center">
                        <div style={{
                          width: '70px',
                          height: '70px',
                          background: 'linear-gradient(135deg, #ffcc00, #ff9900)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <PhoneOutlined style={{ fontSize: '1.8rem', color: 'white' }} />
                        </div>
                        <Title level={3}>Điện thoại</Title>
                        <Space direction="vertical" size={2}>
                          <Text>(+84) 12 34 56 789</Text>
                          <Text>(+84) 12 34 56 789</Text>
                        </Space>
                      </Space>
                    </Card>
                  </Col>
                  
                  <Col xs={24} sm={12} md={6}>
                    <Card 
                      hoverable 
                      style={{ height: '100%', textAlign: 'center' }}
                      bodyStyle={{ padding: '30px' }}
                    >
                      <Space direction="vertical" size="middle" align="center">
                        <div style={{
                          width: '70px',
                          height: '70px',
                          background: 'linear-gradient(135deg, #ffcc00, #ff9900)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <MailOutlined style={{ fontSize: '1.8rem', color: 'white' }} />
                        </div>
                        <Title level={3}>Email</Title>
                        <Space direction="vertical" size={2}>
                          <Text>phapluatlegai@gmail.com</Text>
                          <Text>phapluatlegai@gmail.com</Text>
                        </Space>
                      </Space>
                    </Card>
                  </Col>
                  
                  <Col xs={24} sm={12} md={6}>
                    <Card 
                      hoverable 
                      style={{ height: '100%', textAlign: 'center' }}
                      bodyStyle={{ padding: '30px' }}
                    >
                      <Space direction="vertical" size="middle" align="center">
                        <div style={{
                          width: '70px',
                          height: '70px',
                          background: 'linear-gradient(135deg, #ffcc00, #ff9900)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <EnvironmentOutlined style={{ fontSize: '1.8rem', color: 'white' }} />
                        </div>
                        <Title level={3}>Địa chỉ</Title>
                        <Space direction="vertical" size={2}>
                          <Text>03 Quang Trung, Đà Nẵng</Text>
                          <Text>Đại học Duy Tân</Text>
                        </Space>
                      </Space>
                    </Card>
                  </Col>
                  
                  <Col xs={24} sm={12} md={6}>
                    <Card 
                      hoverable 
                      style={{ height: '100%', textAlign: 'center' }}
                      bodyStyle={{ padding: '30px' }}
                    >
                      <Space direction="vertical" size="middle" align="center">
                        <div style={{
                          width: '70px',
                          height: '70px',
                          background: 'linear-gradient(135deg, #ffcc00, #ff9900)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <ClockCircleOutlined style={{ fontSize: '1.8rem', color: 'white' }} />
                        </div>
                        <Title level={3}>Giờ làm việc</Title>
                        <Space direction="vertical" size={2}>
                          <Text>Thứ 2 - Thứ 6: 8:00 - 17:30</Text>
                          <Text>Thứ 7: 8:00 - 12:00</Text>
                        </Space>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
          </section>
          
          {/* Form liên hệ và bản đồ */}
          <section style={{ padding: '80px 0', backgroundColor: 'white' }}>
            <Row justify="center">
              <Col xs={22} sm={22} md={20} lg={18} xl={16}>
                <Row gutter={[50, 50]}>
                  <Col xs={24} md={12}>
                    <ContactForm />
                  </Col>
                  
                  <Col xs={24} md={12}>
                    <Card style={{ height: '100%', padding: 0, overflow: 'hidden' }}>
                      <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.5177580776767!2d106.65842937465815!3d10.773374089387625!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752ec3c161a3fb%3A0xef77cd47a1cc691e!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBCw6FjaCBraG9hIC0gxJDhuqFpIGjhu41jIFF14buRYyBnaWEgVFAuSENN!5e0!3m2!1svi!2s!4v1680955978975!5m2!1svi!2s" 
                        width="100%" 
                        height="500" 
                        style={{ border: 0 }} 
                        allowFullScreen="" 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Bản đồ LegAI"
                      ></iframe>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
          </section>
          
          {/* Danh sách văn phòng */}
          <section style={{ padding: '80px 0', backgroundColor: '#f8f8f8' }}>
            <Row justify="center">
              <Col xs={22} sm={22} md={20} lg={18} xl={16}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                  <Title level={2} style={{ textTransform: 'uppercase', marginBottom: '15px' }}>
                    Văn phòng của chúng tôi
                  </Title>
                  <div style={{ 
                    width: '80px', 
                    height: '4px', 
                    background: 'linear-gradient(to right, #ffcc00, #ff9900)', 
                    margin: '0 auto 15px' 
                  }}></div>
                  <Paragraph>Chúng tôi có mặt trên toàn quốc để phục vụ nhu cầu của bạn</Paragraph>
                </div>
                
                <Row gutter={[30, 30]}>
                  {offices.map((office, index) => (
                    <Col xs={24} sm={12} lg={8} key={index}>
                      <Card hoverable style={{ height: '100%' }}>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                          <Title level={3} style={{ 
                            textAlign: 'center', 
                            borderBottom: '2px solid #ffcc00',
                            paddingBottom: '15px'
                          }}>
                            {office.name}
                          </Title>
                          
                          <Space align="start">
                            <EnvironmentOutlined style={{ color: '#ffcc00', fontSize: '1.2rem' }} />
                            <Text>{office.address}</Text>
                          </Space>
                          
                          <Space align="start">
                            <PhoneOutlined style={{ color: '#ffcc00', fontSize: '1.2rem' }} />
                            <Text>{office.phone}</Text>
                          </Space>
                          
                          <Space align="start">
                            <MailOutlined style={{ color: '#ffcc00', fontSize: '1.2rem' }} />
                            <Text>{office.email}</Text>
                          </Space>
                          
                          <Space align="start">
                            <ClockCircleOutlined style={{ color: '#ffcc00', fontSize: '1.2rem' }} />
                            <Text>{office.hours}</Text>
                          </Space>
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </section>
          
          {/* FAQ Section */}
          <section style={{ padding: '80px 0', backgroundColor: 'white' }}>
            <Row justify="center">
              <Col xs={22} sm={22} md={20} lg={18} xl={16}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                  <Title level={2} style={{ textTransform: 'uppercase', marginBottom: '15px' }}>
                    Câu hỏi thường gặp
                  </Title>
                  <div style={{ 
                    width: '80px', 
                    height: '4px', 
                    background: 'linear-gradient(to right, #ffcc00, #ff9900)', 
                    margin: '0 auto 15px' 
                  }}></div>
                  <Paragraph>Một số câu hỏi phổ biến từ khách hàng</Paragraph>
                </div>
                
                <Collapse 
                  defaultActiveKey={['1']}
                  expandIconPosition="end"
                  style={{ background: 'white' }}
                >
                  <Panel 
                    header="Làm thế nào để đặt lịch hẹn với luật sư?" 
                    key="1" 
                    style={{ borderLeft: '4px solid #ffcc00' }}
                  >
                    <Paragraph>
                      Bạn có thể đặt lịch hẹn bằng cách gọi điện theo số hotline, gửi email, hoặc điền vào form liên hệ trên trang web này. Chúng tôi sẽ liên hệ lại và sắp xếp cuộc hẹn phù hợp với thời gian của bạn.
                    </Paragraph>
                  </Panel>
                  
                  <Panel 
                    header="Chi phí tư vấn pháp lý như thế nào?" 
                    key="2" 
                    style={{ borderLeft: '4px solid #ffcc00' }}
                  >
                    <Paragraph>
                      Chi phí tư vấn phụ thuộc vào loại vụ việc và phạm vi công việc. Chúng tôi có nhiều gói dịch vụ khác nhau phù hợp với từng nhu cầu. Vui lòng liên hệ với chúng tôi để được tư vấn chi tiết về chi phí.
                    </Paragraph>
                  </Panel>
                  
                  <Panel 
                    header="Tôi có thể tư vấn trực tuyến được không?" 
                    key="3" 
                    style={{ borderLeft: '4px solid #ffcc00' }}
                  >
                    <Paragraph>
                      Có, chúng tôi cung cấp dịch vụ tư vấn trực tuyến qua video call hoặc chat. Bạn có thể tiết kiệm thời gian đi lại và nhận tư vấn từ bất kỳ đâu. Hãy liên hệ để được hướng dẫn.
                    </Paragraph>
                  </Panel>
                  
                  <Panel 
                    header="Các lĩnh vực pháp luật nào LegAI đang hỗ trợ?" 
                    key="4" 
                    style={{ borderLeft: '4px solid #ffcc00' }}
                  >
                    <Paragraph>
                      Chúng tôi cung cấp dịch vụ tư vấn trong nhiều lĩnh vực bao gồm: Doanh nghiệp, Dân sự, Hành chính, Hình sự, Lao động, Sở hữu trí tuệ, Đất đai và nhiều lĩnh vực khác.
                    </Paragraph>
                  </Panel>
                </Collapse>
              </Col>
            </Row>
          </section>
          
          {/* CTA Section */}
          <section style={{ 
            position: 'relative',
            padding: '80px 0',
            backgroundImage: 'url("https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?q=80&w=2942&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: 'white'
          }}>
            <div style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to right, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.7))',
              zIndex: 1
            }}></div>
            
            <Row justify="center" style={{ position: 'relative', zIndex: 2 }}>
              <Col xs={22} sm={22} md={20} lg={18} xl={16}>
                <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                  <Title level={2} style={{ color: 'white', marginBottom: '15px' }}>
                    Bạn cần tư vấn pháp lý ngay lập tức?
                  </Title>
                  <Paragraph style={{ fontSize: '1.2rem', color: 'white', marginBottom: '30px' }}>
                    Đội ngũ luật sư của chúng tôi sẵn sàng hỗ trợ bạn 24/7
                  </Paragraph>
                  
                  <Space size="large" wrap style={{ justifyContent: 'center' }}>
                    <Button 
                      type="ghost" 
                      size="large" 
                      icon={<PhoneOutlined />} 
                      style={{ 
                        border: '2px solid white',
                        color: 'white', 
                        height: 'auto',
                        padding: '10px 20px'
                      }}
                      ghost
                      href="tel:+842838647256"
                    >
                      (+84) 28 3864 7256
                    </Button>
                    
                    <Button 
                      type="primary" 
                      size="large" 
                      icon={<MessageOutlined />} 
                      style={{ 
                        background: '#ffcc00',
                        borderColor: '#ffcc00',
                        color: 'black',
                        height: 'auto',
                        padding: '10px 20px'
                      }}
                      onClick={() => {
                        const event = new CustomEvent('toggleChat', { 
                          detail: { action: 'open' } 
                        });
                        window.dispatchEvent(event);
                      }}
                    >
                      Chat với tư vấn viên
                    </Button>
                  </Space>
                </div>
              </Col>
            </Row>
          </section>
        </Content>
        
        <ChatManager />
      </Layout>
    </PageTransition>
  );
}

export default Contact; 