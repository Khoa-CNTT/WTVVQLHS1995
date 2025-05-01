import React from 'react';
import { Layout, Breadcrumb } from 'antd';
import PaymentForm from './PaymentForm';
import { HomeOutlined, DollarOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Content } = Layout;

const Payment = () => {
  return (
    <Layout className="site-layout">
      <Content style={{ padding: '0 50px' }}>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item>
            <Link to="/">
              <HomeOutlined /> Trang chủ
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <DollarOutlined /> Thanh toán
          </Breadcrumb.Item>
        </Breadcrumb>
        
        <div style={{ minHeight: 'calc(100vh - 260px)' }}>
          <PaymentForm />
        </div>
      </Content>
    </Layout>
  );
};

export default Payment; 