import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import PaymentForm from './PaymentForm';
import PaymentGuide from './PaymentGuide';
import { Button, Typography, Result } from 'antd';
import { QuestionCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [invalidTransaction, setInvalidTransaction] = useState(false);
  
  // Kiểm tra tham số transaction_id khi component được tải
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const transactionId = searchParams.get('transaction_id');
    
    // Kiểm tra xem transaction_id có hợp lệ không
    if (location.pathname === '/payment' && (!transactionId || transactionId === 'undefined' || transactionId === 'null')) {
      // Nếu có amount, vẫn hiển thị form thanh toán
      const amount = searchParams.get('amount');
      if (!amount) {
        setInvalidTransaction(true);
      }
    } else {
      setInvalidTransaction(false);
    }
  }, [location]);

  // Hiển thị thông báo lỗi nếu không có giao dịch hợp lệ
  if (invalidTransaction && location.pathname === '/payment') {
    return (
      <Result
        status="warning"
        title="Thông tin giao dịch không hợp lệ"
        subTitle="Không tìm thấy thông tin giao dịch hoặc thông tin giao dịch không đúng định dạng."
        extra={[
          <Button type="primary" key="home" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>,
          <Button key="legal-cases" onClick={() => navigate('/legal-cases')}>
            Xem vụ án của tôi
          </Button>,
        ]}
      />
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ 
        position: 'absolute', 
        top: 20, 
        right: 20, 
        zIndex: 1000 
      }}>
        <Button 
          type="default" 
          icon={<QuestionCircleOutlined />}
          onClick={() => navigate('/payment/guide')}
        >
          Hướng dẫn thanh toán
        </Button>
      </div>
      
      <Routes>
        <Route path="/" element={<PaymentForm />} />
        <Route path="/guide" element={<PaymentGuide />} />
      </Routes>
    </div>
  );
};

export default Payment; 