import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import AppRouter from './router';
import { emailjsInit } from './services/emailService';
import { ToastContainer } from 'react-toastify'; // Add this
import 'react-toastify/dist/ReactToastify.css'; // Add this
import './styles/global.css';
import { checkTokenExpiration } from './config/axios';

// Khởi tạo EmailJS
emailjsInit();

// Kiểm tra token hết hạn khi ứng dụng khởi động
checkTokenExpiration();

document.documentElement.style.setProperty('--primary-color', '#ffcc00');
document.documentElement.style.setProperty('--secondary-color', '#333');
document.documentElement.style.setProperty('--text-light', '#ffffff');
document.documentElement.style.setProperty('--text-dark', '#333333');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastContainer /> {/* Add this */}
      <App />
      <div className="app-container">
        <AppRouter />
      </div>
    </BrowserRouter>
  </React.StrictMode>
);