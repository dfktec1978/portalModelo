'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'

type PaymentMethods = {
  pix:       boolean
  boleto:    boolean
  card_debit: boolean
}

type ConfigStatus = {
  configured: boolean
  sandbox:    boolean
  clientId:   string | null   // mascarado ex: "Client..."
  updatedAt:  string | null
  methods:    PaymentMethods
}

type Props = {
  store: any
}

export default function StorePaymentSettings({ store }: Props) {
  const [status,    setStatus]    = useState<ConfigStatus | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [removing,  setRemoving]  = useState(false)
  const [message,   setMessage]   = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Formulário de credenciais
  const [clientId,      setClientId]      = useState('')
  const [clientSecret,  setClientSecret]  = useState('')
  const [certFileName,  setCertFileName]  = useState('')
  const [certBase64,    setCertBase64]    = useState('')
  const [sandbox,       setSandbox]       = useState(true)
  const [methods,       setMethods]       = useState<PaymentMethods>({ pix: true, boleto: false, card_debit: false })
  const [showCredForm,  setShowCredForm]  = useState(false)
  const storeRef = store?.id || store?.slug
  const storeSlug = store?.slug || null

  // ------------------------------------------------------------------
  // Carregar status atual
  // ------------------------------------------------------------------
  const loadStatus = useCallback(async () => {
    if (!storeRef) return
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api/store/payment-config?storeId=${encodeURIComponent(storeRef)}${storeSlug ? `&storeSlug=${encodeURIComponent(storeSlug)}` : ''}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => null)
        throw new Error(errJson?.error || 'Não foi possível carregar configuração de pagamento')
      }
      const data: ConfigStatus = await res.json()
      setStatus(data)
      setMethods(data.methods ?? { pix: true, boleto: false, card_debit: false })
      setSandbox(data.sandbox ?? true)
      setMessage(null)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao carregar configuração de pagamento' })
    } finally {
      setLoading(false)
    }
  }, [storeRef, storeSlug])

  useEffect(() => { loadStatus() }, [loadStatus])

  // ------------------------------------------------------------------
  // Leitura do arquivo .p12
  // ------------------------------------------------------------------
  function handleCertFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCertFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const buf    = ev.target?.result as ArrayBuffer
      const bytes  = new Uint8Array(buf)
      let binary   = ''
      bytes.forEach((b) => { binary += String.fromCharCode(b) })
      setCertBase64(btoa(binary))
    }
    reader.readAsArrayBuffer(file)
  }

  // ------------------------------------------------------------------
  // Salvar métodos (sem credenciais — só os toggles)
  // ------------------------------------------------------------------
  async function saveMethods() {
    if (!storeRef) return
    setSaving(true)
    setMessage(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão expirada')

      const res = await fetch('/api/store/payment-config', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ storeId: storeRef, methods }),
      })
      if (!res.ok) throw new Error(await res.text())
      setMessage({ type: 'success', text: 'Métodos de pagamento atualizados!' })
      await loadStatus()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message ?? 'Erro ao salvar' })
    } finally {
      setSaving(false)
    }
  }

  // ------------------------------------------------------------------
  // Salvar credenciais Efí Pay
  // ------------------------------------------------------------------
  async function saveCredentials() {
    if (!storeRef) return
    if (!clientId || !clientSecret) {
      setMessage({ type: 'error', text: 'Client ID e Client Secret são obrigatórios' })
      return
    }
    if (!certBase64 && !status?.configured) {
      setMessage({ type: 'error', text: 'Selecione o certificado .p12' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão expirada')

      const payload: Record<string, unknown> = {
        storeId:  storeRef,
        storeSlug,
        clientId,
        clientSecret,
        sandbox,
        methods,
      }
      if (certBase64) payload.certificateB64 = certBase64

      const res = await fetch('/api/store/payment-config', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())

      setMessage({ type: 'success', text: 'Credenciais Efí Pay salvas com sucesso!' })
      setClientId(''); setClientSecret(''); setCertBase64(''); setCertFileName('')
      setShowCredForm(false)
      await loadStatus()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message ?? 'Erro ao salvar credenciais' })
    } finally {
      setSaving(false)
    }
  }

  // ------------------------------------------------------------------
  // Remover credenciais
  // ------------------------------------------------------------------
  async function removeCredentials() {
    if (!storeRef) return
    if (!confirm('Remover credenciais Efí Pay? Os pagamentos voltarão para Pix manual.')) return
    setRemoving(true)
    setMessage(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão expirada')

      const res = await fetch(`/api/store/payment-config?storeId=${encodeURIComponent(storeRef)}${storeSlug ? `&storeSlug=${encodeURIComponent(storeSlug)}` : ''}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error(await res.text())
      setMessage({ type: 'success', text: 'Credenciais removidas. Pix manual ativado.' })
      await loadStatus()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message ?? 'Erro ao remover' })
    } finally {
      setRemoving(false)
    }
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (!store) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-500">Selecione uma loja para configurar pagamentos.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">💳 Configurações de Pagamento</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure os métodos de pagamento aceitos pela sua loja e vincule sua conta Efí Pay
          para receber diretamente no seu banco.
        </p>
      </div>

      {/* Feedback */}
      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* ── BLOCO 1: Métodos habilitados ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-gray-800">Métodos aceitos na loja</h3>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="font-medium text-gray-900">Pix</p>
            <p className="text-xs text-gray-500">Pagamento instantâneo — confirmação automática</p>
          </div>
          <input
            type="checkbox"
            checked={methods.pix}
            onChange={(e) => setMethods((m) => ({ ...m, pix: e.target.checked }))}
            className="w-5 h-5 accent-blue-600"
          />
        </label>

        <hr />

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="font-medium text-gray-900">Boleto Bancário</p>
            <p className="text-xs text-gray-500">
              Vence em 3 dias • requer CPF/CNPJ do cliente
              {!status?.configured && (
                <span className="ml-2 text-orange-600 font-medium">— exige Efí Pay configurado</span>
              )}
            </p>
          </div>
          <input
            type="checkbox"
            checked={methods.boleto}
            onChange={(e) => setMethods((m) => ({ ...m, boleto: e.target.checked }))}
            disabled={!status?.configured}
            className="w-5 h-5 accent-blue-600 disabled:opacity-40"
          />
        </label>

        <hr />

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="font-medium text-gray-900">Cartão de Débito</p>
            <p className="text-xs text-gray-500">
              Liquidação D+2
              {!status?.configured && (
                <span className="ml-2 text-orange-600 font-medium">— exige Efí Pay configurado</span>
              )}
            </p>
          </div>
          <input
            type="checkbox"
            checked={methods.card_debit}
            onChange={(e) => setMethods((m) => ({ ...m, card_debit: e.target.checked }))}
            disabled={!status?.configured}
            className="w-5 h-5 accent-blue-600 disabled:opacity-40"
          />
        </label>

        <button
          onClick={saveMethods}
          disabled={saving}
          className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar métodos'}
        </button>
      </div>

      {/* ── BLOCO 2: Status Efí Pay ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Conta Efí Pay</h3>
          {status?.configured ? (
            <span className="text-xs bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">
              ✓ Configurado
            </span>
          ) : (
            <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-3 py-1 rounded-full">
              Não configurado
            </span>
          )}
        </div>

        {status?.configured ? (
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="text-gray-400">Client ID:</span>{' '}
              <span className="font-mono">{status.clientId}</span>
            </p>
            <p>
              <span className="text-gray-400">Ambiente:</span>{' '}
              <span className={`font-semibold ${status.sandbox ? 'text-orange-600' : 'text-green-600'}`}>
                {status.sandbox ? 'Sandbox (testes)' : 'Produção'}
              </span>
            </p>
            <p>
              <span className="text-gray-400">Atualizado:</span>{' '}
              {status.updatedAt ? new Date(status.updatedAt).toLocaleDateString('pt-BR') : '—'}
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">Como funciona</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Crie sua conta gratuita em <strong>dev.efipay.com.br</strong></li>
              <li>Crie uma aplicação → gere <strong>Client ID</strong> e <strong>Client Secret</strong></li>
              <li>Gere o <strong>Certificado (.p12)</strong> na mesma tela</li>
              <li>Cadastre tudo aqui abaixo</li>
            </ol>
            <p className="mt-2 text-blue-600">
              O dinheiro dos seus clientes vai <strong>direto para sua conta</strong> vinculada ao Efí Pay.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowCredForm((v) => !v)}
            className="flex-1 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50"
          >
            {status?.configured ? 'Atualizar credenciais' : 'Cadastrar credenciais Efí Pay'}
          </button>
          {status?.configured && (
            <button
              onClick={removeCredentials}
              disabled={removing}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
            >
              {removing ? '...' : 'Remover'}
            </button>
          )}
        </div>

        {/* Formulário de credenciais (colapsável) */}
        {showCredForm && (
          <div className="border border-gray-200 rounded-xl p-5 space-y-4 bg-gray-50">
            <p className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-2">
              🔒 Suas credenciais são armazenadas de forma segura e <strong>nunca são exibidas</strong> após o cadastro.
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Client ID *</label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Client_Id_xxxxxxxxxxxxxxxx"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Client Secret *</label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Client_Secret_xxxxxxxxxxxxxxxx"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Certificado .p12 {status?.configured ? '(opcional — mantém o atual)' : '*'}
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Selecionar arquivo
                  <input type="file" accept=".p12,.pfx" onChange={handleCertFile} className="hidden" />
                </label>
                <span className="text-sm text-gray-500 truncate max-w-[180px]">
                  {certFileName || 'Nenhum arquivo'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Ambiente</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    checked={sandbox}
                    onChange={() => setSandbox(true)}
                    className="accent-orange-500"
                  />
                  <span className="text-orange-700 font-medium">Sandbox (testes)</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    checked={!sandbox}
                    onChange={() => setSandbox(false)}
                    className="accent-green-600"
                  />
                  <span className="text-green-700 font-medium">Produção</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveCredentials}
                disabled={saving}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar credenciais'}
              </button>
              <button
                onClick={() => setShowCredForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── BLOCO 3: Info sobre repasse ── */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 space-y-2">
        <p className="font-semibold text-gray-800">Como os pagamentos chegam até você</p>
        <div className="grid grid-cols-3 gap-3 text-center text-xs mt-3">
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="text-2xl mb-1">📱</div>
            <div className="font-semibold text-gray-800">Pix</div>
            <div className="text-green-600 font-medium">Instantâneo</div>
            <div className="text-gray-400">direto na conta</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="text-2xl mb-1">📄</div>
            <div className="font-semibold text-gray-800">Boleto</div>
            <div className="text-blue-600 font-medium">D+1</div>
            <div className="text-gray-400">após compensação</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="text-2xl mb-1">💳</div>
            <div className="font-semibold text-gray-800">Débito</div>
            <div className="text-blue-600 font-medium">D+2</div>
            <div className="text-gray-400">após liquidação</div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          * O Portal Modelo não retém nenhum valor de vendas. Você paga apenas a mensalidade de hospedagem.
        </p>
      </div>
    </div>
  )
}
