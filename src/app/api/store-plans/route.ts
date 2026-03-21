import { NextResponse } from 'next/server';
import { getServerPlanList } from '@/lib/storePlansServer';

export async function GET() {
  try {
    const plans = await getServerPlanList();
    return NextResponse.json({ plans });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao carregar planos da loja' },
      { status: 500 }
    );
  }
}
