"use client";
import { useEffect, useState } from "react";
import SupabaseNewsExample from "@/components/SupabaseNewsExample";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";

export default function SupabaseTestPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const [envStatus, setEnvStatus] = useState({
    hasUrl: false,
    hasKey: false,
    urlValue: "",
    keyPreview: "",
  });

  useEffect(() => {
    // Detectar variáveis de ambiente no cliente
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const urlValue = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const keyValue = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const keyPreview = keyValue ? `${keyValue.substring(0, 20)}...${keyValue.substring(keyValue.length - 10)}` : "";

    setEnvStatus({ hasUrl, hasKey, urlValue, keyPreview });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-2">🧪 Supabase — Test Page</h1>
        <p className="text-gray-600 mb-8">Diagnóstico de conexão e funcionalidades do Supabase.</p>

        {/* Environment Status */}
        <div className="mb-6 p-6 bg-white rounded-lg shadow border-l-4 border-blue-500">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-lg">⚙️</span> Configuração de Ambiente
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span>
              {envStatus.hasUrl ? (
                <span className="inline-flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-600 font-mono text-xs">{envStatus.urlValue}</span>
                </span>
              ) : (
                <span className="text-red-600">✗ Não configurado</span>
              )}
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
              {envStatus.hasKey ? (
                <span className="inline-flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-600 font-mono text-xs">{envStatus.keyPreview}</span>
                </span>
              ) : (
                <span className="text-red-600">✗ Não configurado</span>
              )}
            </div>
          </div>
          {!envStatus.hasUrl || !envStatus.hasKey ? (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <strong>⚠️ Ação necessária:</strong> Configure as variáveis de ambiente no `.env.local` e reinicie o servidor.
              <br />
              Consulte <code>SUPABASE-CONFIG.md</code> para instruções.
            </div>
          ) : (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
              <strong>✓ Variáveis de ambiente configuradas!</strong>
            </div>
          )}
        </div>

        {/* Auth Status */}
        <div className="mb-6 p-6 bg-white rounded-lg shadow border-l-4 border-purple-500">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-lg">🔐</span> Status de Autenticação (Supabase)
          </h2>
          {authLoading ? (
            <div className="text-gray-600">⏳ Verificando usuário...</div>
          ) : user ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <strong>✓ Autenticado como:</strong> <code className="text-sm">{user.email || user.id}</code>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              Não autenticado (é normal se não fez login)
            </div>
          )}
        </div>

        {/* News from Supabase */}
        <div className="mb-6 p-6 bg-white rounded-lg shadow border-l-4 border-green-500">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-lg">📰</span> Notícias do Supabase
          </h2>
          {envStatus.hasUrl && envStatus.hasKey ? (
            <SupabaseNewsExample />
          ) : (
            <div className="text-gray-600 italic">
              Configure as variáveis de ambiente para ver notícias.
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mb-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold mb-3">❓ Próximos Passos</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Se Supabase não está configurado, abra <code>SUPABASE-CONFIG.md</code></li>
            <li>Execute o script de teste: <code>node scripts/test-supabase-connection.js</code></li>
            <li>Insira dados de teste usando <code>supabase-seed-manual.sql</code> no SQL Editor</li>
            <li>Teste o fluxo de login em <code>/cadastro-cliente</code></li>
            <li>Verifique que Firebase ainda funciona removendo <code>NEXT_PUBLIC_SUPABASE_URL</code></li>
          </ol>
        </div>

        {/* Debug Info */}
        <div className="text-xs text-gray-500 bg-gray-100 p-4 rounded font-mono">
          <p>Debug Info:</p>
          <p>Timestamp: {new Date().toISOString()}</p>
          <p>Auth Loading: {authLoading ? "true" : "false"}</p>
          <p>User ID: {user?.id || "null"}</p>
        </div>
      </div>
    </div>
  );
}
