import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Nav/Navbar';
import Footer from './Nav/Footer';
import ChatWindow from './Chat/ChatWindow';
import { Toaster } from 'react-hot-toast';

const AppLayout = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
      <Toaster position="top-right" />
      <ChatWindow id="default" chatType="ai" isOpen={false} onClose={() => {}} />
    </div>
  );
};

export default AppLayout; 