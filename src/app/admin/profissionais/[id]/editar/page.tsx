"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfessional, updateProfessional, type Professional } from "@/lib/professionalQueries";
import ImageUploadNews from "@/components/ImageUploadNews";
import Editor from "@/components/Editor";

type Props = { params: { id: string } };

export default function EditProfessionalPage({ params }: Props) {
  const router = useRouter();
  const id = params.id;
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await getProfessional(id);
      if (error) {
        console.error('Erro ao carregar profissional:', error);
      } else {
        setProfessional(data || null);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-8">Carregando...</div>;
  if (!professional) return <div className="p-8">Profissional não encontrado.</div>;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = {
        name: professional.name,
        category: professional.category,
        specialty: professional.specialty,
        city: professional.city,
        neighborhood: professional.neighborhood,
        phone: professional.phone,
        email: professional.email,
        description: professional.description,
        profile_image: professional.profile_image || null,
        instagram: professional.instagram,
        facebook: professional.facebook,
        website: professional.website,
        working_hours: professional.working_hours,
        emergency_service: professional.emergency_service,
        gallery_images: professional.gallery_images,
        featured: professional.featured,
      };

      const { data, error } = await updateProfessional(id, updates as any);
      if (error) {
        alert('Erro ao salvar: ' + error.message);
      } else {
        alert('Profissional atualizado');
        router.push('/admin/profissionais');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-[#003049]">Editar Profissional</h1>
      <form onSubmit={handleSave} className="bg-white p-6 rounded shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Nome</label>
            <input value={professional.name} onChange={(e) => setProfessional({ ...professional, name: e.target.value } as any)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Categoria</label>
            <input value={professional.category} onChange={(e) => setProfessional({ ...professional, category: e.target.value } as any)} className="form-input" />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Descrição</label>
            <Editor value={professional.description || ''} onChange={(val) => setProfessional({ ...professional, description: val } as any)} />
          </div>
          <div>
            <label className="form-label">Telefone</label>
            <input value={professional.phone} onChange={(e) => setProfessional({ ...professional, phone: e.target.value } as any)} className="form-input" />
          </div>
          <div>
            <label className="form-label">E-mail</label>
            <input value={professional.email || ''} onChange={(e) => setProfessional({ ...professional, email: e.target.value } as any)} className="form-input" />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Foto / Logo</label>
            <ImageUploadNews images={professional.profile_image ? [professional.profile_image] : []} heroImageIndex={0} onImagesChange={(images) => setProfessional({ ...professional, profile_image: images[0] } as any)} onHeroImageChange={() => {}} maxImages={1} disabled={saving} />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={saving} className="bg-blue-700 text-white px-4 py-2 rounded">{saving ? 'Salvando...' : 'Salvar'}</button>
          <button type="button" onClick={() => router.push('/admin/profissionais')} className="bg-gray-200 px-4 py-2 rounded">Cancelar</button>
        </div>
      </form>
    </div>
  );
}
