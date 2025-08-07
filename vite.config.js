import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react(),tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'process.env': {},
    // PERFORMANCE: Define globals for dead code elimination
    __DEV__: false,
    __TEST__: false,
  },
  build: {
    // Optimize chunk sizes
    chunkSizeWarningLimit: 300,
    
    // AGGRESSIVE OPTIMIZATION: Disable source maps in production for smaller bundles
    sourcemap: false,
    
    // AGGRESSIVE MINIFICATION
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console calls
        passes: 2, // Multiple passes for better compression
      },
      mangle: {
        safari10: true, // Better compatibility
      },
      format: {
        comments: false, // Remove all comments
      },
    },
    
    rollupOptions: {
      // TREE SHAKING: Enable aggressive dead code elimination
      treeshake: {
        moduleSideEffects: false, // Assume modules have no side effects
        propertyReadSideEffects: false, // Assume property reads have no side effects
        tryCatchDeoptimization: false, // Don't deoptimize try-catch
        unknownGlobalSideEffects: false, // Assume unknown globals have no side effects
      },
      external: [
        // Exclude test files from production builds
        /\.test\./,
        /__tests__/,
        /vitest/,
        /test-utils/
      ],
      input: {
        main: './index.html'
      },
      output: {
        // Enhanced chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            const name = facadeModuleId.split('/').pop().replace('.jsx', '').replace('.js', '')
            return `chunks/${name}-[hash].js`
          }
          return 'chunks/[name]-[hash].js'
        },
        entryFileNames: 'entries/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name.split('.').pop()
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (/css/i.test(extType)) {
            return 'assets/styles/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
        manualChunks: (id) => {
          // ENHANCED MICRO-CHUNKING: Split vendor into smaller pieces for better caching
          if (id.includes('node_modules/react-dom')) {
            return 'vendor-react-dom'
          }
          if (id.includes('node_modules/react') && !id.includes('react-dom')) {
            return 'vendor-react-core'
          }
          if (id.includes('node_modules/react-router')) {
            return 'vendor-react-router'
          }
          if (id.includes('node_modules/react-helmet')) {
            return 'vendor-react-helmet'
          }
          
          // Animation and UI libraries
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-animations'
          }
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-radix-ui'
          }
          
          // Icon libraries - separate chunk
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons'
          }
          
          // Math/crypto libraries
          if (id.includes('node_modules/decimal.js') || id.includes('node_modules/crypto')) {
            return 'vendor-math-crypto'
          }
          
          // Date and time libraries
          if (id.includes('node_modules/date-fns') || id.includes('node_modules/moment')) {
            return 'vendor-datetime'
          }
          
          // Utility libraries
          if (id.includes('node_modules/lodash') || id.includes('node_modules/ramda')) {
            return 'vendor-utils'
          }
          
          // Form and validation libraries
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/yup') || id.includes('node_modules/zod')) {
            return 'vendor-forms'
          }
          
          // Other vendor dependencies
          if (id.includes('node_modules/')) {
            return 'vendor-misc'
          }
          
          // Core financial logic - keep together for performance
          if (id.includes('src/utils/feeCalculations.js') || 
              id.includes('src/domains/shared/value-objects/Money.js') ||
              id.includes('src/services/DataManager.js')) {
            return 'financial-core'
          }
          
          // Security utilities - separate for lazy loading
          if (id.includes('src/utils/secureStorage.js') ||
              id.includes('src/utils/finTechSecurity.js') ||
              id.includes('src/utils/secureCredentialManager.js')) {
            return 'security'
          }
          
          // Performance monitoring - conditional load
          if (id.includes('src/utils/performanceOptimizations.js') ||
              id.includes('src/utils/qualityAssurance.js') ||
              id.includes('src/components/PerformanceMonitor.jsx')) {
            return 'performance'
          }
          
          // MICRO-SPLIT: Transaction components by functionality
          if (id.includes('src/components/TransactionPage.jsx')) {
            return 'transaction-page'
          }
          if (id.includes('src/components/transactions/') && id.includes('Form')) {
            return 'transaction-forms'
          }
          if (id.includes('src/components/transactions/') && id.includes('History')) {
            return 'transaction-history'
          }
          if (id.includes('src/components/transactions/')) {
            return 'transaction-components'
          }
          if (id.includes('src/hooks/useTransactions.jsx')) {
            return 'transaction-hooks'
          }
          if (id.includes('src/services/transactions/')) {
            return 'transaction-services'
          }
          
          // ULTRA-MICRO-SPLIT: Integration services by specific provider type
          if (id.includes('src/services/integrations/IntegrationManager.js')) {
            return 'integration-manager'
          }
          if (id.includes('src/services/integrations/payments/providers/')) {
            return 'payment-providers'
          }
          if (id.includes('src/services/integrations/twofa/providers/')) {
            return 'twofa-providers'
          }
          if (id.includes('src/services/integrations/payments/')) {
            return 'payment-core'
          }
          if (id.includes('src/services/integrations/twofa/')) {
            return 'twofa-core'
          }
          if (id.includes('src/services/integrations/kyc/')) {
            return 'kyc-core'
          }
          if (id.includes('src/services/integrations/auth/')) {
            return 'auth-core'
          }
          if (id.includes('src/services/integrations/providers/')) {
            return 'integration-providers'
          }
          if (id.includes('src/services/integrations/adapters/')) {
            return 'integration-adapters'
          }
          if (id.includes('src/hooks/useIntegrations.jsx')) {
            return 'integration-hooks'
          }
          if (id.includes('src/services/integrations/')) {
            return 'integrations-misc'
          }
          
          // Debug components - lazy load only in development
          if (id.includes('src/components/debug/') ||
              id.includes('src/utils/consoleUtils.js') ||
              id.includes('src/utils/resetDataForTesting.js')) {
            return 'debug'
          }
          
          // UI utilities
          if (id.includes('src/components/ui/')) {
            return 'ui-kit'
          }
          
          // MICRO-SPLIT: SEO and monitoring utilities 
          if (id.includes('src/utils/seoUtils.js')) {
            return 'seo-utils'
          }
          if (id.includes('src/utils/seoMonitoring.js')) {
            return 'seo-monitoring'
          }
          
          // MICRO-SPLIT: Large utility files
          if (id.includes('src/utils/i18nUtils.js')) {
            return 'i18n'
          }
          if (id.includes('src/utils/accessibilityUtils.js')) {
            return 'accessibility'
          }
          
          // Test utilities - exclude from production
          if (id.includes('src/utils/testUtils.js') ||
              id.includes('.test.') ||
              id.includes('__tests__')) {
            return 'tests'
          }
        }
      }
    }
  }
})
