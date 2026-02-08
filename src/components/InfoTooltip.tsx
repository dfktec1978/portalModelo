'use client'

import { useState } from 'react'

type Props = {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export default function InfoTooltip({ content, position = 'top' }: Props) {
  const [show, setShow] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors text-xs font-bold"
      >
        ?
      </button>
      
      {show && (
        <div className={`absolute z-50 ${positionClasses[position]} w-64`}>
          <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}
