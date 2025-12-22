/**
 * Queries para Profissionais (Supabase)
 * CRUD operations para tabela professionals
 */

import { supabase } from "./supabaseClient";

export type Professional = {
  id: string;
  name: string;
  category: string;
  specialty?: string;
  city: string;
  neighborhood?: string;
  phone: string;
  email?: string;
  description?: string;
  profile_image?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  working_hours?: string;
  emergency_service: boolean;
  gallery_images: string[];
  rating: number;
  reviews_count: number;
  featured: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

// READ - Listar todos os profissionais ativos
export async function listProfessionals(filters?: {
  category?: string;
  specialty?: string;
  search?: string;
  featured?: boolean;
}) {
  let query = supabase
    .from("professionals")
    .select("*")
    .eq("active", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.category && filters.category !== "todos") {
    query = query.eq("category", filters.category);
  }

  if (filters?.specialty && filters.specialty !== "Todos") {
    query = query.ilike("specialty", `%${filters.specialty}%`);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,specialty.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters?.featured !== undefined) {
    query = query.eq("featured", filters.featured);
  }

  const { data, error } = await query;
  return { data, error };
}

// READ - Listar profissionais em destaque
export async function listFeaturedProfessionals() {
  const { data, error } = await supabase
    .from("professionals")
    .select(`
      *,
      profiles!inner(display_name, email, phone)
    `)
    .eq("status", "active")
    .eq("featured", true)
    .order("created_at", { ascending: false });

  return { data, error };
}

// UPDATE - Atualizar status de destaque (admin only)
export async function updateProfessionalFeatured(id: string, featured: boolean) {
  const { data, error } = await supabase
    .from("professionals")
    .update({ featured })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

// CREATE - Criar novo profissional
export async function createProfessional(
  data: {
    name: string;
    category: string;
    specialty?: string;
    city?: string;
    neighborhood?: string;
    phone: string;
    email?: string;
    description?: string;
    profile_image?: string;
    instagram?: string;
    facebook?: string;
    website?: string;
    working_hours?: string;
    emergency_service?: boolean;
    gallery_images?: string[];
    featured?: boolean;
  }
) {
  const { data: professional, error } = await supabase
    .from("professionals")
    .insert({
      name: data.name,
      category: data.category,
      specialty: data.specialty || null,
      city: data.city || "Modelo-SC",
      neighborhood: data.neighborhood || null,
      phone: data.phone,
      email: data.email || null,
      description: data.description || null,
      profile_image: data.profile_image || null,
      instagram: data.instagram || null,
      facebook: data.facebook || null,
      website: data.website || null,
      working_hours: data.working_hours || null,
      emergency_service: data.emergency_service || false,
      gallery_images: data.gallery_images || [],
      featured: data.featured || false,
      active: true,
    })
    .select()
    .single();

  return { data: professional, error };
}

// READ - Obter profissional por ID
export async function getProfessional(id: string) {
  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("id", id)
    .eq("active", true)
    .single();

  return { data, error };
}

// UPDATE - Atualizar profissional
export async function updateProfessional(id: string, updates: Partial<Professional>) {
  const { data, error } = await supabase
    .from("professionals")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

// DELETE - Desativar profissional (soft delete)
export async function deleteProfessional(id: string) {
  const { data, error } = await supabase
    .from("professionals")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

// ADMIN - Deletar profissional permanentemente
export async function adminDeleteProfessional(id: string) {
  const { error } = await supabase
    .from("professionals")
    .delete()
    .eq("id", id);

  return { error };
}