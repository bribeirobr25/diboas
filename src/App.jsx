import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useMemo, useEffect } from 'react';
import LandingPage from './components/LandingPage.jsx'
import AuthPage from './components/AuthPage.jsx'
import AppDashboard from './components/AppDashboard.jsx'
import AccountView from './components/AccountView.jsx'
import TransactionPage from './components/TransactionPage.jsx'
import ErrorBoundary from './components/shared/ErrorBoundary.jsx'
import { FeatureFlagProvider } from './hooks/useFeatureFlags.jsx'
import EnvironmentDebugPanel from './components/debug/EnvironmentDebugPanel.jsx'
import { validateEnvironment, getEnvironmentInfo } from './config/environments.js'
import { resetToCleanState, isCleanState } from './utils/resetDataForTesting.js'
import { initializeLocalStorageCleanup } from './utils/localStorageHelper.js'
import './App.css'

function App() {
  // Memoize environment validation to prevent re-running on every render
  const validation = useMemo(() => validateEnvironment(), [])
  const envInfo = useMemo(() => getEnvironmentInfo(), [])
  
  // Initialize app setup once with useEffect instead of on every render
  useEffect(() => {
    // Log environment info in development (throttled to avoid React StrictMode duplicates)
    if (envInfo.debugMode) {
      const logKey = 'diboas_app_logged'
      if (!window[logKey]) {
        window[logKey] = true
        console.group('🚀 diBoaS Application Started')
        console.log('Environment:', envInfo.environment)
        console.log('Region:', envInfo.region)
        console.log('Version:', envInfo.version)
        console.log('API Base:', envInfo.baseUrl)
        console.log('Debug Mode:', envInfo.debugMode)
        
        // Initialize clean data state for testing
        console.log('📊 Initializing clean data state for testing...')
        
        // Initialize localStorage cleanup to prevent corruption
        initializeLocalStorageCleanup()
        
        if (!isCleanState()) {
          console.log('⚠️ Data is not clean, resetting to clean state')
          resetToCleanState()
        } else {
          console.log('✅ Data is already in clean state')
        }
        
        if (!validation.isValid) {
          console.warn('Configuration Issues:', validation.issues)
        }
        console.groupEnd()
      }
    }

    // Cleanup function to remove window property on unmount
    return () => {
      if (window.diboas_app_logged) {
        delete window.diboas_app_logged
      }
    }
  }, [envInfo.debugMode, validation.isValid, validation.issues])
  
  // Memoize initial user context to prevent unnecessary re-renders
  const initialUserContext = useMemo(() => ({
    userId: envInfo.debugMode ? 'dev_user_123' : null,
    segment: envInfo.debugMode ? 'beta_users' : 'all',
    region: envInfo.region
  }), [envInfo.debugMode, envInfo.region])

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <FeatureFlagProvider initialUserContext={initialUserContext}>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/app" element={<AppDashboard />} />
              <Route path="/account" element={<AccountView />} />
              
              {/* RESTful Transaction Routes */}
              <Route path="/add" element={<TransactionPage transactionType="add" />} />
              <Route path="/send" element={<TransactionPage transactionType="send" />} />
              <Route path="/receive" element={<TransactionPage transactionType="receive" />} />
              <Route path="/buy" element={<TransactionPage transactionType="buy" />} />
              <Route path="/sell" element={<TransactionPage transactionType="sell" />} />
              <Route path="/transfer" element={<TransactionPage transactionType="transfer" />} />
              <Route path="/withdraw" element={<TransactionPage transactionType="withdraw" />} />
              <Route path="/invest" element={<TransactionPage transactionType="invest" />} />
              
              {/* Legacy transaction route for backward compatibility */}
              <Route path="/transaction" element={<TransactionPage />} />
            </Routes>
            
            {/* Development Debug Panel */}
            <EnvironmentDebugPanel />
          </Router>
        </FeatureFlagProvider>
      </ErrorBoundary>
    </HelmetProvider>
  )
}

export default App

