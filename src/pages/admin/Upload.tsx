
import React from 'react';
import { db, storage } from '../../firebaseConfig';
import { collection, doc, getDocs, query, runTransaction, serverTimestamp, setDoc, where, addDoc } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';

type Row = { email?: string; uid?: string; puntos: number; motivo?: string };

export default function UploadPuntos() {
  const [file, setFile] = React.useState<File | null>(null);
  const [processing, setProcessing] = React.useState(false);
  const [log, setLog] = React.useState<{total:number; ok:number; fail:number; errors:string[]}>({total:0, ok:0, fail:0, errors:[]});

  function parseCSV(text: string): Row[] {
    const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    if (!lines.length) return [];
    const header = lines[0].split(',').map(h=>h.trim().toLowerCase());
    const rows: Row[] = [];
    for (let i=1;i<lines.length;i++) {
      const cols = lines[i].split(',').map(c=>c.trim());
      const obj: any = {};
      header.forEach((h, idx)=> obj[h] = cols[idx]);
      const puntos = Number(obj.puntos ?? obj.pts ?? obj.p);
      rows.push({ email: obj.email, uid: obj.uid, puntos, motivo: obj.motivo || obj.mot || '' });
    }
    return rows.filter(r=>!!r.email || !!r.uid);
  }

  async function onUpload() {
    if (!file) return;
    setProcessing(true);
    const text = await file.text();
    const rows = parseCSV(text);
    const summary = { total: rows.length, ok: 0, fail: 0, errors: [] as string[] };

    try {
      const sref = ref(storage, `cargas/${Date.now()}_${file.name}`);
      await uploadBytes(sref, file);
    } catch {}

    for (const [idx, row] of rows.entries()) {
      try {
        let uid = row.uid;
        if (!uid && row.email) {
          const qs = await getDocs(query(collection(db, 'usuarios'), where('email', '==', row.email)));
          if (!qs.empty) uid = qs.docs[0].id;
        }
        if (!uid) throw new Error(`Fila ${idx+1}: usuario no encontrado`);
        const uref = doc(db, 'usuarios', uid);
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(uref);
          if (!snap.exists()) throw new Error('usuario no existe');
          const data = snap.data() as any;
          tx.update(uref, {
            puntos: (data.puntos||0) + row.puntos,
            puntosHoy: (data.puntosHoy||0) + row.puntos,
            puntosSemana: (data.puntosSemana||0) + row.puntos,
          });
        });
        await addDoc(collection(db, 'usuarios', uid, 'ajustes'), {
          tipo: 'carga',
          delta: row.puntos,
          motivo: row.motivo || 'Carga masiva',
          ts: serverTimestamp(),
        });
        summary.ok += 1;
      } catch (e: any) {
        summary.fail += 1;
        summary.errors.push(e?.message || String(e));
      }
    }

    setLog(summary);
    await addDoc(collection(db, 'cargasPuntos'), {
      archivo: file.name,
      total: summary.total,
      ok: summary.ok,
      fail: summary.fail,
      errors: summary.errors.slice(0,5),
      ts: serverTimestamp(),
    });

    setProcessing(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Subir puntos (CSV)</h1>
      <div className="rounded-xl border border-white/10 p-4">
        <p className="text-sm text-gray-300 mb-2">Formato CSV con cabeceras: <code>email,uid,puntos,motivo</code>. Basta con email o uid.</p>
        <input type="file" accept=".csv" onChange={e=>setFile(e.target.files?.[0] || null)} />
        <div className="mt-4">
          <button disabled={!file || processing} onClick={onUpload} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50">
            {processing ? 'Procesando...' : 'Subir y aplicar'}
          </button>
        </div>
      </div>

      {log.total>0 && (
        <div className="rounded-xl border border-white/10 p-4">
          <h2 className="font-semibold mb-2">Resumen</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><div className="text-gray-400 text-sm">Total</div><div className="text-xl font-bold">{log.total}</div></div>
            <div><div className="text-gray-400 text-sm">OK</div><div className="text-xl font-bold">{log.ok}</div></div>
            <div><div className="text-gray-400 text-sm">Fallidos</div><div className="text-xl font-bold">{log.fail}</div></div>
          </div>
          {log.errors.length>0 && (
            <ul className="list-disc pl-5 text-sm text-red-300 mt-2">
              {log.errors.map((e,i)=>(<li key={i}>{e}</li>))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
