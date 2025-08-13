import React from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

type Props = { children: React.ReactNode };

export default function AdminOnlyRoute({ children }: Props) {
  const [status, setStatus] = React.useState<'checking'|'allowed'|'denied'>('checking');

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u: User | null) => {
      if (!u) { setStatus('denied'); return; }
      try {
        // 1) Leer localStorage (compat con tu implementación anterior)
        const localRole = (typeof window !== 'undefined' && window.localStorage.getItem('rol')) || null;
        let role: string | null = localRole;

        // 2) Intentar Firestore
        try {
          const snap = await getDoc(doc(db, 'roles', u.uid));
          if (snap.exists()) {
            role = (snap.data() as any).role || role;
            if (typeof window !== 'undefined' && role) window.localStorage.setItem('rol', String(role));
          }
        } catch {}

        if (!role) role = 'driver'; // por defecto

        setStatus(role === 'admin' ? 'allowed' : 'denied');
      } catch (e) {
        setStatus('denied');
      }
    });
    return () => unsub();
  }, []);

  if (status === 'checking') {
    return <div className="min-h-screen grid place-items-center text-gray-500">Verificando...</div>;
  }
  if (status === 'denied') return <Navigate to="/panel" replace />;
  return <>{children}</>;
}