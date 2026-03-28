'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Review = {
  id: string
  rating: number
  comment: string
  is_anonymous: boolean
  owner_reply: string | null
  replied_at: string | null
  created_at: string
  customer_name: string | null
}

type Summary = {
  avg_rating: number | null
  total_reviews: number
}

function StarDisplay({ value }: { value: number }) {
  return (
    <span aria-label={`${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? 'text-yellow-400' : 'text-gray-300'}>★</span>
      ))}
    </span>
  )
}

type Props = { store: any }

export default function StoreReviewsModule({ store }: Props) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<Summary>({ avg_rating: null, total_reviews: 0 })
  const [loading, setLoading] = useState(true)
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({})
  const [replyLoading, setReplyLoading] = useState<Record<string, boolean>>({})
  const [replyError, setReplyError] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!store?.id) return
    let mounted = true

    const fetchReviews = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/reviews?store_id=${store.id}`)
        const json = await res.json()
        if (!mounted) return
        setReviews(json.reviews || [])
        setSummary(json.summary || { avg_rating: null, total_reviews: 0 })
      } catch (err) {
        console.error('Erro ao carregar avaliações:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchReviews()
    return () => { mounted = false }
  }, [store?.id])

  const handleReply = async (reviewId: string) => {
    const reply = (replyDraft[reviewId] ?? '').trim()
    if (!reply) {
      setReplyError(prev => ({ ...prev, [reviewId]: 'Resposta não pode ser vazia' }))
      return
    }
    setReplyError(prev => ({ ...prev, [reviewId]: '' }))
    setReplyLoading(prev => ({ ...prev, [reviewId]: true }))
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ reply }),
      })
      const json = await res.json()
      if (!res.ok) {
        setReplyError(prev => ({ ...prev, [reviewId]: json.error || 'Erro ao salvar resposta' }))
        return
      }
      // Atualiza localmente sem re-fetch
      setReviews(prev => prev.map(r =>
        r.id === reviewId ? { ...r, owner_reply: reply, replied_at: new Date().toISOString() } : r
      ))
      setReplyDraft(prev => ({ ...prev, [reviewId]: '' }))
    } catch {
      setReplyError(prev => ({ ...prev, [reviewId]: 'Erro de rede. Tente novamente.' }))
    } finally {
      setReplyLoading(prev => ({ ...prev, [reviewId]: false }))
    }
  }

  if (loading) {
    return <div className="text-gray-400 text-sm">Carregando avaliações…</div>
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="flex items-center gap-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
        <div className="text-center">
          <div className="text-4xl font-bold text-yellow-500 leading-none">
            {summary.avg_rating?.toFixed(1) ?? '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">média geral</div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-2xl mb-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={
                  summary.avg_rating && n <= Math.round(summary.avg_rating)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }
              >★</span>
            ))}
          </div>
          <div className="text-sm text-gray-600">
            {summary.total_reviews === 0
              ? 'Nenhuma avaliação ainda'
              : `${summary.total_reviews} avaliação${summary.total_reviews > 1 ? 'ões' : ''}`}
          </div>
        </div>
      </div>

      {/* Lista */}
      {reviews.length === 0 ? (
        <div className="text-gray-500 text-sm text-center py-8">
          Nenhuma avaliação recebida ainda. As avaliações aparecem aqui após clientes finalizarem pedidos.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-xl p-4 bg-white">
              {/* Cabeçalho */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <StarDisplay value={review.rating} />
                  <div className="text-xs text-gray-500 mt-0.5">
                    {review.is_anonymous ? 'Cliente anônimo' : (review.customer_name || 'Cliente')}
                    {' · '}
                    {new Date(review.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* Comentário */}
              <p className="mt-2 text-sm text-gray-800">{review.comment}</p>

              {/* Resposta existente */}
              {review.owner_reply && (
                <div className="mt-3 pl-3 border-l-2 border-blue-300 bg-blue-50 rounded-r p-2">
                  <div className="text-xs font-semibold text-blue-700 mb-0.5">Sua resposta</div>
                  <p className="text-sm text-gray-700">{review.owner_reply}</p>
                  {review.replied_at && (
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(review.replied_at).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              )}

              {/* Formulário de resposta (só se ainda não respondeu) */}
              {!review.owner_reply && (
                <div className="mt-3">
                  <textarea
                    value={replyDraft[review.id] ?? ''}
                    onChange={(e) =>
                      setReplyDraft(prev => ({ ...prev, [review.id]: e.target.value.slice(0, 100) }))
                    }
                    placeholder="Responder esta avaliação…"
                    className="w-full border border-gray-200 rounded p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                    rows={2}
                    maxLength={100}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] text-gray-400">{(replyDraft[review.id] ?? '').length}/100</span>
                    <button
                      type="button"
                      onClick={() => handleReply(review.id)}
                      disabled={replyLoading[review.id]}
                      className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                    >
                      {replyLoading[review.id] ? 'Enviando…' : 'Responder'}
                    </button>
                  </div>
                  {replyError[review.id] && (
                    <p className="text-xs text-red-600 mt-1">{replyError[review.id]}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
