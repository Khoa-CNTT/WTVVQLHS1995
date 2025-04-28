import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>LegAI</h3>
          <p>Hỗ trợ pháp lý thông minh với công nghệ AI</p>
        </div>
        
        <div className="footer-section">
          <h4>Liên kết nhanh</h4>
          <ul>
            <li><Link to="/">Trang chủ</Link></li>
            <li><Link to="/about">Về chúng tôi</Link></li>
            <li><Link to="/documents">Tài liệu pháp lý</Link></li>
            <li><Link to="/templates">Mẫu hợp đồng</Link></li>
            <li><Link to="/ai-consult">Tư vấn AI</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Liên hệ</h4>
          <address>
            <p>Email: support@legai.vn</p>
            <p>Điện thoại: (+84) 123-456-789</p>
            <p>Địa chỉ: Hà Nội, Việt Nam</p>
          </address>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} LegAI. Bảo lưu mọi quyền.</p>
      </div>
    </footer>
  );
};

export default Footer; 