import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseServer'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function getUser(request: NextRequest) {
  const token = (request.headers.get('authorization') ?? '').replace('Bearer ', '')
  if (!token) return null
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  )
  const { data: { user } } = await client.auth.getUser()
  return user ?? null
}

// PATCH /api/reviews/[id]/reply — lojista responde avaliação
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  if (!UUID_REGEX.test(id ?? ''))
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const reply = String(body?.reply ?? '').trim().slice(0, 100)
  if (!reply)
    return NextResponse.json({ error: 'Resposta não pode ser vazia' }, { status: 400 })

  // Verificar que a avaliação existe
  const { data: review, error: reviewErr } = await supabaseAdmin
    .from('store_reviews')
    .select('id, store_id')
    .eq('id', id)
    .single()

  if (reviewErr || !review)
    return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })

  // Verificar que o usuário é dono da loja
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('id')
    .eq('id', review.store_id)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!store)
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { error: updateErr } = await supabaseAdmin
    .from('store_reviews')
    .update({ owner_reply: reply, replied_at: new Date().toISOString() })
    .eq('id', id)

  if (updateErr)
    return NextResponse.json({ error: 'Erro ao salvar resposta' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
