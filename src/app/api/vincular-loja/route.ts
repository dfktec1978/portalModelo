import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerPlanDefaults } from '@/lib/storePlansServer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    const planDefaults = await getServerPlanDefaults('presenca');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Inserir lojas demo vinculadas ao usuário
    const stores = [
      {
        id: 'dd0ffe7c-30eb-43f2-8b4d-31d275ac1f63',
        name: 'Loja Demo 01',
        slug: 'loja-demo-01',
        category: 'varejo',
        owner_id: userId,
        status: 'approved',
        ...planDefaults,
        created_at: new Date().toISOString()
      }
    ];

    const { data, error } = await supabase
      .from('stores')
      .upsert(stores, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Error inserting stores:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, stores: data });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
