import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User, Ticket } from 'lucide-react';

export default function SidebarDriver() {
  const base = "flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-white/5";
  const active = "bg-white/10 text-red-500";
  return (
    <aside className="w-64 h-full border-r border-white/10 p-4 bg-gray-900/40">
      <div className="text-sm text-gray-400 px-1 mb-3">Conductor</div>
      <nav className="space-y-1">
        <NavLink to="/panel" end className={({isActive})=>`${base} ${isActive?active:''}`}>
          <Home size={18}/> <span>Inicio</span>
        </NavLink>
        <NavLink to="/puntos-cambio" className={({isActive})=>`${base} ${isActive?active:''}`}>
          <Ticket size={18}/> <span>Puntos y Cambios</span>
        </NavLink>
        <NavLink to="/mi-cuenta" className={({isActive})=>`${base} ${isActive?active:''}`}>
          <User size={18}/> <span>Mi Cuenta</span>
        </NavLink>
      </nav>
    </aside>
  );
}