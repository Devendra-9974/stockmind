import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers, TrendingUp, Brain } from 'lucide-react'
import { getModels } from '../api/client'
import { Card, CardTitle, Badge, Spinner } from '../components/Card'

export default function ModelsPage() {
  const [models, setModels]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getModels()
      .then(r => setModels(r.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Layers size={18} className="text-purple" />
        <h1 className="text-lg font-medium text-white">Saved Models</h1>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted text-sm">
          <Spinner size={14} /> Loading…
        </div>
      )}

      {!loading && models.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-muted mb-3">No models trained yet.</p>
          <Link to="/train"
            className="text-accent text-sm hover:underline flex items-center gap-1 justify-center">
            <Brain size={14} /> Train your first model
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map(m => (
          <Card key={m.ticker} className="hover:border-purple/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-medium text-white">{m.ticker}</span>
              <Badge variant="purple">LSTM</Badge>
            </div>

            <div className="space-y-1.5 text-xs text-muted mb-4">
              <div className="flex justify-between">
                <span>Epochs trained</span>
                <span className="text-white">{m.epochs_trained}</span>
              </div>
              <div className="flex justify-between">
                <span>Saved at</span>
                <span className="text-white">
                  {m.saved_at ? new Date(m.saved_at).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link to={`/predict?ticker=${m.ticker}`}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 border border-green/40 text-green rounded hover:bg-green/10 transition-all">
                <TrendingUp size={11} /> Predict
              </Link>
              <Link to={`/train?ticker=${m.ticker}`}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 border border-accent/40 text-accent rounded hover:bg-accent/10 transition-all">
                <Brain size={11} /> Retrain
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Architecture overview */}
      <Card>
        <CardTitle>Model Architecture</CardTitle>
        <div className="space-y-2 text-xs">
          {[
            { layer: 'Input',   detail: '60 × 16 features (OHLCV + 11 indicators)', color: 'text-accent' },
            { layer: 'LSTM 1',  detail: '128 units · return_sequences=True · Dropout 0.2', color: 'text-purple' },
            { layer: 'LSTM 2',  detail: '64 units  · return_sequences=True · Dropout 0.2', color: 'text-purple' },
            { layer: 'LSTM 3',  detail: '32 units  · return_sequences=False · Dropout 0.1', color: 'text-purple' },
            { layer: 'Dense',   detail: '32 units · ReLU activation', color: 'text-green' },
            { layer: 'Output',  detail: '1 unit — next close price (scaled)', color: 'text-amber' },
            { layer: 'Self-correction', detail: 'Error-weighted fine-tune on validation residuals', color: 'text-red' },
          ].map(({ layer, detail, color }) => (
            <div key={layer} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
              <span className={`w-28 shrink-0 font-medium ${color}`}>{layer}</span>
              <span className="text-muted">{detail}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
