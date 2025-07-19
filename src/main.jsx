import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { realTimeMonitoring } from './utils/seoMonitoring.js'

// Initialize SEO monitoring
if (typeof window !== 'undefined') {
  realTimeMonitoring.start()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
