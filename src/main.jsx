import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { realTimeMonitoring } from './utils/seoMonitoring.js'
import { initializeConsoleManagement, logAppEvent } from './utils/consoleUtils.js'

// Initialize console management (filters browser extension warnings)
initializeConsoleManagement()

// Initialize SEO monitoring
if (typeof window !== 'undefined') {
  realTimeMonitoring.start()
  logAppEvent('Application Starting', { 
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
