import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-shell__main">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
