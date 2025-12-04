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
  query,
  where,
} from "firebase/firestore";

const MASTER = process.env.NEXT_PUBLIC_MASTER_UID || "";

export default function AdminProfissionaisPage() {
  const { user, loading } = useAuth();
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "profissional"));
    const unsub = onSnapshot(q, (snap) => {
      const arr: any[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      setProfessionals(arr);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="p-8">Carregando...</div>;
  if (!user || user.uid !== MASTER) return <div className="p-8">Acesso negado.</div>;

  async function changeStatus(id: string, status: string, reason?: string) {
    if (!confirm(`Confirmar ${status} para o profissional ${id}?`)) return;
    setBusy(id);
    try {
      await updateDoc(doc(db, "users", id), {
        status,
        updatedAt: serverTimestamp(),
        approvedAt: status === "approved" ? serverTimestamp() : null,
      });

      await addDoc(collection(db, "auditLogs"), {
        action: status === "approved" ? "approve_professional" : "block_professional",
        actorUid: user.uid,
        targetCollection: "users",
        targetId: id,
        reason: reason || null,
        ts: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
      alert("Erro ao alterar status");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Gerenciar Profissionais</h1>

      <div className="mb-4">
        <p className="text-sm text-gray-600">Total de profissionais: {professionals.length}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {professionals.map((p) => (
          <div key={p.id} className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-3 md:mb-0">
              <div className="font-semibold text-lg">{p.displayName || p.name || p.id}</div>
              <div className="text-sm text-gray-600">Email: {p.email || "—"}</div>
              <div className="text-sm text-gray-600">Telefone: {p.phone || "—"}</div>
              <div className="text-sm text-gray-500 mt-1">Status: <span className="font-medium">{p.status || "—"}</span></div>
            </div>

            <div className="flex gap-2 items-center">
              <button aria-label={`Aprovar ${p.id}`} disabled={busy === p.id} onClick={() => changeStatus(p.id, "approved")} className="px-3 py-1 bg-green-500 text-white rounded">Aprovar</button>
              <button aria-label={`Bloquear ${p.id}`} disabled={busy === p.id} onClick={() => changeStatus(p.id, "blocked")} className="px-3 py-1 bg-red-500 text-white rounded">Bloquear</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
