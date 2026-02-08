'use client'

type Props = {
  title: string
  message: string
  type?: 'info' | 'tip' | 'warning'
}

export default function InfoBanner({ title, message, type = 'info' }: Props) {
  const styles = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'ℹ️',
      titleColor: 'text-blue-900',
      textColor: 'text-blue-800'
    },
    tip: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: '💡',
      titleColor: 'text-green-900',
      textColor: 'text-green-800'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: '⚠️',
      titleColor: 'text-yellow-900',
      textColor: 'text-yellow-800'
    }
  }

  const style = styles[type]

  return (
    <div className={`${style.bg} border ${style.border} rounded-lg p-4 mb-4`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{style.icon}</div>
        <div className="flex-1">
          <h4 className={`font-semibold ${style.titleColor} mb-1`}>{title}</h4>
          <p className={`text-sm ${style.textColor}`}>{message}</p>
        </div>
      </div>
    </div>
  )
}
