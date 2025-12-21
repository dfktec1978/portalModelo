'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useProfile } from '@/lib/useProfile';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useImageUpload } from '@/lib/useImageUpload';
import Image from 'next/image';

type ProfessionalProfile = {
  id: string;
  specialty: string;
  bio: string;
  image_url?: string;
  status: string;
};

export default function MeuPerfilProfissionalPage() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();
  const [professional, setProfessional] = useState<ProfessionalProfile | null>(null);
  const [loadingProfessional, setLoadingProfessional] = useState(true);
  const [saving, setSaving] = useState(false);

  const { uploadImage, uploading, error: uploadError } = useImageUpload({
    bucket: 'images',
    folder: 'professionals'
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && profile?.role === 'profissional') {
      loadProfessionalProfile();
    }
  }, [user, loading, profile, router]);

  const loadProfessionalProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('profile_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Erro ao carregar perfil profissional:', error);
        return;
      }

      if (data) {
        setProfessional(data);
      } else {
        // Criar perfil inicial se não existir
        setProfessional({
          id: '',
          specialty: '',
          bio: '',
          image_url: '',
          status: 'pending'
        });
      }
    } catch (err) {
      console.error('Erro ao carregar perfil profissional:', err);
    } finally {
      setLoadingProfessional(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file);
    if (url && professional) {
      setProfessional({ ...professional, image_url: url });
    }
  };

  const handleSave = async () => {
    if (!professional || !user) return;

    setSaving(true);
    try {
      const data = {
        profile_id: user.id,
        specialty: professional.specialty,
        bio: professional.bio,
        image_url: professional.image_url || null,
        status: professional.status || 'pending'
      };

      if (professional.id) {
        // Update
        const { error } = await supabase
          .from('professionals')
          .update(data)
          .eq('id', professional.id);

        if (error) throw error;
      } else {
        // Insert
        const { data: newProf, error } = await supabase
          .from('professionals')
          .insert([data])
          .select()
          .single();

        if (error) throw error;
        setProfessional(newProf);
      }

      alert('Perfil salvo com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading || profileLoading || loadingProfessional) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== 'profissional') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <p>Acesso negado. Esta página é apenas para profissionais.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003049] to-[#162f7a] text-white">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-white hover:text-gray-300"
          >
            ← Voltar ao Dashboard
          </button>
          <h1 className="font-bold text-lg">Meu Perfil Profissional</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white/10 border border-white/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Editar Perfil</h2>

          <div className="space-y-6">
            {/* Foto de Perfil */}
            <div>
              <label className="block text-sm font-medium mb-2">Foto de Perfil</label>
              <div className="flex items-center gap-4">
                {professional?.image_url ? (
                  <Image
                    src={professional.image_url}
                    alt="Foto de perfil"
                    width={100}
                    height={100}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600">Sem foto</span>
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {uploading && <p className="text-sm text-yellow-400 mt-1">Enviando...</p>}
                  {uploadError && <p className="text-sm text-red-400 mt-1">{uploadError}</p>}
                </div>
              </div>
            </div>

            {/* Especialidade */}
            <div>
              <label htmlFor="specialty" className="block text-sm font-medium mb-2">
                Especialidade *
              </label>
              <input
                id="specialty"
                type="text"
                value={professional?.specialty || ''}
                onChange={(e) => setProfessional(prev => prev ? { ...prev, specialty: e.target.value } : null)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Advogado, Manicure, Pedreiro..."
                required
              />
            </div>

            {/* Biografia */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-2">
                Biografia *
              </label>
              <textarea
                id="bio"
                value={professional?.bio || ''}
                onChange={(e) => setProfessional(prev => prev ? { ...prev, bio: e.target.value } : null)}
                rows={4}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descreva seus serviços, experiência..."
                required
              />
            </div>

            {/* Status */}
            <div>
              <p className="text-sm text-gray-400">
                Status: <span className={`font-medium ${professional?.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {professional?.status === 'active' ? 'Ativo' : professional?.status === 'pending' ? 'Pendente Aprovação' : 'Bloqueado'}
                </span>
              </p>
            </div>

            {/* Botão Salvar */}
            <button
              onClick={handleSave}
              disabled={saving || !professional?.specialty || !professional?.bio}
              className="w-full bg-[#FDC500] text-black font-semibold py-3 rounded hover:bg-[#E8B500] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando...' : 'Salvar Perfil'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}