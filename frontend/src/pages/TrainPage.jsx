import React, { useState, useRef } from 'react'
import { Brain, Play, StopCircle } from 'lucide-react'
import { startTraining, streamTraining } from '../api/client'
import { Card, CardTitle, Metric, Spinner } from '../components/Card'
import LossChart from '../components/LossChart'
import TrainingConsole from '../components/TrainingConsole'
import TickerSearch from '../components/TickerSearch'

const PERIODS = ['6mo','1y','2y','5y']

export default function TrainPage() {
  const [ticker,  setTicker]  = useState('AAPL')
  const [period,  setPeriod]  = useState('2y')
  const [epochs,  setEpochs]  = useState(50)
  const [seqLen,  setSeqLen]  = useState(60)
  const [retrain, setRetrain] = useState(false)

  const [running,    setRunning]    = useState(false)
  const [logs,       setLogs]       = useState([])
  const [trainLoss,  setTrainLoss]  = useState([])
  const [valLoss,    setValLoss]    = useState([])
  const [epochInfo,  setEpochInfo]  = useState(null)  // {epoch,total,train_loss,val_loss}
  const [result,     setResult]     = useState(null)
  const esRef = useRef(null)

  const addLog = (text, type = 'info') =>
    setLogs(prev => [...prev, { text, type }])

  const handleStart = async () => {
    if (!ticker) return
    setRunning(true)
    setLogs([])
    setTrainLoss([])
    setValLoss([])
    setResult(null)
    setEpochInfo(null)
    addLog(`Starting training for ${ticker}...`, 'status')

    try {
      const { data } = await startTraining({ ticker, period, epochs, seq_len: seqLen, retrain })
      addLog(`Job ID: ${data.job_id}`, 'info')

      esRef.current = streamTraining(data.job_id, {
        onStatus: d => addLog(d.message, 'status'),
        onEpoch: d => {
          setEpochInfo(d)
          setTrainLoss(prev => [...prev, d.train_loss])
          if (d.val_loss) setValLoss(prev => [...prev, d.val_loss])
          addLog(
            `Epoch ${d.epoch}/${d.total}  train=${d.train_loss.toFixed(5)}  val=${d.val_loss?.toFixed(5) ?? '-'}`,
            'info'
          )
        },
        onDone: d => {
          setResult(d)
          addLog(`Training complete! MAE=$${d.metrics.mae.toFixed(2)}  MAPE=${d.metrics.mape.toFixed(2)}%`, 'done')
          setRunning(false)
        },
        onError: () => {
          addLog('Connection error or training failed.', 'error')
          setRunning(false)
        },
      })
    } catch (err) {
      addLog(`Error: ${err.response?.data?.detail || err.message}`, 'error')
      setRunning(false)
    }
  }

  const handleStop = () => {
    esRef.current?.close()
    setRunning(false)
    addLog('Training stream closed by user.', 'error')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain size={18} className="text-accent" />
        <h1 className="text-lg font-medium text-white">Train Model</h1>
      </div>

      {/* config */}
      <Card>
        <CardTitle>Configuration</CardTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] text-muted uppercase tracking-widest block mb-1.5">Ticker</label>
            <TickerSearch value={ticker} onChange={setTicker} onSubmit={handleStart} />
          </div>

          <div>
            <label className="text-[10px] text-muted uppercase tracking-widest block mb-1.5">Data Period</label>
            <div className="flex gap-1">
              {PERIODS.map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2 py-1 text-xs rounded border transition-all
                    ${period === p
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border text-muted hover:border-muted'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted uppercase tracking-widest block mb-1.5">
              Epochs: <span className="text-white">{epochs}</span>
            </label>
            <input type="range" min={10} max={200} step={5} value={epochs}
              onChange={e => setEpochs(+e.target.value)}
              className="w-full accent-accent" />
          </div>

          <div>
            <label className="text-[10px] text-muted uppercase tracking-widest block mb-1.5">
              Seq length: <span className="text-white">{seqLen}</span>
            </label>
            <input type="range" min={20} max={120} step={10} value={seqLen}
              onChange={e => setSeqLen(+e.target.value)}
              className="w-full accent-accent" />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={retrain} onChange={e => setRetrain(e.target.checked)}
                className="accent-accent" />
              <span className="text-xs text-muted">Force retrain</span>
            </label>
          </div>

          <div className="flex items-end">
            {!running ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent text-accent rounded-md text-xs hover:bg-accent/20 transition-all w-full justify-center"
              >
                <Play size={12} /> Start Training
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-2 bg-red/10 border border-red text-red rounded-md text-xs hover:bg-red/20 transition-all w-full justify-center"
              >
                <StopCircle size={12} /> Stop
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* live progress */}
      {epochInfo && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric label="Epoch" value={`${epochInfo.epoch} / ${epochInfo.total}`} />
          <Metric label="Progress"
            value={`${Math.round(epochInfo.epoch / epochInfo.total * 100)}%`}
            color="text-accent" />
          <Metric label="Train Loss" value={epochInfo.train_loss?.toFixed(5)} color="text-purple" />
          <Metric label="Val Loss"   value={epochInfo.val_loss?.toFixed(5) ?? '—'} color="text-amber" />
        </div>
      )}

      {/* loss chart */}
      {trainLoss.length > 0 && (
        <Card>
          <CardTitle>Training Loss</CardTitle>
          <LossChart trainLoss={trainLoss} valLoss={valLoss} />
        </Card>
      )}

      {/* console */}
      <Card>
        <CardTitle>Training Console</CardTitle>
        <TrainingConsole logs={logs} running={running} />
      </Card>

      {/* results */}
      {result && (
        <Card className="border-green/30">
          <CardTitle>Training Complete</CardTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Metric label="MAE"      value={`$${result.metrics.mae.toFixed(2)}`}       color="text-green" />
            <Metric label="RMSE"     value={`$${result.metrics.rmse.toFixed(2)}`}      color="text-green" />
            <Metric label="MAPE"     value={`${result.metrics.mape.toFixed(2)}%`}      color="text-amber" />
            <Metric label="Accuracy" value={`${result.metrics.accuracy.toFixed(2)}%`}  color="text-accent" />
          </div>
          <p className="text-xs text-muted">
            Model saved. Go to{' '}
            <a href="/predict" className="text-accent hover:underline">Predict</a>{' '}
            to see the {result.forecast?.length}-day forecast.
          </p>
        </Card>
      )}
    </div>
  )
}
