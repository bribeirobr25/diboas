import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useMemo, useEffect, lazy, Suspense } from 'react';
import ErrorBoundary from './components/errorHandling/ErrorBoundary.jsx'
import LoadingScreen from './components/shared/LoadingScreen.jsx'
import { initializeCodeSplitting, chunkPreloader } from './utils/codesplitting.js'
import { initializeBundleOptimization } from './utils/bundleOptimization.js'
import { initializeCacheSystem } from './utils/caching/CacheManager.js'
import logger from './utils/logger'
import { 
  detectCurrentSubdomain, 
  navigateToSubdomain, 
  isRouteValidForSubdomain,
  initializeSubdomainConfig,
  SUBDOMAINS 
} from './config/subdomains.js'

// Lazy load ALL non-critical components for better performance and smaller bundles
const LandingPage = lazy(() => import('./components/LandingPage.jsx'))
const AuthPage = lazy(() => import('./components/AuthPage.jsx'))
const AppDashboard = lazy(() => import('./components/AppDashboard.jsx'))
const AccountView = lazy(() => import('./components/AccountView.jsx'))
const TransactionPage = lazy(() => import('./components/TransactionPage.jsx'))
const AssetDetailPage = lazy(() => import('./components/AssetDetailPage.jsx'))
const EnvironmentDebugPanel = lazy(() => import('./components/debug/EnvironmentDebugPanel.jsx'))
// Admin/Internal Monitoring Components (for internal use only)
const PerformanceDashboard = lazy(() => import('./components/monitoring/PerformanceDashboard.jsx'))
const SecurityDashboard = lazy(() => import('./components/monitoring/SecurityDashboard.jsx'))
const ErrorRecoveryDashboard = lazy(() => import('./components/errorHandling/ErrorRecoveryDashboard.jsx'))
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard.jsx'))

// Category pages
const BankingCategory = lazy(() => import('./components/categories/BankingCategory.jsx'))
const InvestmentCategory = lazy(() => import('./components/categories/InvestmentCategory.jsx'))
const YieldCategory = lazy(() => import('./components/categories/YieldCategoryNew.jsx'))

// Yield strategy pages
const StrategyConfigurationWizard = lazy(() => import('./components/yield/StrategyConfigurationWizard.jsx'))
const StrategyManager = lazy(() => import('./components/yield/StrategyManager.jsx'))
const YieldErrorBoundary = lazy(() => import('./components/yield/YieldErrorBoundary.jsx'))

// Error pages
const NotFoundErrorPage = lazy(() => import('./components/shared/ErrorPages.jsx').then(module => ({ default: module.NotFoundErrorPage })))
const ServerErrorPage = lazy(() => import('./components/shared/ErrorPages.jsx').then(module => ({ default: module.ServerErrorPage })))
const NetworkErrorPage = lazy(() => import('./components/shared/ErrorPages.jsx').then(module => ({ default: module.NetworkErrorPage })))

// Lazy load providers and utilities
const FeatureFlagProvider = lazy(() => import('./hooks/useFeatureFlags.jsx').then(module => ({ default: module.FeatureFlagProvider })))
import { validateEnvironment, getEnvironmentInfo } from './config/environments.js'
import { resetToCleanState } from './utils/resetDataForTesting.js'
import { initializeLocalStorageCleanup } from './utils/localStorageHelper.js'
import { dataManager } from './services/DataManager.js'
import './App.css'
import './styles/dashboard.css'
import './styles/categories.css'

// Subdomain-aware routing component
function SubdomainRouter({ children, currentSubdomain, currentPath }) {
  // Check if current route is valid for current subdomain
  const isValidRoute = isRouteValidForSubdomain(currentPath, currentSubdomain)
  
  // Determine correct subdomain for this route
  const targetSubdomain = useMemo(() => {
    if (isValidRoute) return null
    
    if (currentPath === '/' || currentPath === '/auth' || currentPath.startsWith('/about')) {
      return SUBDOMAINS.WWW
    } else if (currentPath.startsWith('/docs')) {
      return SUBDOMAINS.DOCS
    } else if (currentPath.startsWith('/admin')) {
      return SUBDOMAINS.ADMIN
    }
    return SUBDOMAINS.APP
  }, [isValidRoute, currentPath])
  
  // Redirect to correct subdomain (hook must be called unconditionally)
  useEffect(() => {
    if (!import.meta.env.DEV && !isValidRoute && targetSubdomain) {
      navigateToSubdomain(targetSubdomain, currentPath, true)
    }
  }, [isValidRoute, targetSubdomain, currentPath])
  
  // Development environment - allow all routes on localhost
  if (import.meta.env.DEV) {
    return children
  }
  
  // Production/staging - show loading screen during redirect
  if (!isValidRoute && targetSubdomain) {
    return <LoadingScreen />
  }
  
  return children
}

// Inner component that has access to navigate hook
function AppRoutes({ initialUserContext, envInfo }) {
  const navigate = useNavigate()
  const currentSubdomain = useMemo(() => detectCurrentSubdomain(), [])
  const currentPath = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname
    }
    return '/'
  }, [])
  
  // Listen for error boundary navigation events and preload routes
  useEffect(() => {
    const handleNavigateHome = (event) => {
      const destination = event.detail?.destination || '/app'
      navigate(destination)
    }
    
    // Preload chunks based on current route
    chunkPreloader.preloadForRoute(currentPath)
    
    window.addEventListener('diboas-navigate-home', handleNavigateHome)
    return () => window.removeEventListener('diboas-navigate-home', handleNavigateHome)
  }, [navigate, currentPath])

  return (
    <ErrorBoundary navigate={navigate}>
      <SubdomainRouter currentSubdomain={currentSubdomain} currentPath={currentPath}>
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
              <YieldErrorBoundary>
                <StrategyConfigurationWizard />
              </YieldErrorBoundary>
            </Suspense>
          } />
          <Route path="/yield/manage" element={
            <Suspense fallback={<LoadingScreen />}>
              <YieldErrorBoundary>
                <StrategyManager />
              </YieldErrorBoundary>
            </Suspense>
          } />
          <Route path="/yield/strategy/:strategyId" element={
            <Suspense fallback={<LoadingScreen />}>
              <YieldErrorBoundary>
                <StrategyManager />
              </YieldErrorBoundary>
            </Suspense>
          } />
          
          {/* Admin/Internal Monitoring Routes - For internal use only */}
          <Route path="/admin/performance" element={
            <Suspense fallback={<LoadingScreen />}>
              <PerformanceDashboard />
            </Suspense>
          } />
          
          <Route path="/admin/security" element={
            <Suspense fallback={<LoadingScreen />}>
              <SecurityDashboard />
            </Suspense>
          } />
          
          <Route path="/admin/errors" element={
            <Suspense fallback={<LoadingScreen />}>
              <ErrorRecoveryDashboard />
            </Suspense>
          } />
          
          {/* Admin Dashboard Overview */}
          <Route path="/admin" element={
            <Suspense fallback={<LoadingScreen />}>
              <AdminDashboard />
            </Suspense>
          } />
          
          {/* Legacy transaction route for backward compatibility */}
          <Route path="/transaction" element={
            <Suspense fallback={<LoadingScreen />}>
              <TransactionPage />
            </Suspense>
          } />

          {/* Error Pages */}
          <Route path="/error/500" element={
            <Suspense fallback={<LoadingScreen />}>
              <ServerErrorPage />
            </Suspense>
          } />
          
          <Route path="/error/network" element={
            <Suspense fallback={<LoadingScreen />}>
              <NetworkErrorPage />
            </Suspense>
          } />

          {/* 404 Catch-all Route - Must be last */}
          <Route path="*" element={
            <Suspense fallback={<LoadingScreen />}>
              <NotFoundErrorPage />
            </Suspense>
          } />
        </Routes>
        
        {/* Development Tools - Only load in development */}
        {envInfo.debugMode && (
          <Suspense fallback={<div>Loading debug panel...</div>}>
            <EnvironmentDebugPanel />
          </Suspense>
        )}
          </FeatureFlagProvider>
        </Suspense>
      </SubdomainRouter>
    </ErrorBoundary>
  )
}

function App() {
  // Memoize environment validation to prevent re-running on every render
  const validation = useMemo(() => validateEnvironment(), [])
  const envInfo = useMemo(() => getEnvironmentInfo(), [])
  
  // Initialize app setup once with useEffect instead of on every render
  useEffect(() => {
    // Initialize performance optimizations
    initializeBundleOptimization()
    initializeCodeSplitting()
    initializeCacheSystem()
    
    // Performance monitoring disabled for cleaner development experience
    // (Available through /admin routes for internal teams)
    
    // Initialize security monitoring
    import('./services/DataManager.js').then(({ dataManager }) => {
      dataManager.startSecurityMonitoring()
      logger.info('Security monitoring initialized')
    }).catch(error => {
      logger.warn('Failed to initialize security monitoring:', error)
    })
    
    // Initialize error recovery
    import('./services/DataManager.js').then(({ dataManager }) => {
      dataManager.startErrorRecovery()
      logger.info('Error recovery initialized')
    }).catch(error => {
      logger.warn('Failed to initialize error recovery:', error)
    })
    
    // Initialize subdomain configuration
    const subdomainConfig = initializeSubdomainConfig()
    
    // Log environment info in development (throttled to avoid React StrictMode duplicates)
    if (envInfo.debugMode) {
      const logKey = 'diboas_app_logged'
      if (!window[logKey]) {
        window[logKey] = true
        console.group('🚀 diBoaS Application Started')
        logger.debug('Environment:', envInfo.environment)
        logger.debug('Region:', envInfo.region)
        logger.debug('Version:', envInfo.version)
        logger.debug('API Base:', envInfo.baseUrl)
        logger.debug('Debug Mode:', envInfo.debugMode)
        logger.debug('Subdomain:', subdomainConfig.subdomain)
        logger.debug('Security Policy:', subdomainConfig.security)
        logger.debug('Performance Config:', subdomainConfig.performance)
        
        // Initialize data state - preserve user data, only reset if corrupted
        logger.debug('📊 Initializing data state...')
        
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
          logger.debug('⚠️ Found corrupted data, resetting to clean state')
          resetToCleanState()
        } else {
          logger.debug('✅ Data is valid, preserving user data:', {
            totalBalance: currentBalance.totalUSD,
            transactions: currentTransactions.length
          })
        }
        
        if (!validation.isValid) {
          logger.warn('Configuration Issues:', validation.issues)
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

