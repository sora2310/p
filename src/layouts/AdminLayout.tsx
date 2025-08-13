import React from 'react';
import SidebarAdmin from '../components/SidebarAdmin';
import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      <SidebarAdmin />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}