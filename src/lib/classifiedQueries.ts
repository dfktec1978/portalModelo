/**
 * Queries para Classificados (Supabase)
 * CRUD operations para tabela classifieds
 */

import { supabase } from "./supabase";

export type Classified = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  location?: string;
  price?: number;
  image_urls?: string[];
  seller_id: string;
  status: "active" | "sold" | "removed";
  created_at: string;
  updated_at: string;
};

// CREATE - Criar novo classificado
export async function createClassified(
  userId: string,
  data: {
    title: string;
    description?: string;
    category?: string;
    location?: string;
    price?: number;
    image_urls?: string[];
  }
) {
  const { data: classified, error } = await supabase
    .from("classifieds")
    .insert({
      title: data.title,
      description: data.description || "",
      category: data.category || "geral",
      location: data.location || "",
      price: data.price || 0,
      image_urls: data.image_urls || [],
      seller_id: userId,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  return { data: classified, error };
}

// READ - Listar todos os classificados ativos
export async function listClassifieds(filters?: {
  category?: string;
  location?: string;
  maxPrice?: number;
  minPrice?: number;
}) {
  let query = supabase
    .from("classifieds")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (filters?.category && filters.category !== "todos") {
    query = query.eq("category", filters.category);
  }

  if (filters?.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }

  if (filters?.maxPrice) {
    query = query.lte("price", filters.maxPrice);
  }

  if (filters?.minPrice) {
    query = query.gte("price", filters.minPrice);
  }

  const { data, error } = await query;
  return { data, error };
}

// READ - Listar classificados do usuário
export async function listMyClassifieds(userId: string) {
  const { data, error } = await supabase
    .from("classifieds")
    .select("*")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}

// READ - Obter um classificado específico
export async function getClassified(id: string) {
  const { data, error } = await supabase
    .from("classifieds")
    .select("*")
    .eq("id", id)
    .single();

  return { data, error };
}

// UPDATE - Atualizar classificado
export async function updateClassified(
  id: string,
  userId: string,
  updates: Partial<Omit<Classified, "id" | "seller_id" | "created_at">>
) {
  // Verificar se é o dono
  const { data: classified, error: fetchError } = await getClassified(id);

  if (fetchError || !classified) {
    return { data: null, error: fetchError || new Error("Classificado não encontrado") };
  }

  if (classified.seller_id !== userId) {
    return { data: null, error: new Error("Você não tem permissão para editar este classificado") };
  }

  const { data, error } = await supabase
    .from("classifieds")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

// DELETE - Deletar classificado (soft delete)
export async function deleteClassified(id: string, userId: string) {
  // Verificar se é o dono
  const { data: classified, error: fetchError } = await getClassified(id);

  if (fetchError || !classified) {
    return { data: null, error: fetchError || new Error("Classificado não encontrado") };
  }

  if (classified.seller_id !== userId) {
    return { data: null, error: new Error("Você não tem permissão para deletar este classificado") };
  }

  // Soft delete - marcar como removido
  const { data, error } = await supabase
    .from("classifieds")
    .update({ status: "removed" })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

// SEARCH - Buscar classificados por título
export async function searchClassifieds(query: string) {
  const { data, error } = await supabase
    .from("classifieds")
    .select("*")
    .eq("status", "active")
    .ilike("title", `%${query}%`)
    .order("created_at", { ascending: false });

  return { data, error };
}

// STATS - Obter estatísticas
export async function getClassifiedStats(userId: string) {
  const { data, error } = await supabase
    .from("classifieds")
    .select("*")
    .eq("seller_id", userId);

  if (error) return { stats: null, error };

  return {
    stats: {
      total: data?.length || 0,
      active: data?.filter((c) => c.status === "active").length || 0,
      sold: data?.filter((c) => c.status === "sold").length || 0,
      removed: data?.filter((c) => c.status === "removed").length || 0,
    },
    error: null,
  };
}
