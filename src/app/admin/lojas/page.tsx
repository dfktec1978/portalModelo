"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
  getDoc,
} from "firebase/firestore";

type StoreDoc = {
  id: string;
  name?: string;
  storeName?: string; // nome da loja
  email?: string;
  phone?: string;
  status?: string;
  role?: string; // opcional: 'lojista' ou 'cliente'
  type?: string; // alternativa de campo
  userType?: string;
  isLojista?: boolean;
  createdAt?: any;
};

const MASTER = process.env.NEXT_PUBLIC_MASTER_UID || "";

export default function AdminLojasPage() {
  const { user, loading } = useAuth();
  const [stores, setStores] = useState<StoreDoc[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const q = collection(db, "stores");
    const unsub = onSnapshot(q, (snap) => {
      const arr: StoreDoc[] = [];
      npm install firebase-admin      const fetches: Promise<void>[] = [];
      snap.forEach((d) => {
        const base = { id: d.id, ...(d.data() as any) } as StoreDoc & any;
        arr.push(base);

        // buscar usuário dono para mesclar email/phone/role quando possível
        const ownerUid = (base as any).ownerUid || (base as any).uid || d.id;
        fetches.push(
          getDoc(doc(db, "users", ownerUid))
            .then((uSnap) => {
              if (uSnap.exists()) {
                const u = uSnap.data() as any;
                // mesclar campos úteis
                base.email = base.email || u.email || base.email;
                base.phone = base.phone || u.phone || u.telefone || base.phone;
                base.role = base.role || u.role || base.role;
                base.name = base.name || u.name || u.displayName || base.name;
                base.storeName = base.storeName || u.storeName || base.storeName;
              }
            })
            .catch((e) => console.warn("Erro ao buscar user para store:", e))
        );
      });

      Promise.all(fetches).then(() => setStores(arr)).catch(() => setStores(arr));
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="p-8">Carregando...</div>;
  if (!user || user.uid !== MASTER) return <div className="p-8">Acesso negado.</div>;

  async function changeStatus(id: string, status: string, reason?: string) {
    if (!confirm(`Confirmar ${status} para a loja ${id}?`)) return;
    setBusy(id);
    try {
      const storeRef = doc(db, "stores", id);
      await updateDoc(storeRef, { status, updatedAt: serverTimestamp() });

      // Tentar sincronizar com users/{ownerUid} quando possível
      try {
        const storeSnap = await getDoc(storeRef);
        if (storeSnap.exists()) {
          const storeData = storeSnap.data() as any;
          // ownerUid pode ser um campo no documento; se não existir, assumimos que o id pode ser o uid
          const ownerUid = storeData.ownerUid || storeData.uid || id;
          if (ownerUid) {
            await updateDoc(doc(db, "users", ownerUid), {
              status,
              updatedAt: serverTimestamp(),
              approvedAt: status === 'approved' ? serverTimestamp() : null,
            });
          }
        }
      } catch (syncErr) {
        console.warn('Não foi possível sincronizar users/{ownerUid}:', syncErr);
      }

      // audit log
      await addDoc(collection(db, "auditLogs"), {
        action: status === 'approved' ? 'approve_store' : 'block_store',
        actorUid: user.uid,
        targetCollection: 'stores',
        targetId: id,
        reason: reason || null,
        ts: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
      alert('Erro ao alterar status');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Gerenciar Lojas</h1>

      <div className="mb-4">
        <p className="text-sm text-gray-600">Total de lojas: {stores.length}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {stores.map((s) => {
          const isLojista = s.role === 'lojista' || s.type === 'lojista' || s.userType === 'lojista' || s.isLojista === true;
          return (
            <div key={s.id} className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-3 md:mb-0">
                <div className="font-semibold text-lg">{s.name || s.id}</div>
                <div className="text-sm text-gray-700">Loja: <span className="font-medium">{s.storeName || '—'}</span></div>
                <div className="text-sm text-gray-600">Email: {s.email || '—'}</div>
                <div className="text-sm text-gray-600">Telefone: {s.phone || '—'}</div>
                <div className="text-sm text-gray-500 mt-1">Status: <span className="font-medium">{s.status || '—'}</span></div>
              </div>

              <div className="flex gap-2 items-center">
                {isLojista ? (
                  <>
                    <button aria-label={`Aprovar ${s.id}`} disabled={busy === s.id} onClick={() => changeStatus(s.id, 'approved')} className="px-3 py-1 bg-green-500 text-white rounded">Aprovar</button>
                    <button aria-label={`Bloquear ${s.id}`} disabled={busy === s.id} onClick={() => changeStatus(s.id, 'blocked')} className="px-3 py-1 bg-red-500 text-white rounded">Bloquear</button>
                  </>
                ) : (
                  <div className="text-sm text-green-600">Cliente — aprovado automaticamente</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
