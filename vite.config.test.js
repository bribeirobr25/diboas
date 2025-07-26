import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    
    // Test optimizations
    testTimeout: 10000, // Increase timeout for integration tests
    hookTimeout: 30000, // Increase hook timeout
    teardownTimeout: 10000,
    
    // Pool settings for better performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Use single thread for more stable tests
      }
    },
    
    // Test retry settings
    retry: 1, // Retry failed tests once
    
    // Reporter settings
    reporter: 'default',
    
    // Silent mode for faster tests
    silent: false,
    
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/e2e/**',
      '**/src/test/e2e/**'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.test.{js,jsx}',
        'src/**/*.spec.{js,jsx}',
        'src/test/**',
        'src/main.jsx'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})