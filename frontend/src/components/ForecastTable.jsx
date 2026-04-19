import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function ForecastTable({ forecast = [] }) {
  if (!forecast.length) return <p className="text-muted text-xs">No forecast data.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted border-b border-border">
            <th className="text-left pb-2 font-normal">#</th>
            <th className="text-left pb-2 font-normal">Date</th>
            <th className="text-right pb-2 font-normal">Price</th>
            <th className="text-right pb-2 font-normal">Change</th>
          </tr>
        </thead>
        <tbody>
          {forecast.map((row, i) => {
            const up = row.change_pct >= 0
            return (
              <tr key={i} className="border-b border-border/50 hover:bg-white/3 transition-colors">
                <td className="py-1.5 text-muted">{i + 1}</td>
                <td className="py-1.5 text-white">{row.date}</td>
                <td className="py-1.5 text-right text-white font-medium">
                  ${row.price.toFixed(2)}
                </td>
                <td className={`py-1.5 text-right flex items-center justify-end gap-1
                  ${up ? 'text-green' : 'text-red'}`}>
                  {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {up ? '+' : ''}{row.change_pct.toFixed(2)}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
