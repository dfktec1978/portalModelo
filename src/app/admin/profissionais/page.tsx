"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";
import { listProfessionals, updateProfessionalFeatured, type Professional, createProfessional } from "@/lib/professionalQueries";
import { PROFESSIONAL_CATEGORIES, ALL_CATEGORIES } from "@/lib/professionalConstants";
import ImageUpload from "@/components/ImageUpload";

export default function AdminProfissionaisPage() {
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

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    const { data, error } = await listProfessionals();
    if (error) {
      console.error('Erro ao carregar profissionais:', error);
    } else {
      setProfessionals(data || []);
    }
  };

  if (loading || profileLoading) return <div className="p-8">Carregando...</div>;
  if (!user || profile?.role !== "admin") return <div className="p-8">Acesso negado. Apenas administradores podem acessar esta área.</div>;

  async function toggleFeatured(id: string, currentFeatured: boolean) {
    if (!confirm(`Confirmar ${currentFeatured ? 'remover' : 'adicionar'} destaque para este profissional?`)) return;
    setBusy(id);
    try {
      const { error } = await updateProfessionalFeatured(id, !currentFeatured);
      if (error) {
        console.error('Erro ao atualizar destaque:', error);
        alert("Erro ao atualizar destaque");
      } else {
        // Reload professionals
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
      await createProfessional(payload);
      alert('Profissional criado com sucesso');
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
      loadProfessionals(); // Recarregar lista
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-white">Gerenciar Profissionais</h1>

      {/* Form to add new professional */}
      <form onSubmit={handleSave} className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-[#003049]">Adicionar Novo Profissional</h2>
        <div className="grid grid-cols-1 gap-6">
          {/* Identificação */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-3 text-[#003049] border-b border-gray-200 pb-2">Identificação</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Nome do profissional ou empresa</label>
                <input
                  placeholder="Nome do profissional ou empresa"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Categoria</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="form-select"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <div>
                  <label className="form-label">Especialidade</label>
                  <input
                    type="text"
                    placeholder="Especialidade (máximo 50 caracteres)"
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value.slice(0, 50) })}
                    className="form-input"
                    required
                    maxLength={50}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {form.specialty.length}/50 caracteres
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-3 text-[#003049] border-b border-gray-200 pb-2">Localização</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Cidade</label>
                <input
                  placeholder="Cidade"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Bairro (opcional)</label>
                <input
                  placeholder="Bairro (opcional)"
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-3 text-[#003049] border-b border-gray-200 pb-2">Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Telefone</label>
                <input
                  placeholder="Telefone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">E-mail (opcional)</label>
                <input
                  type="email"
                  placeholder="E-mail (opcional)"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Apresentação */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-3 text-[#003049] border-b border-gray-200 pb-2">Apresentação</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="form-label">Descrição dos serviços</label>
                <textarea
                  placeholder="Descrição dos serviços"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="form-textarea"
                  required
                />
              </div>
              <div>
                <label className="form-label">Foto ou logo</label>
                <ImageUpload
                  images={form.profile_images}
                  onImagesChange={(images) => setForm({ ...form, profile_images: images })}
                  disabled={saving}
                  maxImages={1}
                />
              </div>
            </div>
          </div>

          {/* Redes sociais */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-3 text-[#003049] border-b border-gray-200 pb-2">Redes sociais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Instagram (opcional)</label>
                <input
                  placeholder="Instagram (opcional)"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Facebook (opcional)</label>
                <input
                  placeholder="Facebook (opcional)"
                  value={form.facebook}
                  onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Site (opcional)</label>
                <input
                  placeholder="Site (opcional)"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Extras */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-3 text-[#003049] border-b border-gray-200 pb-2">Extras</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="form-label">Horário de atendimento (opcional)</label>
                <input
                  placeholder="Horário de atendimento (opcional)"
                  value={form.working_hours}
                  onChange={(e) => setForm({ ...form, working_hours: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="emergency_service"
                  checked={form.emergency_service}
                  onChange={(e) => setForm({ ...form, emergency_service: e.target.checked })}
                />
                <label htmlFor="emergency_service" className="text-sm font-medium text-gray-700">Aceita urgência/emergência?</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-700">Profissional em destaque</label>
              </div>
              <div>
                <label className="form-label">Fotos de trabalhos realizados (URLs separadas por vírgula)</label>
                <input
                  placeholder="URL1, URL2, URL3"
                  value={form.gallery_images.join(', ')}
                  onChange={(e) => setForm({ ...form, gallery_images: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-700 text-white px-4 py-2 rounded"
          >
            {saving ? 'Salvando...' : 'Adicionar Profissional'}
          </button>
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
              <div className="text-sm text-gray-600">Telefone: {p.phone || "—"}</div>
              <div className="text-sm text-gray-500 mt-1">
                Destaque: <span className={`font-medium ${p.featured ? 'text-green-600' : 'text-gray-500'}`}>
                  {p.featured ? 'Sim' : 'Não'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <button
                aria-label={`Toggle destaque ${p.id}`}
                disabled={busy === p.id}
                onClick={() => toggleFeatured(p.id, p.featured)}
                className={`px-3 py-1 rounded ${p.featured ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'}`}
              >
                {p.featured ? 'Remover Destaque' : 'Destacar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
