import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
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
const AssetDetailPage = lazy(() => import('./components/AssetDetailPage.jsx'))
const EnvironmentDebugPanel = lazy(() => import('./components/debug/EnvironmentDebugPanel.jsx'))
const PerformanceDashboard = lazy(() => import('./components/dev/PerformanceDashboard.jsx'))

// Category pages
const BankingCategory = lazy(() => import('./components/categories/BankingCategory.jsx'))
const InvestmentCategory = lazy(() => import('./components/categories/InvestmentCategory.jsx'))
const YieldCategory = lazy(() => import('./components/categories/YieldCategory.jsx'))

// Yield strategy pages
const ObjectiveConfig = lazy(() => import('./components/yield/ObjectiveConfig.jsx'))
const StrategyManager = lazy(() => import('./components/yield/StrategyManager.jsx'))

// Lazy load providers and utilities
const FeatureFlagProvider = lazy(() => import('./hooks/useFeatureFlags.jsx').then(module => ({ default: module.FeatureFlagProvider })))
import { validateEnvironment, getEnvironmentInfo } from './config/environments.js'
import { resetToCleanState, isCleanState } from './utils/resetDataForTesting.js'
import { initializeLocalStorageCleanup } from './utils/localStorageHelper.js'
import { dataManager } from './services/DataManager.js'
import './App.css'
import './styles/dashboard.css'
import './styles/categories.css'

// Inner component that has access to navigate hook
function AppRoutes({ initialUserContext, envInfo }) {
  const navigate = useNavigate()
  
  // Listen for error boundary navigation events
  useEffect(() => {
    const handleNavigateHome = (event) => {
      const destination = event.detail?.destination || '/app'
      navigate(destination)
    }
    
    window.addEventListener('diboas-navigate-home', handleNavigateHome)
    return () => window.removeEventListener('diboas-navigate-home', handleNavigateHome)
  }, [navigate])

  return (
    <ErrorBoundary navigate={navigate}>
      <Suspense fallback={<LoadingScreen />}>
        <FeatureFlagProvider initialUserContext={initialUserContext}>
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
          
          {/* Category-based Transaction Routes */}
          {/* Banking Transactions */}
          <Route path="/category/banking/add" element={
            <Suspense fallback={<LoadingScreen />}>
              <TransactionPage transactionType="add" category="banking" />
            </Suspense>
          } />
          <Route path="/category/banking/send" element={
            <Suspense fallback={<LoadingScreen />}>
              <TransactionPage transactionType="send" category="banking" />
            </Suspense>
          } />
          <Route path="/category/banking/withdraw" element={
            <Suspense fallback={<LoadingScreen />}>
              <TransactionPage transactionType="withdraw" category="banking" />
            </Suspense>
          } />
          
          {/* Investment Transactions */}
          <Route path="/category/investment/buy" element={
            <Suspense fallback={<LoadingScreen />}>
              <TransactionPage transactionType="buy" category="investment" />
            </Suspense>
          } />
          <Route path="/category/investment/sell" element={
            <Suspense fallback={<LoadingScreen />}>
              <TransactionPage transactionType="sell" category="investment" />
            </Suspense>
          } />
          
          {/* Legacy routes for backward compatibility */}
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
          
          {/* Category Routes */}
          <Route path="/category/banking" element={
            <Suspense fallback={<LoadingScreen />}>
              <BankingCategory />
            </Suspense>
          } />
          <Route path="/category/investment" element={
            <Suspense fallback={<LoadingScreen />}>
              <InvestmentCategory />
            </Suspense>
          } />
          <Route path="/category/yield" element={
            <Suspense fallback={<LoadingScreen />}>
              <YieldCategory />
            </Suspense>
          } />
          
          {/* Asset Detail Route */}
          <Route path="/asset/:symbol" element={
            <Suspense fallback={<LoadingScreen />}>
              <AssetDetailPage />
            </Suspense>
          } />
          
          {/* Yield Strategy Routes */}
          <Route path="/yield/configure" element={
            <Suspense fallback={<LoadingScreen />}>
              <ObjectiveConfig />
            </Suspense>
          } />
          <Route path="/yield/manage" element={
            <Suspense fallback={<LoadingScreen />}>
              <StrategyManager />
            </Suspense>
          } />
          <Route path="/yield/custom" element={
            <Suspense fallback={<LoadingScreen />}>
              <ObjectiveConfig />
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
      </FeatureFlagProvider>
      </Suspense>
    </ErrorBoundary>
  )
}

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
        
        // Initialize data state - preserve user data, only reset if corrupted
        console.log('📊 Initializing data state...')
        
        // Initialize localStorage cleanup to prevent corruption
        initializeLocalStorageCleanup()
        
        // Only reset to clean state if there's corrupted data, not if user has real data
        const currentBalance = dataManager.getBalance()
        const currentTransactions = dataManager.getTransactions()
        
        // Check for data corruption (null/undefined values that shouldn't be)
        const hasCorruptedData = (
          !currentBalance || 
          typeof currentBalance.totalUSD !== 'number' ||
          typeof currentBalance.availableForSpending !== 'number' ||
          typeof currentBalance.investedAmount !== 'number' ||
          !Array.isArray(currentTransactions)
        )
        
        if (hasCorruptedData) {
          console.log('⚠️ Found corrupted data, resetting to clean state')
          resetToCleanState()
        } else {
          console.log('✅ Data is valid, preserving user data:', {
            totalBalance: currentBalance.totalUSD,
            transactions: currentTransactions.length
          })
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
      <Router>
        <AppRoutes initialUserContext={initialUserContext} envInfo={envInfo} />
      </Router>
    </HelmetProvider>
  )
}

export default App

