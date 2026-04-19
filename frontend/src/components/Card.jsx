import React from 'react'
import clsx from 'clsx'

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={clsx('bg-card border border-border rounded-lg p-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <p className={clsx('text-[10px] text-muted uppercase tracking-widest mb-3', className)}>
      {children}
    </p>
  )
}

export function Metric({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-surface rounded-md px-3 py-2.5">
      <p className="text-[10px] text-muted uppercase tracking-widest mb-1">{label}</p>
      <p className={clsx('text-lg font-medium', color)}>{value}</p>
      {sub && <p className="text-[10px] text-muted mt-0.5">{sub}</p>}
    </div>
  )
}

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-white/10 text-white',
    green:   'bg-green/15 text-green',
    red:     'bg-red/15 text-red',
    amber:   'bg-amber/15 text-amber',
    blue:    'bg-accent/15 text-accent',
    purple:  'bg-purple/15 text-purple',
  }
  return (
    <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium', variants[variant])}>
      {children}
    </span>
  )
}

export function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      className="animate-spin" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}

export function StatusDot({ online = true }) {
  return (
    <span className={clsx(
      'inline-block w-2 h-2 rounded-full',
      online ? 'bg-green animate-pulse' : 'bg-red'
    )} />
  )
}
