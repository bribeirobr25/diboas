import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useMemo, useEffect, lazy, Suspense } from 'react';
import ErrorBoundary from './components/shared/ErrorBoundary.jsx'
import LoadingScreen from './components/shared/LoadingScreen.jsx'

// Lazy load ALL non-critical components for better performance and smaller bundles
const LandingPage = lazy(() => import('./components/LandingPage.jsx'))
const AuthPage = lazy(() => import('./components/AuthPage.jsx'))
const AppDashboard = lazy(() => import('./components/AppDashboard.jsx'))
const AccountView = lazy(() => import('./components/AccountView.jsx'))
const TransactionPage = lazy(() => import('./components/TransactionPage.jsx'))
const EnvironmentDebugPanel = lazy(() => import('./components/debug/EnvironmentDebugPanel.jsx'))
const PerformanceDashboard = lazy(() => import('./components/dev/PerformanceDashboard.jsx'))

// Lazy load providers and utilities
const FeatureFlagProvider = lazy(() => import('./hooks/useFeatureFlags.jsx').then(module => ({ default: module.FeatureFlagProvider })))
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
  }, [envInfo.debugMode, envInfo.environment, envInfo.region, envInfo.version, envInfo.baseUrl, validation.isValid, validation.issues])
  
  // Memoize initial user context to prevent unnecessary re-renders
  const initialUserContext = useMemo(() => ({
    userId: envInfo.debugMode ? 'dev_user_123' : null,
    segment: envInfo.debugMode ? 'beta_users' : 'all',
    region: envInfo.region
  }), [envInfo.debugMode, envInfo.region])

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <FeatureFlagProvider initialUserContext={initialUserContext}>
            <Router>
              <Routes>
                <Route path="/" element={
                  <Suspense fallback={<LoadingScreen />}>
                    <LandingPage />
                  </Suspense>
                } />
              <Route path="/auth" element={
                <Suspense fallback={<LoadingScreen />}>
                  <AuthPage />
                </Suspense>
              } />
              <Route path="/app" element={
                <Suspense fallback={<LoadingScreen />}>
                  <AppDashboard />
                </Suspense>
              } />
              <Route path="/account" element={
                <Suspense fallback={<LoadingScreen />}>
                  <AccountView />
                </Suspense>
              } />
              
              {/* RESTful Transaction Routes */}
              <Route path="/add" element={
                <Suspense fallback={<LoadingScreen />}>
                  <TransactionPage transactionType="add" />
                </Suspense>
              } />
              <Route path="/send" element={
                <Suspense fallback={<LoadingScreen />}>
                  <TransactionPage transactionType="send" />
                </Suspense>
              } />
              <Route path="/receive" element={
                <Suspense fallback={<LoadingScreen />}>
                  <TransactionPage transactionType="receive" />
                </Suspense>
              } />
              <Route path="/buy" element={
                <Suspense fallback={<LoadingScreen />}>
                  <TransactionPage transactionType="buy" />
                </Suspense>
              } />
              <Route path="/sell" element={
                <Suspense fallback={<LoadingScreen />}>
                  <TransactionPage transactionType="sell" />
                </Suspense>
              } />
              <Route path="/transfer" element={
                <Suspense fallback={<LoadingScreen />}>
                  <TransactionPage transactionType="transfer" />
                </Suspense>
              } />
              <Route path="/withdraw" element={
                <Suspense fallback={<LoadingScreen />}>
                  <TransactionPage transactionType="withdraw" />
                </Suspense>
              } />
              <Route path="/invest" element={
                <Suspense fallback={<LoadingScreen />}>
                  <TransactionPage transactionType="invest" />
                </Suspense>
              } />
              
              {/* Legacy transaction route for backward compatibility */}
              <Route path="/transaction" element={
                <Suspense fallback={<LoadingScreen />}>
                  <TransactionPage />
                </Suspense>
              } />
            </Routes>
            
            {/* Development Tools - Only load in development */}
            {envInfo.debugMode && (
              <>
                <Suspense fallback={<div>Loading debug panel...</div>}>
                  <EnvironmentDebugPanel />
                </Suspense>
                <Suspense fallback={null}>
                  <PerformanceDashboard />
                </Suspense>
              </>
            )}
          </Router>
        </FeatureFlagProvider>
        </Suspense>
      </ErrorBoundary>
    </HelmetProvider>
  )
}

export default App

