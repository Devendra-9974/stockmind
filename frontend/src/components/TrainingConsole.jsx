import React, { useEffect, useRef } from 'react'
import { Spinner } from './Card'

export default function TrainingConsole({ logs = [], running = false }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="bg-surface border border-border rounded-md p-3 font-mono text-xs h-56 overflow-y-auto">
      {logs.length === 0 && !running && (
        <p className="text-muted">Waiting for training job…</p>
      )}
      {logs.map((line, i) => (
        <p key={i} className={
          line.type === 'error'  ? 'text-red mb-0.5' :
          line.type === 'status' ? 'text-accent mb-0.5' :
          line.type === 'done'   ? 'text-green mb-0.5' :
          'text-muted mb-0.5'
        }>
          {line.text}
        </p>
      ))}
      {running && (
        <div className="flex items-center gap-2 text-muted mt-1">
          <Spinner size={12} /> processing…
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
