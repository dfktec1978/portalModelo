"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";
import {
  listProfessionals,
  updateProfessionalFeatured,
  type Professional,
  createProfessional,
  adminDeleteProfessional,
  getProfessional,
  updateProfessional,
} from "@/lib/professionalQueries";
import Link from "next/link";
import { PROFESSIONAL_CATEGORIES, ALL_CATEGORIES } from "@/lib/professionalConstants";
import ImageUploadNews from "@/components/ImageUploadNews";
import Editor from "@/components/Editor";

export default function AdminProfissionaisClient() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    specialty: "",
    city: "Modelo-SC",
    neighborhood: "",
    phone: "",
    email: "",
    description: "",
    profile_images: [] as string[],
    instagram: "",
    facebook: "",
    website: "",
    working_hours: "",
    emergency_service: false,
    gallery_images: [] as string[],
    featured: false,
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    loadProfessionals();
  }, []);

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId) {
      loadProfessionalForEdit(editId);
    }
  }, [searchParams]);

  async function loadProfessionalForEdit(id: string) {
    try {
      const { data, error } = await getProfessional(id);
      if (error) {
        console.error("Erro ao carregar profissional para edição:", error);
        alert("Erro ao carregar profissional para edição");
        return;
      }
      const p = data;
      if (!p) {
        alert("Profissional não encontrado");
        return;
      }
      setForm({
        name: p.name || "",
        category: p.category || "",
        specialty: p.specialty || "",
        city: p.city || "Modelo-SC",
        neighborhood: p.neighborhood || "",
        phone: p.phone || "",
        email: p.email || "",
        description: p.description || "",
        profile_images: p.profile_image ? [p.profile_image] : [],
        instagram: p.instagram || "",
        facebook: p.facebook || "",
        website: p.website || "",
        working_hours: p.working_hours || "",
        emergency_service: p.emergency_service || false,
        gallery_images: p.gallery_images || [],
        featured: p.featured || false,
      });
      setEditingId(id);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar profissional para edição");
    }
  }

  const loadProfessionals = async () => {
    const { data, error } = await listProfessionals();
    if (error) {
      console.error("Erro ao carregar profissionais:", error);
    } else {
      setProfessionals(data || []);
    }
  };

  if (loading || profileLoading) return <div className="p-8">Carregando...</div>;
  if (!user || profile?.role !== "admin") return <div className="p-8">Acesso negado. Apenas administradores podem acessar esta área.</div>;

  async function toggleFeatured(id: string, currentFeatured: boolean) {
    if (!confirm(`Confirmar ${currentFeatured ? "remover" : "adicionar"} destaque para este profissional?`)) return;
    setBusy(id);
    try {
      const { error } = await updateProfessionalFeatured(id, !currentFeatured);
      if (error) {
        console.error("Erro ao atualizar destaque:", error);
        alert("Erro ao atualizar destaque");
      } else {
        await loadProfessionals();
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao atualizar destaque");
    } finally {
      setBusy(null);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        specialty: form.specialty,
        city: form.city,
        neighborhood: form.neighborhood,
        phone: form.phone,
        email: form.email,
        description: form.description,
        profile_image: form.profile_images[0] || null,
        instagram: form.instagram,
        facebook: form.facebook,
        website: form.website,
        working_hours: form.working_hours,
        emergency_service: form.emergency_service,
        gallery_images: form.gallery_images,
        featured: form.featured,
      };
      if (editingId) {
        const { data, error } = await updateProfessional(editingId, {
          ...payload,
          profile_image: form.profile_images[0] || null,
        } as any);
        if (error) throw error;
        alert("Profissional atualizado com sucesso");
      } else {
        await createProfessional(payload);
        alert("Profissional criado com sucesso");
      }
      setForm({
        name: "",
        category: "",
        specialty: "",
        city: "Modelo-SC",
        neighborhood: "",
        phone: "",
        email: "",
        description: "",
        profile_images: [],
        instagram: "",
        facebook: "",
        website: "",
        working_hours: "",
        emergency_service: false,
        gallery_images: [],
        featured: false,
      });
      setEditingId(null);
      loadProfessionals();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-white">Gerenciar Profissionais</h1>
      <form onSubmit={handleSave} className="bg-white rounded shadow p-6 mb-6 space-y-4">
        <h2 className="text-xl font-semibold mb-4 text-[#003049]">Adicionar / Editar Profissional</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Nome</label>
            <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} className="form-input" />
          </div>

          <div>
            <label className="form-label">Categoria</label>
            <select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} className="form-select">
              <option value="">Selecione</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Especialidade</label>
            <input value={form.specialty} onChange={(e) => setForm((s) => ({ ...s, specialty: e.target.value }))} className="form-input" />
          </div>

          <div>
            <label className="form-label">Cidade</label>
            <input value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} className="form-input" />
          </div>

          <div>
            <label className="form-label">Bairro</label>
            <input value={form.neighborhood} onChange={(e) => setForm((s) => ({ ...s, neighborhood: e.target.value }))} className="form-input" />
          </div>

          <div>
            <label className="form-label">Telefone / WhatsApp</label>
            <input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} className="form-input" placeholder="(XX) XXXXX-XXXX" />
          </div>

          <div>
            <label className="form-label">E-mail</label>
            <input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} className="form-input" />
          </div>

          <div>
            <label className="form-label">Site</label>
            <input value={form.website} onChange={(e) => setForm((s) => ({ ...s, website: e.target.value }))} className="form-input" />
          </div>

          <div>
            <label className="form-label">Instagram</label>
            <input value={form.instagram} onChange={(e) => setForm((s) => ({ ...s, instagram: e.target.value }))} className="form-input" />
          </div>

          <div>
            <label className="form-label">Facebook</label>
            <input value={form.facebook} onChange={(e) => setForm((s) => ({ ...s, facebook: e.target.value }))} className="form-input" />
          </div>

          <div>
            <label className="form-label">Horário de Atendimento</label>
            <input value={form.working_hours} onChange={(e) => setForm((s) => ({ ...s, working_hours: e.target.value }))} className="form-input" />
          </div>

          <div className="flex items-center gap-3">
            <input id="emergency" type="checkbox" checked={form.emergency_service} onChange={(e) => setForm((s) => ({ ...s, emergency_service: e.target.checked }))} />
            <label htmlFor="emergency" className="text-sm">Atendimento de emergência</label>
          </div>

          <div className="flex items-center gap-3">
            <input id="featured" type="checkbox" checked={form.featured} onChange={(e) => setForm((s) => ({ ...s, featured: e.target.checked }))} />
            <label htmlFor="featured" className="text-sm">Destaque</label>
          </div>

          <div className="md:col-span-2">
            <label className="form-label">Descrição</label>
            <Editor value={form.description} onChange={(val) => setForm((s) => ({ ...s, description: val }))} />
          </div>

          <div className="md:col-span-2">
            <label className="form-label">Foto / Logo (1)</label>
            <ImageUploadNews images={form.profile_images} heroImageIndex={0} onImagesChange={(imgs) => setForm((s) => ({ ...s, profile_images: imgs }))} onHeroImageChange={() => {}} maxImages={1} disabled={saving} />
          </div>

          <div className="md:col-span-2">
            <label className="form-label">Galeria (até 5 imagens)</label>
            <ImageUploadNews images={form.gallery_images} heroImageIndex={0} onImagesChange={(imgs) => setForm((s) => ({ ...s, gallery_images: imgs }))} onHeroImageChange={() => {}} maxImages={5} disabled={saving} />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button type="submit" disabled={saving} className="bg-blue-700 text-white px-4 py-2 rounded">{saving ? 'Salvando...' : 'Salvar'}</button>
          <button type="button" onClick={() => {
            setForm({
              name: "",
              category: "",
              specialty: "",
              city: "Modelo-SC",
              neighborhood: "",
              phone: "",
              email: "",
              description: "",
              profile_images: [],
              instagram: "",
              facebook: "",
              website: "",
              working_hours: "",
              emergency_service: false,
              gallery_images: [],
              featured: false,
            });
            setEditingId(null);
          }} className="bg-gray-200 px-4 py-2 rounded">Limpar</button>
        </div>
      </form>

      <div className="mb-4">
        <p className="text-sm text-[#003049]">Total de profissionais: {professionals.length}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {professionals.map((p) => (
          <div key={p.id} className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-3 md:mb-0">
              <div className="font-semibold text-lg text-[#003049]">{p.name}</div>
              <div className="text-sm text-gray-600">Categoria: {p.category}</div>
              <div className="text-sm text-gray-600">Especialidade: {p.specialty}</div>
              <div className="text-sm text-gray-600">Cidade: {p.city}</div>
              <div className="text-sm text-gray-600">Telefone: {p.phone || ""}</div>
              <div className="text-sm text-gray-500 mt-1">
                Destaque: <span className={`font-medium ${p.featured ? "text-green-600" : "text-gray-500"}`}>{p.featured ? "Sim" : "Não"}</span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <button aria-label={`Toggle destaque ${p.id}`} disabled={busy === p.id} onClick={() => toggleFeatured(p.id, p.featured)} className={`px-3 py-1 rounded ${p.featured ? "bg-yellow-500 text-white" : "bg-gray-500 text-white"}`}>
                {p.featured ? "Remover Destaque" : "Destacar"}
              </button>
              <Link href={`/admin/profissionais?edit=${p.id}`} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Editar</Link>

              <button onClick={async () => {
                if (!confirm("Tem certeza que deseja deletar este profissional permanentemente?")) return;
                try {
                  const { error } = await adminDeleteProfessional(p.id);
                  if (error) {
                    alert("Erro ao deletar: " + error.message);
                  } else {
                    await loadProfessionals();
                  }
                } catch (e) {
                  console.error(e);
                  alert("Erro ao deletar");
                }
              }} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">Deletar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
