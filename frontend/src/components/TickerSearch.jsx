import React, { useState } from 'react'
import { Search } from 'lucide-react'

const SUGGESTIONS = [
  'AAPL','TSLA','MSFT','GOOGL','AMZN','NVDA','META',
  'NFLX','AMD','INTC','ORCL','BABA','JPM','V','MA',
  'BRK-B','JNJ','WMT','DIS','PFE','XOM','BA','GE'
]

export default function TickerSearch({ value, onChange, onSubmit, placeholder = 'Enter ticker…' }) {
  const [open, setOpen] = useState(false)
  const filtered = SUGGESTIONS.filter(t =>
    t.includes((value || '').toUpperCase()) && t !== value?.toUpperCase()
  ).slice(0, 8)

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-surface border border-border rounded-md px-3 py-2">
        <Search size={13} className="text-muted" />
        <input
          value={value}
          onChange={e => { onChange(e.target.value.toUpperCase()); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={e => e.key === 'Enter' && onSubmit?.()}
          placeholder={placeholder}
          className="bg-transparent text-sm text-white outline-none w-32 placeholder-muted"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-md shadow-xl z-50 w-40 py-1">
          {filtered.map(t => (
            <button
              key={t}
              onMouseDown={() => { onChange(t); onSubmit?.(); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 text-xs text-muted hover:text-white hover:bg-white/5 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
