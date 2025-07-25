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
    'process.env': {}
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor'
          }
          
          // UI libraries
          if (id.includes('node_modules/lucide-react')) {
            return 'ui'
          }
          
          // Utility libraries  
          if (id.includes('node_modules/decimal.js')) {
            return 'utils'
          }
          
          // Financial and data management
          if (id.includes('src/utils/feeCalculations.js') || 
              id.includes('src/domains/shared/value-objects/Money.js') ||
              id.includes('src/services/DataManager.js')) {
            return 'financial'
          }
          
          // Transaction components
          if (id.includes('src/components/TransactionPage.jsx') ||
              id.includes('src/components/transactions/') ||
              id.includes('src/hooks/useTransactions.jsx')) {
            return 'transactions'
          }
          
          // Integration services
          if (id.includes('src/services/integrations/') ||
              id.includes('src/hooks/useIntegrations.jsx')) {
            return 'integrations'
          }
          
          // Debug components
          if (id.includes('src/components/debug/') ||
              id.includes('src/utils/consoleUtils.js')) {
            return 'debug'
          }
        }
      }
    },
    // Optimize chunk sizes
    chunkSizeWarningLimit: 500,
    
    // Enable source maps for better debugging
    sourcemap: true,
    
    // Use default minification
    minify: true
  }
})
