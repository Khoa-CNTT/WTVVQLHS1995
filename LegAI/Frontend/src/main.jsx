import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/global.css';
import { checkTokenExpiration } from './config/axios';


// Kiểm tra token hết hạn khi ứng dụng khởi động
checkTokenExpiration();

document.documentElement.style.setProperty('--primary-color', '#ffcc00');
document.documentElement.style.setProperty('--secondary-color', '#333');
document.documentElement.style.setProperty('--text-light', '#ffffff');
document.documentElement.style.setProperty('--text-dark', '#333333');

// Ẩn cảnh báo React về key trùng lặp trong development mode
const originalConsoleError = console.error;
console.error = function(msg) {
  if (typeof msg === 'string' && 
      (msg.includes('Encountered two children with the same key') || 
       msg.includes('Non-unique keys'))) {
    return;
  }
  originalConsoleError.apply(console, arguments);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastContainer />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);