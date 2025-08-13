import React from 'react';
import SidebarDriver from '../components/SidebarDriver';
import { Outlet } from 'react-router-dom';

export default function DriverLayout() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      <SidebarDriver />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}