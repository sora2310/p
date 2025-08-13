
import React from 'react';
import { collectionGroup, getDocs, limit, orderBy, query, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

type Item = {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  recompensaId: string;
  recompensaTitulo?: string;
  puntos?: number;
  ts?: Date;
};

export default function Historial() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const q = query(collectionGroup(db, 'canjes'), orderBy('timestamp','desc'), limit(100));
      const snap = await getDocs(q);
      const rows: Item[] = [];
      const rewardCache = new Map<string, any>();
      const userCache = new Map<string, any>();
      for (const d of snap.docs) {
        const userId = d.ref.parent.parent?.id || 'unknown';
        const data = d.data() as any;
        const recompensaId = data.recompensaId;
        let recompensaTitulo = data.recompensaTitulo;
        let puntos = data.puntos;

        if (!recompensaTitulo || !puntos) {
          if (recompensaId) {
            if (!rewardCache.has(recompensaId)) {
              const rdoc = await getDoc(doc(db, 'recompensas', recompensaId));
              rewardCache.set(recompensaId, rdoc.exists()? rdoc.data() : null);
            }
            const rdata = rewardCache.get(recompensaId);
            if (rdata) {
              recompensaTitulo = rdata.titulo;
              puntos = rdata.puntos;
            }
          }
        }

        let userName, userEmail;
        if (!userCache.has(userId)) {
          const udoc = await getDoc(doc(db, 'usuarios', userId));
          userCache.set(userId, udoc.exists()? udoc.data() : null);
        }
        const udata = userCache.get(userId);
        if (udata) { userName = udata.displayName; userEmail = udata.email; }

        rows.push({
          id: d.id,
          userId,
          userName, userEmail,
          recompensaId,
          recompensaTitulo,
          puntos,
          ts: (data.timestamp && data.timestamp.toDate) ? data.timestamp.toDate() : new Date(),
        });
      }
      setItems(rows);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Historial de canjes</h1>
      {loading ? <div>Cargando...</div> : (
        <div className="overflow-hidden border border-white/10 rounded-xl">
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
              {items.map(i => (
                <tr key={i.id} className="border-t border-white/10">
                  <td className="p-3">{i.ts?.toLocaleString?.()}</td>
                  <td className="p-3">{i.userName || i.userId}</td>
                  <td className="p-3">{i.userEmail}</td>
                  <td className="p-3">{i.recompensaTitulo || i.recompensaId}</td>
                  <td className="p-3">{i.puntos ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
