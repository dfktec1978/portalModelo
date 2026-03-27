import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

async function fetchVisibleStores() {
  // select('*') evita erro em bancos parcialmente migrados.
  return supabaseAdmin
    .from('stores')
    .select('*')
    .in('status', ['approved', 'active'])
    .order('created_at', { ascending: false });
}

/**
 * GET /api/lojas
 * Retorna todas as lojas com status 'approved'.
 * Usa supabaseAdmin para ignorar RLS — seguro porque só lê dados públicos.
 */
export async function GET() {
  try {
    const { data, error } = await fetchVisibleStores();

    if (error) {
      console.error('[api/lojas] Erro ao buscar lojas:', error.message);
      return NextResponse.json({ stores: [] });
    }

    const stores = (data || []).map((row: any) => ({
      id: String(row.id),
      store_name: row.store_name || '',
      slug: row.slug || null,
      description: row.description || '',
      category: row.category || '',
      city: row.city || '',
      state: row.state || '',
      logo: row.logo_url || row.logo || null,
      logo_url: row.logo_url || null,
      external_url: row.external_url || null,
      phone: row.phone || '',
      status: row.status || 'approved',
      plan: row.plan || 'presenca',
      priority_weight: Number(row.priority_weight) || 0,
    }));

    return NextResponse.json({ stores });
  } catch (err: any) {
    console.error('[api/lojas] Erro interno:', err?.message);
    return NextResponse.json({ stores: [] });
  }
}
