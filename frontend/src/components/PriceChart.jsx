import React, { useState } from 'react'
import {
  ResponsiveContainer, ComposedChart, Line, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p className="text-muted text-[10px] mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: <span className="font-medium">${Number(p.value).toFixed(2)}</span>
        </p>
      ))}
    </div>
  )
}

export default function PriceChart({ data = [], forecastStart = null, height = 280 }) {
  const [hidePred, setHidePred] = useState(false)
  const [hideFc,   setHideFc]   = useState(false)

  return (
    <div>
      <div className="flex gap-3 mb-3 text-[10px] text-muted">
        <button
          onClick={() => setHidePred(h => !h)}
          className={`flex items-center gap-1.5 transition-opacity ${hidePred ? 'opacity-40' : ''}`}
        >
          <span className="inline-block w-3 h-0.5 bg-red-400" /> Predicted
        </button>
        <button
          onClick={() => setHideFc(h => !h)}
          className={`flex items-center gap-1.5 transition-opacity ${hideFc ? 'opacity-40' : ''}`}
        >
          <span className="inline-block w-3 h-0.5 bg-green border-dashed border-t border-green" /> Forecast
        </button>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#58a6ff" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#58a6ff" stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3fb950" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3fb950" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#21262d" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#8b949e', fontSize: 10 }}
            tickLine={false} axisLine={false}
            tickFormatter={v => v ? v.slice(5) : ''} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#8b949e', fontSize: 10 }} tickLine={false}
            axisLine={false} tickFormatter={v => `$${v.toFixed(0)}`}
            width={52} domain={['auto','auto']} />
          <Tooltip content={<CustomTooltip />} />
          {forecastStart && (
            <ReferenceLine x={forecastStart} stroke="#30363d"
              strokeDasharray="4 2" label={{ value: 'Forecast', fill: '#8b949e', fontSize: 9 }} />
          )}
          <Area dataKey="actual" name="Actual" stroke="#58a6ff" fill="url(#areaGrad)"
            strokeWidth={1.5} dot={false} connectNulls />
          {!hidePred && (
            <Line dataKey="predicted" name="Predicted" stroke="#f85149"
              strokeWidth={1} dot={false} connectNulls strokeOpacity={0.8} />
          )}
          {!hideFc && (
            <Area dataKey="forecast" name="Forecast" stroke="#3fb950"
              fill="url(#fcGrad)" strokeWidth={1.5} strokeDasharray="5 3"
              dot={{ fill: '#3fb950', r: 3 }} connectNulls />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
