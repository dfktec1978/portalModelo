import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Rota server-side para incrementar e retornar contador global de visitas.
// Requer a variável de ambiente SUPABASE_SERVICE_ROLE_KEY definida (service_role key).

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !serviceRoleKey) {
  // Allow build but runtime will error if not configured
  console.warn('Supabase URL or service role key not configured for /api/visitas');
}

const sb = createClient(supabaseUrl, serviceRoleKey);

export async function POST(req: NextRequest) {
  try {
    // If client already has 'visited' cookie, do not increment again (prevents counting F5)
    const already = req.cookies.get('visited')?.value;

    // Read current value
    const { data: rows, error: selectError } = await sb.from('site_visits').select('id,count').eq('id', 'global').limit(1).maybeSingle();

    if (selectError) {
      console.error('select error', selectError);
      return NextResponse.json({ error: 'Erro ao ler contador' }, { status: 500 });
    }

    // If cookie present, just return current count without increment
    if (already) {
      const current = rows?.count ?? null;
      return NextResponse.json({ count: current });
    }

    if (!rows) {
      // initialize with 651 so first visitor after migration counts as 651
      const { data: inserted, error: insErr } = await sb.from('site_visits').insert({ id: 'global', count: 651 }).select().single();
      if (insErr) {
        console.error('insert error', insErr);
        return NextResponse.json({ error: 'Erro ao inicializar contador' }, { status: 500 });
      }
      const res = NextResponse.json({ count: inserted.count });
      res.cookies.set('visited', '1', { maxAge: 60 * 60 * 24, path: '/' });
      return res;
    }

    const newCount = Number(rows.count || 0) + 1;
    const { data: updated, error: updErr } = await sb.from('site_visits').update({ count: newCount, updated_at: new Date().toISOString() }).eq('id', 'global').select().single();

    if (updErr) {
      console.error('update error', updErr);
      return NextResponse.json({ error: 'Erro ao atualizar contador' }, { status: 500 });
    }

    const res = NextResponse.json({ count: updated.count });
    // Set cookie to avoid recounting for 24h
    res.cookies.set('visited', '1', { maxAge: 60 * 60 * 24, path: '/' });
    return res;
  } catch (err) {
    console.error('unexpected', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { data: row, error } = await sb.from('site_visits').select('count').eq('id', 'global').maybeSingle();
    if (error) return NextResponse.json({ error: 'Erro ao ler contador' }, { status: 500 });
    // Optionally include whether this client has visited (cookie)
    const visited = req.cookies.get('visited')?.value ? true : false;
    return NextResponse.json({ count: row?.count ?? null, visited });
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
