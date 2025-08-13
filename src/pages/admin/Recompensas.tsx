import React from 'react';
import { db, storage } from '../../firebaseConfig';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';

type Reward = {
  id: string;
  titulo: string;
  descripcion: string;
  puntos: number;
  activo: boolean;
  imagenUrl?: string | null;
  stock?: number | null;
  limitePorUsuario?: number | null;
};

export default function Recompensas() {
  const [items, setItems] = React.useState<Reward[]>([]);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Reward | null>(null);
  const [toDelete, setToDelete] = React.useState<Reward | null>(null);

  React.useEffect(() => {
    const q = query(collection(db, 'recompensas'), orderBy('puntos', 'asc'));
    const unsub = onSnapshot(q, snap => {
      const rows: Reward[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setItems(rows);
    });
    return () => unsub();
  }, []);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(r: Reward) {
    setEditing(r);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Recompensas</h1>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500">
          <Plus size={18}/> Nueva recompensa
        </button>
      </div>

      <div className="overflow-hidden border border-white/10 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr className="text-left">
              <th className="p-3">Imagen</th>
              <th className="p-3">Título</th>
              <th className="p-3">Descripción</th>
              <th className="p-3">Puntos</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Límite/usuario</th>
              <th className="p-3">Activo</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map(r => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="p-3">
                  {r.imagenUrl ? <img src={r.imagenUrl} alt={r.titulo} className="h-12 w-12 object-cover rounded" /> : <div className="h-12 w-12 bg-white/10 rounded" />}
                </td>
                <td className="p-3">{r.titulo}</td>
                <td className="p-3 max-w-md">{r.descripcion}</td>
                <td className="p-3">{r.puntos.toLocaleString()}</td>
                <td className="p-3">{r.stock ?? '—'}</td>
                <td className="p-3">{r.limitePorUsuario ?? '—'}</td>
                <td className="p-3">{r.activo ? 'Sí' : 'No'}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={()=>openEdit(r)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20">
                      <Pencil size={16}/>
                    </button>
                    <button onClick={()=>setToDelete(r)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <RewardModal
          initial={editing ?? undefined}
          onClose={()=>setModalOpen(false)}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="¿Eliminar recompensa?"
        description={<span>Vas a eliminar <b>{toDelete?.titulo}</b>. Esta acción no se puede deshacer.</span>}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onCancel={()=>setToDelete(null)}
        onConfirm={async ()=>{
          if(!toDelete) return;
          await deleteDoc(doc(db, 'recompensas', toDelete.id));
          setToDelete(null);
        }}
      />
    </div>
  );
}

function RewardModal({ initial, onClose }: { initial?: Reward, onClose: ()=>void }) {
  const [titulo, setTitulo] = React.useState(initial?.titulo ?? '');
  const [descripcion, setDescripcion] = React.useState(initial?.descripcion ?? '');
  const [puntos, setPuntos] = React.useState<number>(initial?.puntos ?? 0);
  const [activo, setActivo] = React.useState<boolean>(initial?.activo ?? true);
  const [stock, setStock] = React.useState<number | ''>(initial?.stock ?? '');
  const [limitePorUsuario, setLimitePorUsuario] = React.useState<number | ''>(initial?.limitePorUsuario ?? '');
  const [file, setFile] = React.useState<File | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      let imagenUrl = initial?.imagenUrl ?? null;
      if (file) {
        const path = `recompensas/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        imagenUrl = await getDownloadURL(storageRef);
      }
      const payload = {
        titulo,
        descripcion,
        puntos: Number(puntos),
        activo,
        imagenUrl,
        stock: stock === '' ? null : Number(stock),
        limitePorUsuario: limitePorUsuario === '' ? null : Number(limitePorUsuario),
        updatedAt: new Date()
      };
      if (initial) {
        await updateDoc(doc(db, 'recompensas', initial.id), payload as any);
      } else {
        await addDoc(collection(db, 'recompensas'), { ...payload, createdAt: new Date() } as any);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 grid place-items-center p-4 z-50">
      <div className="w-full max-w-xl bg-gray-900 rounded-2xl border border-white/10 p-6 space-y-4">
        <h2 className="text-xl font-semibold">{initial ? 'Editar recompensa' : 'Nueva recompensa'}</h2>
        <div className="grid grid-cols-1 gap-4">
          <label className="grid gap-1">
            <span className="text-sm text-gray-400">Título</span>
            <input value={titulo} onChange={e=>setTitulo(e.target.value)} className="bg-white/5 rounded px-3 py-2 outline-none" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-400">Descripción</span>
            <textarea value={descripcion} onChange={e=>setDescripcion(e.target.value)} className="bg-white/5 rounded px-3 py-2 outline-none min-h-[80px]" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-400">Puntos</span>
            <input type="number" value={puntos} onChange={e=>setPuntos(Number(e.target.value))} className="bg-white/5 rounded px-3 py-2 outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm text-gray-400">Stock (opcional)</span>
              <input type="number" value={stock} onChange={e=>setStock(e.target.value === '' ? '' : Number(e.target.value))} className="bg-white/5 rounded px-3 py-2 outline-none" />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-gray-400">Límite por usuario (opcional)</span>
              <input type="number" value={limitePorUsuario} onChange={e=>setLimitePorUsuario(e.target.value === '' ? '' : Number(e.target.value))} className="bg-white/5 rounded px-3 py-2 outline-none" />
            </label>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={activo} onChange={e=>setActivo(e.target.checked)} />
            <span>Activo</span>
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-400">Imagen (opcional)</span>
            <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20">Cancelar</button>
          <button disabled={saving} onClick={handleSave} className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}