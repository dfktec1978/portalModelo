import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action } = body;

    console.log('📥 Request recebido:', { userId, action, approveLoja: body.approveLoja });

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId e action são obrigatórios' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    console.log('🔑 Config:', { 
      urlExists: !!supabaseUrl, 
      keyExists: !!supabaseServiceKey,
      keyLength: supabaseServiceKey?.length 
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente faltando');
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      );
    }

    if (action === 'approve') {
      console.log('⏳ Chamando função RPC approve_user...');
      
      const rpcUrl = `${supabaseUrl}/rest/v1/rpc/approve_user`;
      const rpcBody = {
        p_user_id: userId,
        p_approve_store: body.approveLoja === true
      };

      console.log('📦 RPC Body:', rpcBody);

      const rpcResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify(rpcBody)
      });

      console.log('📡 RPC Response status:', rpcResponse.status);

      if (!rpcResponse.ok) {
        const errorText = await rpcResponse.text();
        console.error('❌ Erro ao aprovar via RPC:', errorText);
        return NextResponse.json(
          { error: 'Erro ao aprovar usuário', details: errorText },
          { status: 500 }
        );
      }

      const result = await rpcResponse.json();
      console.log('✅ Resultado RPC:', result);

      return NextResponse.json({ 
        success: true, 
        message: 'Usuário aprovado com sucesso',
        data: result
      });
    }

    if (action === 'changeRole') {
      const { role } = body;
      
      console.log('⏳ Chamando função RPC change_user_role...');
      
      const rpcUrl = `${supabaseUrl}/rest/v1/rpc/change_user_role`;
      const rpcBody = {
        p_user_id: userId,
        p_new_role: role
      };

      const rpcResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify(rpcBody)
      });

      if (!rpcResponse.ok) {
        const errorText = await rpcResponse.text();
        console.error('❌ Erro ao alterar role via RPC:', errorText);
        return NextResponse.json(
          { error: 'Erro ao atualizar role', details: errorText },
          { status: 500 }
        );
      }

      const result = await rpcResponse.json();
      return NextResponse.json({ success: true, message: 'Role atualizado com sucesso', data: result });
    }

    return NextResponse.json(
      { error: 'Ação inválida' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Erro na API admin/usuarios:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
