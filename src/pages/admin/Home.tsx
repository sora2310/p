
import React from 'react';
import { collection, getDocs, limit, orderBy, query, collectionGroup, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export default function AdminHome() {
  const [recent, setRecent] = React.useState<any[]>([]);
  const [totals, setTotals] = React.useState<{usuarios:number; recompensas:number}>({usuarios:0, recompensas:0});

  React.useEffect(() => {
    (async () => {
      const uqAll = await getDocs(collection(db,'usuarios'));
      setTotals(t => ({...t, usuarios: uqAll.size }));
      const rq = await getDocs(collection(db, 'recompensas'));
      setTotals(t => ({...t, recompensas: rq.size }));

      const cg = await getDocs(query(collectionGroup(db,'canjes'), orderBy('timestamp','desc'), limit(10)));
      const rewardCache = new Map<string, any>();
      const userCache = new Map<string, any>();
      const rows:any[] = [];
      for (const d of cg.docs) {
        const userId = d.ref.parent.parent?.id || 'unknown';
        const data = d.data() as any;
        const recompensaId = data.recompensaId;
        let titulo = data.recompensaTitulo;
        let puntos = data.puntos;
        if (!titulo || !puntos) {
          if (recompensaId) {
            if (!rewardCache.has(recompensaId)) {
              const rdoc = await getDoc(doc(db,'recompensas', recompensaId));
              rewardCache.set(recompensaId, rdoc.exists()? rdoc.data(): null);
            }
            const r = rewardCache.get(recompensaId);
            if (r) { titulo = r.titulo; puntos = r.puntos; }
          }
        }
        if (!userCache.has(userId)) {
          const udoc = await getDoc(doc(db,'usuarios', userId));
          userCache.set(userId, udoc.exists()? udoc.data(): null);
        }
        const u = userCache.get(userId);
        rows.push({
          id: d.id,
          user: u?.displayName || userId,
          email: u?.email || '',
          titulo, puntos,
          ts: (data.timestamp && data.timestamp.toDate) ? data.timestamp.toDate() : new Date(),
        });
      }
      setRecent(rows);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Panel de administrador</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 p-4">
          <div className="text-sm text-gray-400">Usuarios</div>
          <div className="text-2xl font-bold">{totals.usuarios}</div>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <div className="text-sm text-gray-400">Recompensas</div>
          <div className="text-2xl font-bold">{totals.recompensas}</div>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <div className="text-sm text-gray-400">Canjes recientes</div>
          <div className="text-2xl font-bold">{recent.length}</div>
        </div>
      </div>

      <div className="overflow-hidden border border-white/10 rounded-xl">
        <div className="p-3 font-medium">Recompensas canjeadas (últimos 10)</div>
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr className="text-left">
              <th className="p-3">Fecha</th>
              <th className="p-3">Usuario</th>
              <th className="p-3">Email</th>
              <th className="p-3">Recompensa</th>
              <th className="p-3">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(r => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="p-3">{r.ts?.toLocaleString?.()}</td>
                <td className="p-3">{r.user}</td>
                <td className="p-3">{r.email}</td>
                <td className="p-3">{r.titulo}</td>
                <td className="p-3">{r.puntos ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
