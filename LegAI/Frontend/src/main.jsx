import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import AppRouter from './router';
// import ChatManager from './components/layout/ChatManager';
// chưa cần ChatManager

import './styles/global.css';

document.documentElement.style.setProperty('--primary-color', '#ffcc00');
document.documentElement.style.setProperty('--secondary-color', '#333');
document.documentElement.style.setProperty('--text-light', '#ffffff');
document.documentElement.style.setProperty('--text-dark', '#333333');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <div className="app-container">
        <AppRouter />
        {/* <ChatManager /> */}
      </div>
    </BrowserRouter>
  </React.StrictMode>
);