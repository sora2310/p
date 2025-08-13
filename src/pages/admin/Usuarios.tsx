
import React from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Search, Plus, Crown, User as UserIcon } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';

type UserRow = {
  id: string;
  displayName?: string;
  email?: string;
  puntos?: number;
  puntosHoy?: number;
  puntosSemana?: number;
  role?: 'admin' | 'driver';
};

export default function Usuarios() {
  const [rows, setRows] = React.useState<UserRow[]>([]);
  const [filter, setFilter] = React.useState('');
  const [adjustOpen, setAdjustOpen] = React.useState<null | UserRow>(null);
  const [delta, setDelta] = React.useState<number>(0);
  const [roleOpen, setRoleOpen] = React.useState<null | UserRow>(null);
  const [newRole, setNewRole] = React.useState<'admin'|'driver'>('driver');

  React.useEffect(() => {
    const q = query(collection(db, 'usuarios'), orderBy('puntos', 'desc'), limit(200));
    const unsub = onSnapshot(q, snap => {
      setRows(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, []);

  const filtered = rows.filter(r => {
    const s = filter.trim().toLowerCase();
    if (!s) return true;
    return (r.email ?? '').toLowerCase().includes(s) || (r.displayName ?? '').toLowerCase().includes(s);
  });

  async function applyAdjust(u: UserRow) {
    if (!delta) { setAdjustOpen(null); return; }
    await runTransaction(db, async (tx) => {
      const ref = doc(db, 'usuarios', u.id);
      const snap = await tx.get(ref);
      const data = snap.data() as any || {};
      const nuevo = (data.puntos || 0) + delta;
      tx.update(ref, { puntos: nuevo, puntosHoy: (data.puntosHoy||0) + delta, puntosSemana: (data.puntosSemana||0) + delta });
    });
    setAdjustOpen(null);
    setDelta(0);
  }

  async function applyRole(u: UserRow) {
    await updateDoc(doc(db, 'usuarios', u.id), { role: newRole });
    try { await updateDoc(doc(db, 'roles', u.id), { role: newRole } as any); } catch {}
    setRoleOpen(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <div className="relative">
          <Search className="absolute left-3 top-2.5" size={18} />
          <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Buscar por nombre o email" className="pl-9 pr-3 py-2 rounded-lg bg-white/5 outline-none" />
        </div>
      </div>

      <div className="overflow-hidden border border-white/10 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr className="text-left">
              <th className="p-3">Usuario</th>
              <th className="p-3">Email</th>
              <th className="p-3">Puntos</th>
              <th className="p-3">Hoy</th>
              <th className="p-3">Semana</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-t border-white/10">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/10 grid place-items-center"><UserIcon size={16}/></div>
                    <div>
                      <div className="font-medium">{u.displayName || 'Sin nombre'}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3">{u.email}</td>
                <td className="p-3 font-medium">{(u.puntos||0).toLocaleString()}</td>
                <td className="p-3">{u.puntosHoy||0}</td>
                <td className="p-3">{u.puntosSemana||0}</td>
                <td className="p-3">{u.role || 'driver'}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={()=>{ setAdjustOpen(u); setDelta(0); }} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 inline-flex items-center gap-1"><Plus size={14}/> Ajustar</button>
                    <button onClick={()=>{ setRoleOpen(u); setNewRole((u.role as any)||'driver'); }} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 inline-flex items-center gap-1"><Crown size={14}/> Rol</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!adjustOpen}
        title={"Ajustar puntos"}
        description={<div>
          <div className="mb-3 text-sm text-gray-300">Usuario: <b>{adjustOpen?.displayName || adjustOpen?.email}</b></div>
          <label className="text-sm grid gap-1">
            <span>Delta (positivo suma, negativo descuenta)</span>
            <input type="number" value={delta} onChange={e=>setDelta(Number(e.target.value))} className="bg-white/5 rounded px-3 py-2 outline-none" />
          </label>
        </div>}
        confirmLabel="Aplicar"
        onCancel={()=>setAdjustOpen(null)}
        onConfirm={()=> adjustOpen && applyAdjust(adjustOpen)}
      />

      <ConfirmDialog
        open={!!roleOpen}
        title={"Cambiar rol"}
        description={<div>
          <div className="mb-3 text-sm text-gray-300">Usuario: <b>{roleOpen?.displayName || roleOpen?.email}</b></div>
          <div className="flex gap-3">
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="role" checked={newRole==='driver'} onChange={()=>setNewRole('driver')} />
              <span>Driver</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="role" checked={newRole==='admin'} onChange={()=>setNewRole('admin')} />
              <span>Admin</span>
            </label>
          </div>
        </div>}
        confirmLabel="Guardar"
        onCancel={()=>setRoleOpen(null)}
        onConfirm={()=> roleOpen && applyRole(roleOpen)}
      />
    </div>
  );
}
