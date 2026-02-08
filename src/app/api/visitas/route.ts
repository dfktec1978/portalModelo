import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Rota server-side para incrementar e retornar contador global de visitas.
// Requer a variável de ambiente SUPABASE_SERVICE_ROLE_KEY definida (service_role key).

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Se as credenciais não estão configuradas, retornar erro 503 (Service Unavailable) em vez de tentar conectar
if (!supabaseUrl || !serviceRoleKey) {
  console.warn('⚠️ Contador de visitas desabilitado: SUPABASE_SERVICE_ROLE_KEY não configurado');
}

const sb = !supabaseUrl || !serviceRoleKey ? null : createClient(supabaseUrl, serviceRoleKey);

export async function POST() {
  try {
    // Se não está configurado, retornar erro silenciosamente
    if (!sb) {
      return NextResponse.json(
        { error: 'Contador de visitas indisponível' },
        { status: 503 } // Service Unavailable
      );
    }

    // Try to read current value
    const { data: rows, error: selectError } = await sb.from('site_visits').select('id,count').eq('id', 'global').limit(1).maybeSingle();

    if (selectError) {
      console.error('select error', selectError);
      return NextResponse.json({ error: 'Erro ao ler contador' }, { status: 500 });
    }

    if (!rows) {
      // initialize
      const { data: inserted, error: insErr } = await sb.from('site_visits').insert({ id: 'global', count: 651 }).select().single();
      if (insErr) {
        console.error('insert error', insErr);
        return NextResponse.json({ error: 'Erro ao inicializar contador' }, { status: 500 });
      }
      return NextResponse.json({ count: inserted.count });
    }

    const newCount = Number(rows.count || 0) + 1;
    const { data: updated, error: updErr } = await sb.from('site_visits').update({ count: newCount, updated_at: new Date().toISOString() }).eq('id', 'global').select().single();

    if (updErr) {
      console.error('update error', updErr);
      return NextResponse.json({ error: 'Erro ao atualizar contador' }, { status: 500 });
    }

    return NextResponse.json({ count: updated.count });
  } catch (err) {
    console.error('unexpected', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data: row, error } = await sb.from('site_visits').select('count').eq('id', 'global').maybeSingle();
    if (error) return NextResponse.json({ error: 'Erro ao ler contador' }, { status: 500 });
    return NextResponse.json({ count: row?.count ?? null });
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
