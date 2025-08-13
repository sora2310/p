import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';

import AdminOnlyRoute from './components/AdminOnlyRoute';
import DriverOnlyRoute from './components/DriverOnlyRoute';

import AdminLayout from './layouts/AdminLayout';
import DriverLayout from './layouts/DriverLayout';

import AdminHome from './pages/admin/Home';
import Usuarios from './pages/admin/Usuarios';
import Recompensas from './pages/admin/Recompensas';
import UploadPuntos from './pages/admin/Upload';
import Historial from './pages/admin/Historial';
import Config from './pages/admin/Config';

import Panel from './pages/Panel';
import PuntosCambio from './pages/PuntosCambio';
import MiCuenta from './pages/MiCuenta';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Contacto from './pages/Contacto';

export default function App() {
  const [checking, setChecking] = React.useState(true);
  const [logged, setLogged] = React.useState(false);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setLogged(!!u);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) return <div className="min-h-screen grid place-items-center text-gray-500">Cargando...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {!logged ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            {/* Admin */}
            <Route path="/admin" element={<AdminOnlyRoute><AdminLayout /></AdminOnlyRoute>}>
              <Route index element={<AdminHome />} />
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="recompensas" element={<Recompensas />} />
              <Route path="upload" element={<UploadPuntos />} />
              <Route path="historial" element={<Historial />} />
              <Route path="config" element={<Config />} />
            </Route>

            {/* Driver */}
            <Route path="/" element={<DriverOnlyRoute><DriverLayout /></DriverOnlyRoute>}>
              <Route index element={<Navigate to="/panel" replace />} />
              <Route path="panel" element={<Panel />} />
              <Route path="puntos-cambio" element={<PuntosCambio />} />
              <Route path="mi-cuenta" element={<MiCuenta />} />
              <Route path="contacto" element={<Contacto />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/panel" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}