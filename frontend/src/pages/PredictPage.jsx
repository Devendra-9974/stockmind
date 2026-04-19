import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { TrendingUp, RefreshCw } from 'lucide-react'
import { getForecast, getPredHistory, getQuote } from '../api/client'
import { Card, CardTitle, Metric, Badge, Spinner } from '../components/Card'
import PriceChart from '../components/PriceChart'
import ForecastTable from '../components/ForecastTable'
import TickerSearch from '../components/TickerSearch'

const PERIODS = ['6mo','1y','2y']
const DAYS    = [5, 10, 20, 30]

export default function PredictPage() {
  const [searchParams] = useSearchParams()
  const [ticker,  setTicker]  = useState(searchParams.get('ticker') || 'AAPL')
  const [period,  setPeriod]  = useState('1y')
  const [days,    setDays]    = useState(10)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [quote,   setQuote]   = useState(null)
  const [history, setHistory] = useState(null)
  const [forecast,setForecast]= useState([])
  const [metrics, setMetrics] = useState(null)
  const [chartData, setChartData] = useState([])

  const load = async (t = ticker, p = period, d = days) => {
    if (!t) return
    setLoading(true)
    setError('')
    try {
      const [fcRes, histRes, qRes] = await Promise.allSettled([
        getForecast({ ticker: t, forecast_days: d, period: p }),
        getPredHistory(t, p),
        getQuote(t),
      ])

      if (fcRes.status === 'rejected') {
        const msg = fcRes.reason?.response?.data?.detail || fcRes.reason?.message
        setError(msg)
        setLoading(false)
        return
      }

      const fc   = fcRes.value.data
      const hist = histRes.status === 'fulfilled' ? histRes.value.data : null
      const q    = qRes.status === 'fulfilled'    ? qRes.value.data    : null

      setForecast(fc.forecast)
      setMetrics(fc.metrics)
      setQuote(q)

      // Build combined chart array
      const rows = []
      if (hist) {
        const n = hist.dates.length
        for (let i = 0; i < n; i++) {
          rows.push({
            date:      hist.dates[i],
            actual:    hist.actual[i],
            predicted: hist.predicted[i],
          })
        }
      }
      // Append forecast
      fc.forecast.forEach(f => {
        rows.push({ date: f.date, forecast: f.price })
      })
      setChartData(rows)
      setHistory(hist)
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const forecastStart = forecast.length > 0 ? forecast[0].date : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp size={18} className="text-green" />
        <h1 className="text-lg font-medium text-white">Predict</h1>
      </div>

      {/* controls */}
      <Card>
        <CardTitle>Options</CardTitle>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-[10px] text-muted uppercase tracking-widest block mb-1.5">Ticker</label>
            <TickerSearch value={ticker} onChange={setTicker} onSubmit={() => load(ticker, period, days)} />
          </div>

          <div>
            <label className="text-[10px] text-muted uppercase tracking-widest block mb-1.5">History</label>
            <div className="flex gap-1">
              {PERIODS.map(p => (
                <button key={p} onClick={() => { setPeriod(p); load(ticker, p, days) }}
                  className={`px-2 py-1 text-xs rounded border transition-all
                    ${period===p ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted hover:border-muted'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted uppercase tracking-widest block mb-1.5">Forecast days</label>
            <div className="flex gap-1">
              {DAYS.map(d => (
                <button key={d} onClick={() => { setDays(d); load(ticker, period, d) }}
                  className={`px-2 py-1 text-xs rounded border transition-all
                    ${days===d ? 'border-green text-green bg-green/10' : 'border-border text-muted hover:border-muted'}`}>
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => load()} disabled={loading}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors px-3 py-1.5 border border-border rounded-md hover:bg-white/5 mb-0.5">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </Card>

      {/* error */}
      {error && (
        <Card className="border-red/40">
          <p className="text-red text-sm">{error}</p>
          {error.includes('No trained model') && (
            <Link to={`/train?ticker=${ticker}`} className="text-accent text-xs mt-2 inline-block hover:underline">
              → Train a model for {ticker}
            </Link>
          )}
        </Card>
      )}

      {/* loading skeleton */}
      {loading && (
        <Card className="flex items-center gap-3 py-8 justify-center">
          <Spinner size={16} />
          <span className="text-muted text-sm">Loading predictions…</span>
        </Card>
      )}

      {/* quote header */}
      {!loading && quote && (
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-medium text-white">{ticker}</h2>
          <span className="text-2xl">${quote.price.toFixed(2)}</span>
          <span className={`text-sm ${quote.change_pct >= 0 ? 'text-green' : 'text-red'}`}>
            {quote.change_pct >= 0 ? '+' : ''}{quote.change_pct.toFixed(2)}%
          </span>
          <Badge variant={quote.change_pct >= 0 ? 'green' : 'red'}>
            {quote.change_pct >= 0 ? 'Bullish' : 'Bearish'}
          </Badge>
        </div>
      )}

      {/* metrics */}
      {metrics && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric label="MAE"      value={`$${metrics.mae.toFixed(2)}`}      color="text-green" />
          <Metric label="RMSE"     value={`$${metrics.rmse.toFixed(2)}`}     color="text-green" />
          <Metric label="MAPE"     value={`${metrics.mape.toFixed(2)}%`}     color="text-amber" />
          <Metric label="Accuracy" value={`${metrics.accuracy.toFixed(2)}%`} color="text-accent" />
        </div>
      )}

      {/* main chart */}
      {chartData.length > 0 && !loading && (
        <Card>
          <CardTitle>Price History + LSTM Forecast</CardTitle>
          <PriceChart data={chartData} forecastStart={forecastStart} height={320} />
        </Card>
      )}

      {/* forecast table */}
      {forecast.length > 0 && !loading && (
        <Card>
          <CardTitle>{days}-Day Forecast</CardTitle>
          <ForecastTable forecast={forecast} />
        </Card>
      )}
    </div>
  )
}
