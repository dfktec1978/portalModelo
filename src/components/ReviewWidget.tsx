'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
const ELIGIBLE_STATUSES = ['delivered', 'finalized', 'shipped']

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5" role="group" aria-label="Nota de 1 a 5 estrelas">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
          className="text-2xl leading-none focus:outline-none"
        >
          <span className={(hovered || value) >= n ? 'text-yellow-400' : 'text-gray-300'}>★</span>
        </button>
      ))}
    </div>
  )
}

type Props = {
  order: any
  alreadyReviewed: boolean
  existingReview?: {
    rating: number
    comment: string
    owner_reply?: string | null
    replied_at?: string | null
    created_at?: string | null
  } | null
  onReviewSubmittedAction: (orderId: string, review: {
    rating: number
    comment: string
    owner_reply?: string | null
    replied_at?: string | null
    created_at?: string | null
  }) => void
}

export default function ReviewWidget({ order, alreadyReviewed, existingReview, onReviewSubmittedAction }: Props) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState('')

  const refDate = order.delivered_at || order.updated_at || order.created_at
  const ageMs = Date.now() - new Date(refDate).getTime()
  const isWithinDeadline = ageMs <= THREE_DAYS_MS
  const isEligibleStatus = ELIGIBLE_STATUSES.includes(order.status)

  // Já avaliou — exibe avaliação e resposta (se houver)
  if (alreadyReviewed && existingReview) {
    return (
      <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-yellow-500">{'★'.repeat(existingReview.rating)}{'☆'.repeat(5 - existingReview.rating)}</span>
          <span className="font-medium text-yellow-700">Avaliação enviada</span>
          {existingReview.created_at && (
            <span className="text-xs text-gray-500">
              em {new Date(existingReview.created_at).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-700">{existingReview.comment}</p>

        {existingReview.owner_reply && (
          <div className="mt-2 rounded border border-blue-200 bg-blue-50 p-2">
            <div className="text-xs font-semibold text-blue-700">Resposta da loja</div>
            <p className="text-sm text-gray-700 mt-0.5">{existingReview.owner_reply}</p>
            {existingReview.replied_at && (
              <div className="text-[11px] text-gray-500 mt-0.5">
                {new Date(existingReview.replied_at).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Não elegível (status errado ou prazo expirado) — não mostra nada
  if (!isEligibleStatus || !isWithinDeadline) return null

  const handleSubmit = async () => {
    if (rating === 0) { setFieldError('Selecione uma nota'); return }
    if (!comment.trim()) { setFieldError('Escreva um comentário'); return }
    setFieldError('')
    setSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          order_id: order.id,
          store_id: order.store_id,
          rating,
          comment: comment.trim(),
          is_anonymous: isAnonymous,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setFieldError(json.error || 'Erro ao enviar avaliação'); return }
      onReviewSubmittedAction(order.id, {
        rating,
        comment: comment.trim(),
        owner_reply: null,
        replied_at: null,
        created_at: new Date().toISOString(),
      })
    } catch {
      setFieldError('Erro de rede. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  // Botão colapsado
  if (!open) {
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1 underline-offset-2 hover:underline"
        >
          ⭐ Avaliar este pedido
        </button>
      </div>
    )
  }

  // Formulário expandido
  return (
    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
      <div className="text-sm font-semibold text-gray-800 mb-2">Avaliar loja</div>

      <StarPicker value={rating} onChange={setRating} />

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 100))}
        placeholder="Como foi sua experiência? (obrigatório)"
        className="mt-2 w-full border border-gray-200 rounded p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-yellow-400"
        rows={2}
        maxLength={100}
      />
      <div className="text-[11px] text-gray-400 text-right mt-0.5">{comment.length}/100</div>

      <label className="flex items-center gap-2 mt-1 text-xs text-gray-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="rounded"
        />
        Não identificar meu nome para o lojista
      </label>

      {fieldError && <p className="mt-1 text-xs text-red-600">{fieldError}</p>}

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-3 py-1.5 text-sm rounded bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 font-medium transition-colors"
        >
          {submitting ? 'Enviando…' : 'Enviar avaliação'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setFieldError('') }}
          className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
