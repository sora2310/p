
import React from 'react';
import { db } from '../../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Config() {
  const [invitePoints, setInvitePoints] = React.useState<number>(200);
  const [weekStart, setWeekStart] = React.useState<'monday'|'sunday'>('monday');
  const [saving, setSaving] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const ref = doc(db, 'config', 'app');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data() as any;
        if (typeof d.invitePoints === 'number') setInvitePoints(d.invitePoints);
        if (d.weekStart) setWeekStart(d.weekStart);
      }
      setLoaded(true);
    })();
  }, []);

  async function save() {
    setSaving(true);
    await setDoc(doc(db, 'config', 'app'), {
      invitePoints, weekStart
    }, { merge: true });
    setSaving(false);
  }

  if (!loaded) return <div>Cargando config...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Configuración</h1>
      <div className="grid gap-6 max-w-xl">
        <label className="grid gap-1">
          <span className="text-sm text-gray-400">Puntos por invitación</span>
          <input type="number" value={invitePoints} onChange={e=>setInvitePoints(Number(e.target.value))} className="bg-white/5 rounded px-3 py-2 outline-none"/>
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-gray-400">Inicio de semana para ranking</span>
          <select value={weekStart} onChange={e=>setWeekStart(e.target.value as any)} className="bg-white/5 rounded px-3 py-2 outline-none">
            <option value="monday">Lunes</option>
            <option value="sunday">Domingo</option>
          </select>
        </label>
        <div>
          <button onClick={save} disabled={saving} className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50">{saving?'Guardando...':'Guardar'}</button>
        </div>
      </div>
    </div>
  );
}
