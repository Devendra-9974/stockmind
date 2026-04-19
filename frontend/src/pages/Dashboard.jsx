import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, RefreshCw, Zap } from 'lucide-react'
import { getPopular, getModels, getHealth } from '../api/client'
import { Card, CardTitle, Metric, Badge, StatusDot, Spinner } from '../components/Card'

export default function Dashboard() {
  const [popular, setPopular] = useState([])
  const [models,  setModels]  = useState([])
  const [health,  setHealth]  = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [p, m, h] = await Promise.allSettled([getPopular(), getModels(), getHealth()])
      if (p.status === 'fulfilled') setPopular(p.value.data)
      if (m.status === 'fulfilled') setModels(m.value.data)
      if (h.status === 'fulfilled') setHealth(h.value.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-white tracking-wide">Dashboard</h1>
          <p className="text-xs text-muted mt-0.5">Real-time quotes · Saved models · System status</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors px-3 py-1.5 border border-border rounded-md hover:bg-white/5">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* system status */}
      <Card>
        <CardTitle>System status</CardTitle>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <StatusDot online={!!health} />
            <span className="text-muted">API Server</span>
            <span className="text-white">{health ? 'Online' : 'Offline'}</span>
          </div>
          {health && (
            <>
              <div className="text-muted">·</div>
              <div className="text-muted">
                TensorFlow: <span className="text-white">{health.tensorflow}</span>
              </div>
              <div className="text-muted">
                Saved models: <span className="text-white">{models.length}</span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* market overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs text-muted uppercase tracking-widest">Market Overview</h2>
          {loading && <Spinner size={12} />}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {popular.map(q => (
            <Link key={q.ticker} to={`/predict?ticker=${q.ticker}`}>
              <Card className="hover:border-accent/40 hover:bg-card/80 transition-all cursor-pointer group">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium text-white group-hover:text-accent transition-colors">
                    {q.ticker}
                  </span>
                  {q.change_pct >= 0
                    ? <TrendingUp size={13} className="text-green mt-0.5" />
                    : <TrendingDown size={13} className="text-red mt-0.5" />
                  }
                </div>
                <p className="text-lg font-medium mt-1">${q.price.toFixed(2)}</p>
                <p className={`text-xs mt-0.5 ${q.change_pct >= 0 ? 'text-green' : 'text-red'}`}>
                  {q.change_pct >= 0 ? '+' : ''}{q.change_pct.toFixed(2)}%
                </p>
              </Card>
            </Link>
          ))}
          {loading && popular.length === 0 &&
            Array(8).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-3 bg-border/40 rounded mb-2 w-12" />
                <div className="h-5 bg-border/40 rounded mb-1 w-20" />
                <div className="h-3 bg-border/40 rounded w-10" />
              </Card>
            ))
          }
        </div>
      </div>

      {/* trained models */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs text-muted uppercase tracking-widest">Trained Models</h2>
          <Link to="/train" className="text-xs text-accent hover:underline flex items-center gap-1">
            <Zap size={11} /> Train new
          </Link>
        </div>
        {models.length === 0 && !loading ? (
          <Card className="text-center py-8">
            <p className="text-muted text-sm">No models trained yet.</p>
            <Link to="/train" className="text-accent text-xs mt-2 inline-block hover:underline">
              → Train your first model
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {models.map(m => (
              <Link key={m.ticker} to={`/predict?ticker=${m.ticker}`}>
                <Card className="hover:border-green/40 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white group-hover:text-green transition-colors">
                      {m.ticker}
                    </span>
                    <Badge variant="green">Ready</Badge>
                  </div>
                  <p className="text-[10px] text-muted">
                    Epochs: <span className="text-white">{m.epochs_trained}</span>
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">
                    Saved: <span className="text-white">
                      {m.saved_at ? new Date(m.saved_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* quick-start */}
      <Card className="border-accent/20">
        <CardTitle>Quick Start</CardTitle>
        <ol className="text-xs text-muted space-y-2 list-decimal list-inside">
          <li>Go to <Link to="/train" className="text-accent hover:underline">Train</Link> → enter a ticker (e.g. AAPL) → click Start Training</li>
          <li>Watch the live training console — loss curves update in real time via SSE</li>
          <li>Once training is done, go to <Link to="/predict" className="text-accent hover:underline">Predict</Link> to see the forecast</li>
          <li>Retrain anytime to self-correct on new market data</li>
        </ol>
      </Card>
    </div>
  )
}
