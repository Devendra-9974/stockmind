import React from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid
} from 'recharts'

const T = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p className="text-muted text-[10px] mb-1">Epoch {label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: {Number(p.value).toFixed(5)}
        </p>
      ))}
    </div>
  )
}

export default function LossChart({ trainLoss = [], valLoss = [], height = 160 }) {
  const data = trainLoss.map((v, i) => ({
    epoch: i + 1,
    train: v,
    ...(valLoss[i] != null ? { val: valLoss[i] } : {})
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#21262d" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="epoch" tick={{ fill: '#8b949e', fontSize: 10 }}
          tickLine={false} axisLine={false} label={{ value: 'Epoch', fill: '#8b949e', fontSize: 9, position: 'insideBottom', offset: -2 }} />
        <YAxis tick={{ fill: '#8b949e', fontSize: 10 }} tickLine={false}
          axisLine={false} tickFormatter={v => v.toFixed(4)} width={50} />
        <Tooltip content={<T />} />
        <Line dataKey="train" name="Train" stroke="#bc8cff" strokeWidth={1.5} dot={false} />
        <Line dataKey="val"   name="Val"   stroke="#d29922" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
