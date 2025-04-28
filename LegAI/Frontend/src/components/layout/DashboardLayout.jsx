import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Nav/Navbar';
import SideMenu from './Nav/SideMenu';
import ChatWindow from './Chat/ChatWindow';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard-container">
      <Navbar showDashboardControls={true} onToggleSidebar={toggleSidebar} />
      
      <div className="dashboard-content">
        <SideMenu isOpen={isSidebarOpen} />
        
        <main className={`dashboard-main ${isSidebarOpen ? 'with-sidebar' : 'without-sidebar'}`}>
          <Outlet />
        </main>
      </div>
      
      <ChatWindow id="dashboard" chatType="ai" isOpen={false} onClose={() => {}} />
    </div>
  );
};

export default DashboardLayout; 