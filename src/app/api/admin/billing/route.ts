import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'

async function getAdminUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null
  if (!token) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return null

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') return null
  return user
}

// GET /api/admin/billing — lista faturas com filtros
export async function GET(request: NextRequest) {
  const user = await getAdminUser(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')       // pending | paid | expired | canceled
  const month  = searchParams.get('month')        // YYYY-MM
  const page   = Math.max(1, Number(searchParams.get('page') || 1))
  const limit  = 20
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('monthly_billing_invoices')
    .select(
      'id, reference_month, due_date, amount, status, payment_provider, payment_method, boleto_link, boleto_barcode, reminder_sent_at, paid_at, created_at, updated_at, stores:store_id(id, slug, store_name, plan), profiles:owner_id(id, display_name, email)',
      { count: 'exact' }
    )
    .order('due_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (month)  query = query.gte('reference_month', `${month}-01`).lte('reference_month', `${month}-28`)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ invoices: data, total: count, page, limit })
}

// PATCH /api/admin/billing — marcar como pago ou cancelar manualmente
export async function PATCH(request: NextRequest) {
  const user = await getAdminUser(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, action } = body as { id: string; action: 'mark_paid' | 'cancel' }

  if (!id || !['mark_paid', 'cancel'].includes(action)) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }

  const update: Record<string, unknown> =
    action === 'mark_paid'
      ? { status: 'paid', paid_at: new Date().toISOString() }
      : { status: 'canceled' }

  const { error } = await supabaseAdmin
    .from('monthly_billing_invoices')
    .update(update)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, id, action })
}
