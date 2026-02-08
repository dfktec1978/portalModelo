'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Props = {
  store: any
}

type DaySchedule = {
  open: string
  close: string
  closed: boolean
}

type WeekSchedule = {
  segunda: DaySchedule
  terca: DaySchedule
  quarta: DaySchedule
  quinta: DaySchedule
  sexta: DaySchedule
  sabado: DaySchedule
  domingo: DaySchedule
}

const DEFAULT_SCHEDULE: WeekSchedule = {
  segunda: { open: '08:00', close: '18:00', closed: false },
  terca: { open: '08:00', close: '18:00', closed: false },
  quarta: { open: '08:00', close: '18:00', closed: false },
  quinta: { open: '08:00', close: '18:00', closed: false },
  sexta: { open: '08:00', close: '18:00', closed: false },
  sabado: { open: '08:00', close: '14:00', closed: false },
  domingo: { open: '08:00', close: '14:00', closed: true }
}

const DAYS_MAP = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado',
  domingo: 'Domingo'
}

export default function StoreModuleSchedule({ store }: Props) {
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (store?.schedule) {
      setSchedule({ ...DEFAULT_SCHEDULE, ...store.schedule })
    }
  }, [store])

  const handleDayChange = (day: keyof WeekSchedule, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  const handleSave = async () => {
    if (!store?.id) {
      console.log('❌ Store ID não encontrado:', store)
      setMessage('Erro: Loja não selecionada')
      return
    }

    setSaving(true)
    setMessage('')

    console.log('💾 Salvando horários...')
    console.log('Store ID:', store.id)
    console.log('Schedule:', schedule)

    try {
      const { data, error } = await supabase
        .from('stores')
        .update({ schedule })
        .eq('id', store.id)
        .select()

      console.log('📤 Resposta do Supabase:')
      console.log('Data:', data)
      console.log('Error:', error)

      if (error) {
        console.error('❌ Erro Supabase:', error)
        throw error
      }

      console.log('✅ Horários salvos com sucesso!')
      
      // Recarregar a página para atualizar o prop store
      window.location.reload()
      
    } catch (error: any) {
      console.error('Erro ao salvar horários:', error)
      setMessage(`Erro: ${error?.message || 'Tente novamente'}`)
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setSaving(false)
    }
  }

  const copyToAll = (day: keyof WeekSchedule) => {
    const daySchedule = schedule[day]
    const newSchedule = { ...schedule }
    
    Object.keys(newSchedule).forEach((key) => {
      if (key !== day) {
        newSchedule[key as keyof WeekSchedule] = { ...daySchedule }
      }
    })
    
    setSchedule(newSchedule)
  }

  if (!store) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">Selecione uma loja para gerenciar os horários.</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold mb-1">🕒 Horários de Funcionamento</h3>
          <p className="text-sm text-gray-600">Configure os horários de atendimento da sua loja</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('sucesso') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        {(Object.keys(schedule) as Array<keyof WeekSchedule>).map((day) => (
          <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 sm:w-40">
              <input
                type="checkbox"
                checked={schedule[day].closed}
                onChange={(e) => handleDayChange(day, 'closed', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label className="font-medium text-gray-700">
                {DAYS_MAP[day]}
              </label>
            </div>

            {!schedule[day].closed ? (
              <>
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-sm text-gray-600 w-16">Abre:</label>
                  <input
                    type="time"
                    value={schedule[day].open}
                    onChange={(e) => handleDayChange(day, 'open', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 flex-1">
                  <label className="text-sm text-gray-600 w-16">Fecha:</label>
                  <input
                    type="time"
                    value={schedule[day].close}
                    onChange={(e) => handleDayChange(day, 'close', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={() => copyToAll(day)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                  title="Copiar este horário para todos os dias"
                >
                  📋 Copiar para todos
                </button>
              </>
            ) : (
              <div className="flex-1 text-sm text-gray-500 italic">
                Fechado
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {saving ? 'Salvando...' : '💾 Salvar Horários'}
        </button>

        <button
          onClick={() => setSchedule(DEFAULT_SCHEDULE)}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
        >
          🔄 Restaurar Padrão
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Dicas</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Marque a caixa para indicar dias fechados</li>
          <li>• Use "Copiar para todos" para aplicar o mesmo horário em todos os dias</li>
          <li>• Os horários serão exibidos na página pública da sua loja</li>
        </ul>
      </div>
    </div>
  )
}
