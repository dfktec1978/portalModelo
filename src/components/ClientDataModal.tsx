"use client"

import { useState, useEffect } from 'react'
import { X, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type ClientDataModalProps = {
  isOpen: boolean
  onCloseAction: () => void
  onConfirmAction?: (data: { name: string; email: string; phone: string }) => void
  loading?: boolean
}

export default function ClientDataModal({
  isOpen,
  onCloseAction,
  onConfirmAction,
  loading = false
}: ClientDataModalProps) {
  const [clientData, setClientData] = useState<{
    name: string
    email: string
    phone: string
  } | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')

  // Carregar dados do usuário autenticado
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoadingData(true)
        setError('')

        // Obter usuário autenticado
        const {
          data: { user },
          error: authError
        } = await supabase.auth.getUser()

        if (authError || !user) {
          console.error('❌ Erro ao obter usuário autenticado:', authError)
          setError('Erro ao carregar dados. Por favor, faça login novamente.')
          setLoadingData(false)
          return
        }

        // Buscar perfil do usuário
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('display_name, email, phone')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.warn('Erro ao buscar perfil:', profileError.message)
          // Usar dados do auth como fallback
          setClientData({
            name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuário',
            email: user.email || '',
            phone: user.user_metadata?.phone || ''
          })
        } else if (profile) {
          setClientData({
            name: profile.display_name || user.email?.split('@')[0] || 'Usuário',
            email: profile.email || user.email || '',
            phone: profile.phone || ''
          })
        }
      } catch (err: any) {
        console.error('❌ Erro inesperado:', err)
        setError('Erro ao carregar dados do usuário.')
      } finally {
        setLoadingData(false)
      }
    }

    if (isOpen) {
      loadUserData()
    }
  }, [isOpen])

  const handleConfirm = () => {
    if (!clientData) {
      setError('Dados incompletos.')
      return
    }

    if (!clientData.name.trim() || !clientData.email.trim() || !clientData.phone.trim()) {
      setError('Por favor, complete todos os dados em seu perfil.')
      return
    }

    if (onConfirmAction) {
      onConfirmAction(clientData)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">Confirme Seus Dados</h2>
          <button
            onClick={onCloseAction}
            disabled={loading || loadingData}
            className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          {loadingData ? (
            // Carregando
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Carregando seus dados...</p>
            </div>
          ) : error ? (
            // Erro
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm text-red-700 font-semibold">Erro</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          ) : clientData ? (
            <>
              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-900 mb-1">💡 Confirmação de Dados</p>
                <p className="text-sm text-blue-800">
                  Verifique se seus dados estão corretos. Eles estão vinculados à sua conta.
                </p>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">👤 Nome Completo</label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium">
                  {clientData.name}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">📧 Email</label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium">
                  {clientData.email}
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">📱 Telefone (WhatsApp)</label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium">
                  {clientData.phone || '(Não informado)'}
                </div>
              </div>

              {/* Warning se telefone não preenchido */}
              {!clientData.phone && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-3">
                  <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-sm text-yellow-700 font-semibold">Atenção</p>
                    <p className="text-sm text-yellow-600 mt-1">
                      Você não preencheu seu telefone. Atualize em seu{' '}
                      <a href="/dashboard/editar-perfil" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-yellow-800">
                        Perfil
                      </a>
                      .
                    </p>
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onCloseAction}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Confirmar
                    </>
                  )}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
