import React from 'react';
import { NavLink } from 'react-router-dom';
import { Gift, Users, Upload, History, Settings, Home } from 'lucide-react';

export default function SidebarAdmin() {
  const base = "flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-white/5";
  const active = "bg-white/10 text-red-500";
  return (
    <aside className="w-64 h-full border-r border-white/10 p-4 bg-gray-900/40">
      <div className="text-sm text-gray-400 px-1 mb-3">Administrador</div>
      <nav className="space-y-1">
        <NavLink to="/admin" end className={({isActive})=>`${base} ${isActive?active:''}`}>
          <Home size={18}/> <span>Inicio</span>
        </NavLink>
        <NavLink to="/admin/usuarios" className={({isActive})=>`${base} ${isActive?active:''}`}>
          <Users size={18}/> <span>Usuarios</span>
        </NavLink>
        <NavLink to="/admin/recompensas" className={({isActive})=>`${base} ${isActive?active:''}`}>
          <Gift size={18}/> <span>Recompensas</span>
        </NavLink>
        <NavLink to="/admin/upload" className={({isActive})=>`${base} ${isActive?active:''}`}>
          <Upload size={18}/> <span>Subir Puntos</span>
        </NavLink>
        <NavLink to="/admin/historial" className={({isActive})=>`${base} ${isActive?active:''}`}>
          <History size={18}/> <span>Historial</span>
        </NavLink>
        <NavLink to="/admin/config" className={({isActive})=>`${base} ${isActive?active:''}`}>
          <Settings size={18}/> <span>Configuración</span>
        </NavLink>
      </nav>
    </aside>
  );
}