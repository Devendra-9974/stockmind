// import axios from 'axios'

// const api = axios.create({ baseURL: '/api' })

// // ── Stocks ──────────────────────────────────────────────────
// export const getQuote    = (ticker)         => api.get(`/stocks/quote/${ticker}`)
// export const getHistory  = (ticker, period) => api.get(`/stocks/history/${ticker}`, { params: { period } })
// export const getInfo     = (ticker)         => api.get(`/stocks/info/${ticker}`)
// export const getPopular  = ()               => api.get('/stocks/popular')
// export const getModels   = ()               => api.get('/stocks/models')

// // ── Train ───────────────────────────────────────────────────
// export const startTraining = (payload) => api.post('/train/start', payload)
// export const getJobStatus  = (jobId)   => api.get(`/train/status/${jobId}`)

// export function streamTraining(jobId, handlers) {
//   const es = new EventSource(`/api/train/stream/${jobId}`)
//   es.addEventListener('epoch',  e => handlers.onEpoch?.(JSON.parse(e.data)))
//   es.addEventListener('status', e => handlers.onStatus?.(JSON.parse(e.data)))
//   es.addEventListener('done',   e => { handlers.onDone?.(JSON.parse(e.data)); es.close() })
//   es.addEventListener('error',  e => { handlers.onError?.(e); es.close() })
//   return es
// }

// // ── Predict ─────────────────────────────────────────────────
// export const getForecast   = (payload) => api.post('/predict/forecast', payload)
// export const getPredHistory = (ticker, period) =>
//   api.get(`/predict/history/${ticker}`, { params: { period } })

// // ── Health ──────────────────────────────────────────────────
// export const getHealth = () => axios.get('/health')


import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({ baseURL: BASE + '/api' })

// ── Stocks ──────────────────────────────────────────────────
export const getQuote    = (ticker)         => api.get(`/stocks/quote/${ticker}`)
export const getHistory  = (ticker, period) => api.get(`/stocks/history/${ticker}`, { params: { period } })
export const getInfo     = (ticker)         => api.get(`/stocks/info/${ticker}`)
export const getPopular  = ()               => api.get('/stocks/popular')
export const getModels   = ()               => api.get('/stocks/models')

// ── Train ───────────────────────────────────────────────────
export const startTraining = (payload) => api.post('/train/start', payload)
export const getJobStatus  = (jobId)   => api.get(`/train/status/${jobId}`)

export function streamTraining(jobId, handlers) {
  const url = `${BASE}/api/train/stream/${jobId}`
  const es  = new EventSource(url)
  es.addEventListener('epoch',  e => handlers.onEpoch?.(JSON.parse(e.data)))
  es.addEventListener('status', e => handlers.onStatus?.(JSON.parse(e.data)))
  es.addEventListener('done',   e => { handlers.onDone?.(JSON.parse(e.data)); es.close() })
  es.addEventListener('error',  e => { handlers.onError?.(e); es.close() })
  return es
}

// ── Predict ─────────────────────────────────────────────────
export const getForecast    = (payload)        => api.post('/predict/forecast', payload)
export const getPredHistory = (ticker, period) => api.get(`/predict/history/${ticker}`, { params: { period } })

// ── Health ──────────────────────────────────────────────────
export const getHealth = () => axios.get(`${BASE}/health`)